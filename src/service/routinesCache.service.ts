import redisClient from "../config/redis.js";
import type { RoutineBody } from "../types/RoutineType.js";

// Configuración interna del módulo
const DEFAULT_TTL = 3600; // 1 hora en segundos

/**
 * Recupera la lista completa de rutinas de un gimnasio desde Redis
 */
export const getRoutinesListCache = async (gymId: number): Promise<RoutineBody[] | null> => {
    const data = await redisClient.get(`gym:${gymId}:routines`);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Guarda la lista completa de rutinas de un gimnasio en Redis
 */
export const setRoutinesListCache = async (gymId: number, routines: RoutineBody[]): Promise<void> => {
    await redisClient.set(`gym:${gymId}:routines`, JSON.stringify(routines), {
        EX: DEFAULT_TTL
    });
};

/**
 * Recupera una rutina individual por su ID desde Redis (incluyendo sus ejercicios)
 */
export const getSingleRoutineCache = async (gymId: number, routineId: number): Promise<any | null> => {
    const data = await redisClient.get(`gym:${gymId}:routine:${routineId}`);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Guarda una rutina individual en Redis
 */
export const setSingleRoutineCache = async (gymId: number, routineId: number, routine: any): Promise<void> => {
    await redisClient.set(`gym:${gymId}:routine:${routineId}`, JSON.stringify(routine), {
        EX: DEFAULT_TTL
    });
};

/**
 * ⚡️ Elimina las llaves de caché (Invalida la caché) cuando ocurren mutaciones
 */
export const invalidateRoutineCache = async (gymId: number, routineId?: number): Promise<void> => {
    await redisClient.del(`gym:${gymId}:routines`);
    if (routineId) {
        await redisClient.del(`gym:${gymId}:routine:${routineId}`);
    }
};
