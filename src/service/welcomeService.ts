import { query } from '../connect/connect.js';
import { getbotsConfigById } from '../models/BotConfig.js';
import axios from 'axios';
import dontenv from 'dotenv';
dontenv.config();

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

const sendWhaibot = async (to: string, message: string, botId?: string, apiKey?: string) => {
    const id = botId || WHAIBOT_BOT_ID;
    const key = apiKey || WHAIBOT_CLIENT_KEY;

    if (!id || !key) {
        console.error('❌ Error: No se ha configurado el botId o apiKey para el envío de mensajes.');
        return;
    }

    return await axios.post(WHAIBOT_URL, {
        to,
        message,
        fromMe: 'FitLog'
    }, {
        headers: {
            'Content-Type': 'application/json',
            'x-client-key': key,
            'x-client-botid': id,
        }
    });
};

export const sendMembershipNotification = async (data: NotificationData) => {
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

        // Obtener configuración del bot para este gimnasio
        const botConfig = await getbotsConfigById(data.gym_id);
        const botId = botConfig?.whaibot_id;
        const apiKey = botConfig?.whaibot_key;

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
                `📱 *¡DESCARGA NUESTRA APP!* 📱\n` +
                `Para ingresar al gimnasio, ahora generas tu acceso desde nuestra aplicación:\n\n` +
                `1️⃣ Descarga la App aquí: https://frontend-gym-topaz.vercel.app/login\n` +
                `2️⃣ Ingresa con tu número de *Cédula*.\n` +
                `¡A darle con todo! 💪🔥`;
        }

        // Enviar mensaje de texto principal
        const response = await sendWhaibot(num, mensaje, botId, apiKey);
        console.log(`✅ Notificación de ${data.is_renewal ? 'RENOVACIÓN' : 'BIENVENIDA'} enviada a ${name}`);



    } catch (error) {
        console.error("❌ Error al enviar notificación de WhatsApp:", error);
    }
};