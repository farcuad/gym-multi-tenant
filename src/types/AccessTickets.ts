// DTO y tipos para el sistema de tickets QR de acceso

/** Fila en la tabla access_tickets */
export interface AccessTicket {
    id: number;
    gym_id: number;
    user_id: number;
    membership_id: number;
    jti: string;
    check_in_time: Date;
    is_active: boolean;
    is_reentry: boolean;
    created_at: Date;
}

/** Payload que viaja dentro del JWT de acceso (QR) */
export interface QrTokenPayload {
    sub: number;          // user_id (client.id)
    gym_id: number;
    membership_id: number;
    jti: string;          // UUID único por QR generado
    iat?: number;
    exp?: number;
}

/** Respuesta al cliente cuando genera el ticket */
export interface GenerateTicketResponse {
    token: string;
    expires_in: number;   // segundos
    message: string;
}

/** Resultado de la validación del ticket por el admin */
export interface VerifyTicketResult {
    valid: boolean;
    is_reentry: boolean;
    message: string;
    data?: {
        socio: string;
        cedula: string;
        plan: string;
        check_in_time: string;
    };
}
