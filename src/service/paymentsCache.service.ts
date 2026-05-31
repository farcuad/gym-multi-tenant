import redisClient from "../config/redis.js";
import type { PaymentHistoryDTO } from "../types/Payments.js";

// Configuración interna del módulo
const DEFAULT_TTL = 3600; // 1 hora en segundos

/**
 * Recupera la lista completa de pagos de un gimnasio desde Redis
 */
export const getPaymentsListCache = async (gymId: number): Promise<PaymentHistoryDTO[] | null> => {
    const data = await redisClient.get(`gym:${gymId}:payments`);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Guarda la lista completa de pagos de un gimnasio en Redis
 */
export const setPaymentsListCache = async (gymId: number, payments: PaymentHistoryDTO[]): Promise<void> => {
    await redisClient.set(`gym:${gymId}:payments`, JSON.stringify(payments), {
        EX: DEFAULT_TTL
    });
};

/**
 * ⚡️ Elimina las llaves de caché (Invalida la caché) cuando ocurren mutaciones
 */
export const invalidatePaymentCache = async (gymId: number): Promise<void> => {
    await redisClient.del(`gym:${gymId}:payments`);
};
