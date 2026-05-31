import redisClient from "../config/redis.js";
import type { Gastos } from "../types/GastosTypes.js";

// Configuración interna del módulo
const DEFAULT_TTL = 3600; // 1 hora en segundos

/**
 * Recupera la lista completa de gastos de un gimnasio desde Redis
 */
export const getGastosListCache = async (gymId: number): Promise<Gastos[] | null> => {
    const data = await redisClient.get(`gym:${gymId}:gastos`);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Guarda la lista completa de gastos de un gimnasio en Redis
 */
export const setGastosListCache = async (gymId: number, gastos: Gastos[]): Promise<void> => {
    await redisClient.set(`gym:${gymId}:gastos`, JSON.stringify(gastos), {
        EX: DEFAULT_TTL
    });
};

/**
 * ⚡️ Elimina las llaves de caché (Invalida la caché) cuando ocurren mutaciones
 */
export const invalidateGastosCache = async (gymId: number): Promise<void> => {
    await redisClient.del(`gym:${gymId}:gastos`);
};
