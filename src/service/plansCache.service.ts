import redisClient from "../config/redis.js";
import type { PlanBody } from "../types/Plans.js";

// Configuración interna del módulo
const DEFAULT_TTL = 3600; // 1 hora en segundos

/**
 * Recupera la lista completa de planes de un gimnasio desde Redis
 */
export const getPlansListCache = async (gymId: number): Promise<PlanBody[] | null> => {
    const data = await redisClient.get(`gym:${gymId}:plans`);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Guarda la lista completa de planes de un gimnasio en Redis
 */
export const setPlansListCache = async (gymId: number, plans: PlanBody[]): Promise<void> => {
    await redisClient.set(`gym:${gymId}:plans`, JSON.stringify(plans), {
        EX: DEFAULT_TTL
    });
};

/**
 * Recupera un plan individual por su ID desde Redis
 */
export const getSinglePlanCache = async (gymId: number, planId: number): Promise<PlanBody | null> => {
    const data = await redisClient.get(`gym:${gymId}:plan:${planId}`);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Guarda un plan individual en Redis
 */
export const setSinglePlanCache = async (gymId: number, planId: number, plan: PlanBody): Promise<void> => {
    await redisClient.set(`gym:${gymId}:plan:${planId}`, JSON.stringify(plan), {
        EX: DEFAULT_TTL
    });
};

/**
 * ⚡️ Elimina las llaves de caché (Invalida la caché) cuando ocurren mutaciones
 */
export const invalidatePlanCache = async (gymId: number, planId?: number): Promise<void> => {
    await redisClient.del(`gym:${gymId}:plans`);
    if (planId) {
        await redisClient.del(`gym:${gymId}:plan:${planId}`);
    }
};
