import { query } from '../connect/connect.js';
import type { AccessTicket } from '../types/AccessTickets.js';

// ─── Lecturas ────────────────────────────────────────────────────────────────

/**
 * Obtiene el primer ingreso del cliente en el día actual (zona America/Caracas).
 * Retorna null si no hay ningún ingreso hoy.
 */
export const getTodayFirstEntry = async ( userId: number, gymId: number, ): Promise<AccessTicket | null> => {
    const sql = `
        SELECT *
        FROM access_tickets
        WHERE user_id = $1
          AND gym_id  = $2
          AND (check_in_time AT TIME ZONE 'America/Caracas')::date
              = (NOW() AT TIME ZONE 'America/Caracas')::date
        ORDER BY check_in_time ASC
        LIMIT 1
    `;
    const result = await query(sql, [userId, gymId]);
    return result.rows[0] ?? null;
};

/**
 * Busca un ticket por su jti (JWT ID).
 * Permite detectar si el QR ya fue validado antes.
 */
export const getTicketByJti = async (jti: string): Promise<AccessTicket | null> => {
    const sql = `SELECT * FROM access_tickets WHERE jti = $1 LIMIT 1`;
    const result = await query(sql, [jti]);
    return result.rows[0] ?? null;
};

// ─── Escrituras ───────────────────────────────────────────────────────────────

/**
 * Crea un nuevo registro de ingreso (primer acceso del día).
 * El campo is_active pasa a FALSE inmediatamente para marcar el QR como "usado".
 */
export const createAccessTicket = async (data: { gym_id: number; user_id: number; membership_id: number; jti: string; is_reentry: boolean; }): Promise<AccessTicket> => {
    const sql = `
        INSERT INTO access_tickets
            (gym_id, user_id, membership_id, jti, is_active, is_reentry, check_in_time)
        VALUES ($1, $2, $3, $4, FALSE, $5, NOW())
        RETURNING *
    `;
    const values = [
        data.gym_id,
        data.user_id,
        data.membership_id,
        data.jti,
        data.is_reentry,
    ];
    const result = await query(sql, values);
    return result.rows[0];
};

/**
 * Marca un ticket existente como consumido (is_active = FALSE).
 * Se usa para invalidar el JTI y evitar doble escaneo.
 */
export const consumeTicketByJti = async (jti: string): Promise<void> => {
    const sql = `UPDATE access_tickets SET is_active = FALSE WHERE jti = $1`;
    await query(sql, [jti]);
};
