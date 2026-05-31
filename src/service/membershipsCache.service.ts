import redisClient from "../config/redis.js";
import type { MembershipBody } from "../types/Memberships.js";

// Configuración interna del módulo
const DEFAULT_TTL = 3600; // 1 hora en segundos

/**
 * Recupera la lista completa de membresías de un gimnasio desde Redis
 */
export const getMembershipsListCache = async (gymId: number): Promise<MembershipBody[] | null> => {
    const data = await redisClient.get(`gym:${gymId}:memberships`);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Guarda la lista completa de membresías de un gimnasio en Redis
 */
export const setMembershipsListCache = async (gymId: number, memberships: MembershipBody[]): Promise<void> => {
    await redisClient.set(`gym:${gymId}:memberships`, JSON.stringify(memberships), {
        EX: DEFAULT_TTL
    });
};

/**
 * Recupera una membresía individual por su ID desde Redis
 */
export const getSingleMembershipCache = async (gymId: number, membershipId: number): Promise<MembershipBody | null> => {
    const data = await redisClient.get(`gym:${gymId}:membership:${membershipId}`);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Guarda una membresía individual en Redis
 */
export const setSingleMembershipCache = async (gymId: number, membershipId: number, membership: MembershipBody): Promise<void> => {
    await redisClient.set(`gym:${gymId}:membership:${membershipId}`, JSON.stringify(membership), {
        EX: DEFAULT_TTL
    });
};

/**
 * ⚡️ Elimina las llaves de caché (Invalida la caché) cuando ocurren mutaciones
 */
export const invalidateMembershipCache = async (gymId: number, membershipId?: number): Promise<void> => {
    await redisClient.del(`gym:${gymId}:memberships`);
    if (membershipId) {
        await redisClient.del(`gym:${gymId}:membership:${membershipId}`);
    }
};
