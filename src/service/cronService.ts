import cron from 'node-cron';
import { query } from '../connect/connect.js';
import { whatsappClient } from '../config/Whatsapp.js';


interface Clients {
    cliente_nombre: string;
    telefono: string;
    fecha_membresia: string;
    gym_nombre: string;
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
        try{
            const sql = `SELECT c.name AS cliente_nombre, 
           c.phone AS telefono, 
           m.fecha_membresias AS fecha_membresia, 
           g.name_gym AS gym_nombre
    FROM clients c
    JOIN memberships m ON m.client_id = c.id
    JOIN gyms g ON c.gym_id = g.id
    JOIN gym_subscriptions gs ON g.id = gs.gym_id
    WHERE m.fecha_membresias::date = $1::date -- Fuerza comparación de fecha pura
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
                const mensaje = `Hola *${cliente.cliente_nombre}*, tu membresía en *${cliente.gym_nombre}* vence hoy (${fechaLimpia}). ¡Renueva para seguir disfrutando de nuestros servicios!`;
                try{
                    await whatsappClient.sendMessage(chatId, mensaje);
                    console.log(`Mensaje enviado a ${cliente.cliente_nombre} (${cliente.telefono})`);

                    await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar 1 segundo entre mensajes
                }catch(error) {
                    console.error(`Error al enviar mensaje a ${cliente.cliente_nombre} (${cliente.telefono}):`, error);
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