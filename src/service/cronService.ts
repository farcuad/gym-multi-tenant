import cron from 'node-cron';
import { query } from '../connect/connect.js';
import { whatsappClient } from '../config/Whatsapp.js';


interface Clients {
    cliente_nombre: string;
    telefono: string;
    fecha_membresia: string;
    gym_nombre: string;
    dias_para_vencer: number;
}

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
                (m.fecha_membresias::date - $1::date) AS dias_para_vencer
            FROM clients c
            JOIN memberships m ON m.client_id = c.id
            JOIN gyms g ON c.gym_id = g.id
            JOIN gym_subscriptions gs ON g.id = gs.gym_id
            WHERE (m.fecha_membresias::date - $1::date) IN (0, 3) 
              AND c.activo = true
              AND gs.status = 'active'
              AND gs.plan_type = 'Premium'
              AND gs.end_date >= CURRENT_DATE`;

            const result = await query(sql, [fechaHoyVzla]);
            const vencidos: Clients[] = result.rows;
            if (vencidos.length === 0) {
                console.log('No hay clientes con membresía vencida hoy.');
                return;
            }

            for(const cliente of vencidos) {
                let numeroLimpio = cliente.telefono.replace(/\D/g, ''); // Eliminar caracteres no numéricos
                if (numeroLimpio.startsWith('0')) {
                    numeroLimpio = '58' + numeroLimpio.substring(1);
                } 
                // Si no tiene el 58 al principio, se lo agregamos
                else if (!numeroLimpio.startsWith('58')) {
                    numeroLimpio = '58' + numeroLimpio;
                }

                const chatId = `${numeroLimpio}@c.us`;
                const fechaLimpia = new Date(cliente.fecha_membresia).toLocaleDateString('es-VE');

                let mensaje = "";
                 if (cliente.dias_para_vencer === 0) {
                     mensaje = `⏰ *¡VENCE HOY!* ⏰\n\nHola *${cliente.cliente_nombre}*, tu membresía en *${cliente.gym_nombre}* vence hoy *${fechaLimpia}*. ¡Te esperamos para renovar y seguir con tus metas! 💪🔥`;
                    } else {
                    mensaje = `🔔 *RECORDATORIO* 🔔\n\nHola *${cliente.cliente_nombre}*, te recordamos que tu membresía en *${cliente.gym_nombre}* vencerá en *3 días* *${fechaLimpia}*. ¡Anticípate y mantente activo! 🏋️‍♂️✨`;
                }

            try {
                if (whatsappClient && whatsappClient.info) {
                    await whatsappClient.sendMessage(chatId, mensaje);
                    console.log(`✅ [${cliente.dias_para_vencer === 0 ? 'HOY' : 'PREVENTIVO'}] Enviado a ${cliente.cliente_nombre}`);
                    
                    // Delay para evitar bloqueos (3 segundos está bien)
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            } catch (error) {
                console.error(`❌ Error con ${cliente.cliente_nombre}:`, error);
            }
            }
        }catch(error) {
            console.error('Error al ejecutar notificaciones:', error);
        }
};


export const startCronJobs = () => {
    cron.schedule('0 6 * * *', async () => {
        console.log('⏰ Iniciando tarea diaria de notificaciones de vencimiento...');
        await ejecutarNotifiaciones();
    }, {
        timezone: 'America/Caracas'
    });
}