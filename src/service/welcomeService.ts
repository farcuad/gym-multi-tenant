import { query } from '../connect/connect.js';
import axios from 'axios';
import { generarCarnetBuffer } from '../utils/htmlPdf.js';
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

export const sendMembershipNotification = async (data: NotificationData) => {
    try {
        const sql = `
            SELECT c.name, c.phone, g.name_gym 
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
        }

        console.log(`🗂️ Generando carnet para ${name}...`);
        const pdfBuffer = await generarCarnetBuffer({
            gymName: name_gym,
            userName: name,
            cedula: cedula || 'No proporcionada',
            phone: phone,
            planName: data.plan_name,
            idMembresia: data.id_membresia
        });

        await axios.post('http://localhost:3000/webhook/send-membership', {
            phone: num,
            message: mensaje,
            pdf: pdfBuffer.toString('base64'), // <--- Enviamos el PDF como base64
            filename: `Carnet_${name.replace(/\s+/g, '_')}.pdf`
        });
        console.log(`✅ Notificación de ${data.is_renewal ? 'RENOVACIÓN' : 'BIENVENIDA'} enviada a ${name}`);

    } catch (error) {
        console.error("❌ Error al enviar notificación de WhatsApp:", error);
    }
};