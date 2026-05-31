import redisClient from "../config/redis.js";
import type { ExerciseBody } from "../types/ExerciseType.js";

// Configuración interna del módulo
const DEFAULT_TTL = 3600; // 1 hora en segundos

/**
 * Recupera la lista completa de ejercicios de un gimnasio desde Redis
 */
export const getExercisesListCache = async (gymId: number): Promise<ExerciseBody[] | null> => {
    const data = await redisClient.get(`gym:${gymId}:exercises`);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Guarda la lista completa de ejercicios de un gimnasio en Redis
 */
export const setExercisesListCache = async (gymId: number, exercises: ExerciseBody[]): Promise<void> => {
    await redisClient.set(`gym:${gymId}:exercises`, JSON.stringify(exercises), {
        EX: DEFAULT_TTL
    });
};

/**
 * Recupera un ejercicio individual por su ID desde Redis
 */
export const getSingleExerciseCache = async (gymId: number, exerciseId: number): Promise<ExerciseBody | null> => {
    const data = await redisClient.get(`gym:${gymId}:exercise:${exerciseId}`);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Guarda un ejercicio individual en Redis
 */
export const setSingleExerciseCache = async (gymId: number, exerciseId: number, exercise: ExerciseBody): Promise<void> => {
    await redisClient.set(`gym:${gymId}:exercise:${exerciseId}`, JSON.stringify(exercise), {
        EX: DEFAULT_TTL
    });
};

/**
 * ⚡️ Elimina las llaves de caché (Invalida la caché) cuando ocurren mutaciones
 */
export const invalidateExerciseCache = async (gymId: number, exerciseId?: number): Promise<void> => {
    await redisClient.del(`gym:${gymId}:exercises`);
    if (exerciseId) {
        await redisClient.del(`gym:${gymId}:exercise:${exerciseId}`);
    }
};
