import { query } from '../connect/connect.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generarCarnetBuffer } from '../utils/htmlPdf.js';
import dontenv from 'dotenv';
dontenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface NotificationData {
    client_id: number;
    gym_id: number;
    plan_name: string;
    price: number | string;
    fecha_inicio: string;
    fecha_vencimiento: string;
    is_renewal: boolean;
    id_membresia: number;
}

const WHAIBOT_URL = 'https://whaibot.com/api/send-message';
const WHAIBOT_BOT_ID = process.env.WHAIBOT_BOT_ID || '';
const WHAIBOT_CLIENT_KEY = process.env.WHAIBOT_CLIENT_KEY || '';
const BASE_URL = process.env.BASE_URL || '';

// Carpeta para almacenar carnets temporalmente
const CARNETS_DIR = path.join(__dirname, '..', '..', 'carnets');
if (!fs.existsSync(CARNETS_DIR)) {
    fs.mkdirSync(CARNETS_DIR, { recursive: true });
    console.log("📁 Carpeta 'carnets' creada automáticamente.");
}

const sendWhaibot = async (to: string, message: string) => {
    return await axios.post(WHAIBOT_URL, {
        botId: WHAIBOT_BOT_ID,
        to,
        message,
        fromMe: 'FitLog'
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-client-key': WHAIBOT_CLIENT_KEY
        }
    });
};

export const sendMembershipNotification = async (data: NotificationData) => {
    let carnetPath: string | null = null;

    try {
        const sql = `
            SELECT c.name, c.phone, c.cedula, g.name_gym 
            FROM clients c 
            JOIN gyms g ON c.gym_id = g.id 
            WHERE c.id = $1 AND g.id = $2
        `;
        const result = await query(sql, [data.client_id, data.gym_id]);
        
        if (result.rows.length === 0) return;

        const { name, phone, name_gym, cedula } = result.rows[0];

        // 1. Limpieza de número para Venezuela
        let num = phone.replace(/\D/g, '');
        if (num.startsWith('0')) num = '58' + num.substring(1);
        else if (!num.startsWith('58')) num = '58' + num;

        // 2. Formatear fechas de YYYY-MM-DD a DD/MM/YYYY para el mensaje
        const fInicio = data.fecha_inicio.split('-').reverse().join('/');
        const fFin = data.fecha_vencimiento.split('-').reverse().join('/');

        // 3. Definir mensajes según el tipo de acción
        let mensaje = "";

        if (data.is_renewal) {
            // Plantilla de Renovación
            mensaje = `✅ *¡MEMBRESÍA RENOVADA!* ✅\n\n` +
                      `Hola *${name}*, ¡qué bueno tenerte de vuelta en *${name_gym}*! 💪\n\n` +
                      `Tu renovación ha sido procesada con éxito:\n` +
                      `━━━━━━━━━━━━━━━━━━\n` +
                      `📦 *Plan:* ${data.plan_name}\n` +
                      `💵 *Inversión:* ${data.price}$\n` +
                      `📅 *Válida desde:* ${fInicio}\n` +
                      `📅 *Vence el:* ${fFin}\n` +
                      `━━━━━━━━━━━━━━━━━━\n\n` +
                      `¡Gracias por tu lealtad y por seguir entrenando con nosotros! 🔥🏋️‍♂️`;
        } else {
            console.log("🚀 Enviando notificación de bienvenida...");
            // Plantilla de Bienvenida
            mensaje = `🎉 *¡BIENVENIDO A ${name_gym.toUpperCase()}!* 🎉\n\n` +
                      `Hola *${name}*, nos emociona que te hayas unido a nuestra familia. 🙌\n\n` +
                      `Tu membresía ya está activa y lista para usar:\n` +
                      `━━━━━━━━━━━━━━━━━━\n` +
                      `🔥 *Plan Activo:* ${data.plan_name}\n` +
                      `💵 *Precio:* ${data.price}$\n` +
                      `🗓️ *Inicia:* ${fInicio}\n` +
                      `🗓️ *Vence:* ${fFin}\n` +
                      `━━━━━━━━━━━━━━━━━━\n\n` +
                      `Cualquier duda, estamos a tu disposición. ¡A darle con todo! 💪🔥`;

            // Generar carnet PDF, guardarlo y enviar URL de descarga
            console.log(`🗂️ Generando carnet para ${name}...`);
            const pdfBuffer = await generarCarnetBuffer({
                gymName: name_gym,
                userName: name,
                cedula: cedula || 'No proporcionada',
                phone: phone,
                planName: data.plan_name,
                idMembresia: data.id_membresia
            });

            const filename = `Carnet_${name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            carnetPath = path.join(CARNETS_DIR, filename);
            fs.writeFileSync(carnetPath, pdfBuffer);
            console.log(`📄 Carnet guardado temporalmente: ${filename}`);

            // Construir URL pública de descarga
            const downloadUrl = `${BASE_URL}/carnets/${filename}`;

            // Enviar mensaje con link de descarga del carnet
            await sendWhaibot(num, `📎 Aquí tienes tu carnet digital, *${name}*:\n${downloadUrl}`);
            console.log(`✅ Link de carnet enviado a ${name}`);
        }

        // Enviar mensaje de texto principal
        const response = await sendWhaibot(num, mensaje);
        console.log(`✅ Notificación de ${data.is_renewal ? 'RENOVACIÓN' : 'BIENVENIDA'} enviada a ${name}`);

        // Si se envió correctamente (201), ya no borramos aquí. 
        // El cron se encargará de borrar archivos con más de 1 hora de antigüedad.

    } catch (error) {
        console.error("❌ Error al enviar notificación de WhatsApp:", error);
    }
};