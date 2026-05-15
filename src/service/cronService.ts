import cron from 'node-cron';
import { query } from '../connect/connect.js';
import axios from 'axios';
import dontenv from 'dotenv';
dontenv.config();

interface Clients {
    cliente_nombre: string;
    telefono: string;
    fecha_membresia: string;
    gym_nombre: string;
    plan_nombre: string;
    dias_para_vencer: number;
    whaibot_id: string | null;
    whaibot_key: string | null;
}

const WHAIBOT_URL = 'https://whaibot.com/api/send-message';
const WHAIBOT_BOT_ID = process.env.WHAIBOT_BOT_ID || '';
const WHAIBOT_CLIENT_KEY = process.env.WHAIBOT_CLIENT_KEY || '';

const sendWhaibot = async (to: string, message: string, botId?: string, apiKey?: string) => {
    const id = botId || WHAIBOT_BOT_ID;
    const key = apiKey || WHAIBOT_CLIENT_KEY;

    if (!id || !key) {
        console.error('❌ Error: No se ha configurado el botId o apiKey para el envío de mensajes.');
        return;
    }

    await axios.post(WHAIBOT_URL, {
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

const getFechaVenezuela = () => {
    const fecha = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Caracas"}));
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`; // Devuelve "2026-03-24"
}

// Función para enviar mensajes programados
export const ejecutarNotifiaciones = async () => {
    const fechaHoyVzla = getFechaVenezuela();
    console.log('Ejecutando notificaciones para Fecha actual en Venezuela:', fechaHoyVzla);
            /**
             * SQL EXPLICACIÓN:
             * 1. Unimos 'clients' con 'memberships' mediante el id del cliente.
             * 2. Unimos 'clients' con 'gyms' mediante gym_id para el nombre del local.
             * 3. Filtramos por la columna 'fecha_membresias' de la tabla 'memberships'.
             */
            // SQL MODIFICADO: 
            // 1. Añadimos un campo 'dias_para_vencer' usando resta de fechas.
                // 2. Filtramos donde la diferencia sea 0 (hoy) O 3 (preventivo).
        try{
            const sql = `SELECT 
                c.name AS cliente_nombre, 
                c.phone AS telefono, 
                m.fecha_membresias AS fecha_membresia, 
                g.name_gym AS gym_nombre,
                m.plan_name_purchase AS plan_nombre,
                ((m.fecha_membresias AT TIME ZONE 'UTC' AT TIME ZONE 'America/Caracas')::date - $1::date) AS dias_para_vencer,
                gbc.whaibot_id,
                gbc.whaibot_key
            FROM clients c
            JOIN memberships m ON m.client_id = c.id
            JOIN gyms g ON c.gym_id = g.id
            JOIN gym_subscriptions gs ON g.id = gs.gym_id
            LEFT JOIN gym_bot_configs gbc ON g.id = gbc.gym_id
            WHERE ((m.fecha_membresias AT TIME ZONE 'UTC' AT TIME ZONE 'America/Caracas')::date - $1::date) IN (0, 3) 
              AND m.estado = 'activo'
              AND c.activo = true
              AND gs.status = 'active'
              AND gs.plan_type = 'Premium'
              AND gs.end_date >= $1::date`;

            const result = await query(sql, [fechaHoyVzla]);
            const vencidos: Clients[] = result.rows;
            if (vencidos.length === 0) {
                console.log('ℹ️ No hay clientes para notificar (Hoy o Preventivo 3 días).');
                return;
            }
            console.log(`📢 Procesando ${vencidos.length} notificaciones...`);

            for(const cliente of vencidos) {
                let numeroLimpio = cliente.telefono.replace(/\D/g, ''); // Eliminar caracteres no numéricos
                if (numeroLimpio.startsWith('0')) {
                    numeroLimpio = '58' + numeroLimpio.substring(1);
                } 
                // Si no tiene el 58 al principio, se lo agregamos
                else if (!numeroLimpio.startsWith('58')) {
                    numeroLimpio = '58' + numeroLimpio;
                }

                const fechaDate = new Date(cliente.fecha_membresia);
                const fechaLimpia = fechaDate.toLocaleDateString('es-VE', { timeZone: 'America/Caracas' });

                const diasRestantes = Number(cliente.dias_para_vencer);
                let mensaje = "";
                if (diasRestantes === 0) {
                     mensaje = `⏰ *¡VENCE HOY!* ⏰\n\nHola *${cliente.cliente_nombre}*, tu membresía de *${cliente.plan_nombre}* en *${cliente.gym_nombre}* vence hoy *${fechaLimpia}*. ¡Te esperamos para renovar y seguir con tus metas! 💪🔥`;
                   } else {
                    mensaje = `🔔 *RECORDATORIO* 🔔\n\nHola *${cliente.cliente_nombre}*, te recordamos que tu membresía de *${cliente.plan_nombre}* en *${cliente.gym_nombre}* vencerá en *3 días* (*${fechaLimpia}*). ¡Anticípate y mantente activo! 🏋️‍♂️✨`;
                }

                try {
                    await sendWhaibot(numeroLimpio, mensaje, cliente.whaibot_id || undefined, cliente.whaibot_key || undefined);
                    console.log(`✅ [${diasRestantes === 0 ? 'HOY' : 'PREVENTIVO'}] Enviado a ${cliente.cliente_nombre} (${numeroLimpio})`);
                
                // Delay para evitar bloqueos (3 segundos está bien)
                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
                console.error(`❌ Error con ${cliente.cliente_nombre}:`, error);
            }
            }
        }catch(error) {
            console.error('Error al ejecutar notificaciones:', error);
        }
};

export const startCronJobs = () => {
    // Tarea diaria de notificaciones de vencimiento (6 AM)
    cron.schedule('0 6 * * *', async () => {
        console.log('⏰ Iniciando tarea diaria de notificaciones de vencimiento...');
        await ejecutarNotifiaciones();
    }, {
        timezone: 'America/Caracas'
    });
}