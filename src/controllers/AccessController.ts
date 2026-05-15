import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../connect/connect.js';
import { getTodayFirstEntry, getTicketByJti, createAccessTicket,} from '../models/AccessTickets.js';
import type { QrTokenPayload } from '../types/AccessTickets.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/** Tiempo de expiración del QR en segundos (2 minutos) */
const QR_TTL_SECONDS = 120;

/** Ventana de re-entrada en milisegundos (4 horas) */
const REENTRY_WINDOW_MS = 4 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// GET /access/generate-ticket   (App Cliente — requiere authToken + isClient)
// ─────────────────────────────────────────────────────────────────────────────
export const generateAccessTicket = async (req: Request, res: Response) => {
    try {
        const userId  = req.user.id;
        const gymId   = req.user.gym_id;

        // 1. Verificar que el cliente tiene una membresía activa y vigente
        const membershipSql = `
            SELECT id, fecha_membresias AS fecha_vencimiento, estado
            FROM memberships
            WHERE client_id = $1
              AND gym_id    = $2
              AND estado    = 'activo'
              AND fecha_membresias >= CURRENT_DATE
            LIMIT 1
        `;
        const membershipResult = await query(membershipSql, [userId, gymId]);

        if (membershipResult.rows.length === 0) {
            return res.status(403).json({
                valid: false,
                message: 'Membresía vencida o inactiva. No puedes generar un QR de acceso.',
            });
        }

        const membership = membershipResult.rows[0] as { id: number; fecha_vencimiento: string; estado: string };

        // 2. Revisar el historial de ingresos del día
        const firstEntry = await getTodayFirstEntry(userId, gymId);

        if (firstEntry) {
            const firstCheckIn  = new Date(firstEntry.check_in_time).getTime();
            const now           = Date.now();
            const elapsed       = now - firstCheckIn;

            if (elapsed >= REENTRY_WINDOW_MS) {
                // Han pasado 4 horas o más → ya no se puede re-entrar hoy
                return res.status(403).json({
                    valid: false,
                    message: 'Límite de tiempo diario excedido. La ventana de re-entrada de 4 horas ha caducado.',
                });
            }
            // Dentro de las 4 h → se permite re-entrada (el QR lo indicará)
        }

        // 3. Generar JTI único y el JWT de acceso
        const jti = crypto.randomUUID();

        const payload: QrTokenPayload = {
            sub:           userId,
            gym_id:        gymId,
            membership_id: membership.id,
            jti,
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: QR_TTL_SECONDS,
        });

        return res.status(200).json({
            token,
            expires_in: QR_TTL_SECONDS,
            message: firstEntry
                ? 'Token de re-entrada generado correctamente. Válido por 2 minutos.'
                : 'Token de acceso generado correctamente. Válido por 2 minutos.',
        });

    } catch (error: any) {
        console.error('❌ Error en generateAccessTicket:', error);
        return res.status(500).json({ 
            error: 'Error interno al generar el ticket de acceso.',
            details: error.message 
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /memberships/:id/verify   (App Admin — requiere authToken)
// Se integra con el flujo existente de verifyMembershipStatus
// ─────────────────────────────────────────────────────────────────────────────
export const verifyQrTicket = async (req: Request, res: Response) => {
    try {
        const { token } = req.body as { token?: string };

        // ── Validación 1: El body debe traer el token ──────────────────────
        if (!token) {
            return res.status(400).json({
                valid: false,
                message: 'El campo "token" es requerido en el cuerpo de la solicitud.',
            });
        }

        // ── Validación 2: Firma y expiración del JWT ───────────────────────
        let decoded: QrTokenPayload;
        try {
            decoded = jwt.verify(token, JWT_SECRET) as unknown as QrTokenPayload;
        } catch (jwtError: any) {
            const isExpired = jwtError?.name === 'TokenExpiredError';
            return res.status(401).json({
                valid: false,
                message: isExpired ? 'QR expirado. Pídele al cliente que genere uno nuevo.' : 'QR inválido. Token corrupto o mal formado.',
            });
        }

        const { sub: userId, gym_id: gymId, membership_id: membershipId, jti } = decoded;

        // ── Validación 3: Que el QR no haya sido ya utilizado (jti en BD) ──
        const existingTicket = await getTicketByJti(jti);
        if (existingTicket) {
            return res.status(409).json({
                valid: false,
                message: 'QR ya utilizado. Este código ya fue escaneado anteriormente.',
            });
        }

        // ── Validación 4: Membresía aún activa al momento de validar ───────
        const membershipSql = `
            SELECT
                m.id,
                m.estado,
                m.fecha_membresias AS fecha_vencimiento,
                c.name  AS client_name,
                c.cedula AS client_cedula,
                p.name  AS plan_name
            FROM memberships m
            JOIN clients c ON c.id = m.client_id
            JOIN plans   p ON p.id = m.plan_id
            WHERE m.id      = $1
              AND m.gym_id  = $2
              AND m.client_id = $3
        `;
        const memResult = await query(membershipSql, [membershipId, gymId, userId]);

        if (memResult.rows.length === 0) {
            return res.status(404).json({
                valid: false,
                message: 'La membresía referenciada en el QR no existe.',
            });
        }

        const mem = memResult.rows[0];

        const nowCaracas = new Date().toLocaleString('en-CA', {
            timeZone: 'America/Caracas',
            hour12: false,
        }).split(',')[0];

        const fechaVenc = mem.fecha_vencimiento instanceof Date
            ? mem.fecha_vencimiento.toISOString().split('T')[0]
            : String(mem.fecha_vencimiento).split('T')[0];

        const isExpiredMembership = (fechaVenc ?? '') < (nowCaracas ?? '');
        const isActive = mem.estado === 'activo';

        if (isExpiredMembership || !isActive) {
            return res.status(403).json({
                valid: false,
                message: isExpiredMembership ? 'Membresía vencida.' : 'Membresía inactiva.',
            });
        }

        // ── Determinar si es re-entrada (dentro de la ventana de 4h) ───────
        const firstEntry = await getTodayFirstEntry(userId, gymId);
        let isReentry = false;

        if (firstEntry) {
            const elapsed = Date.now() - new Date(firstEntry.check_in_time).getTime();

            if (elapsed >= REENTRY_WINDOW_MS) {
                // La ventana de re-entrada caducó después de que el cliente generó el QR
                return res.status(403).json({
                    valid: false,
                    message: 'Límite de tiempo diario excedido. La ventana de re-entrada de 4 horas ha caducado.',
                });
            }
            isReentry = true;
        }

        // ── Registrar el ticket en BD (marcado directamente como consumido) ─
        await createAccessTicket({
            gym_id:        gymId,
            user_id:       userId,
            membership_id: membershipId,
            jti,
            is_reentry:    isReentry,
        });

        return res.status(200).json({
            valid:      true,
            is_reentry: isReentry,
            message:    isReentry ? '✅ Re-entrada confirmada.' : '✅ Acceso permitido. Primer ingreso del día.',
            data: {
                socio:          mem.client_name,
                cedula:         mem.client_cedula,
                plan:           mem.plan_name,
                check_in_time:  new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('❌ Error en verifyQrTicket:', error);
        return res.status(500).json({ error: 'Error interno al verificar el ticket QR.' });
    }
};
