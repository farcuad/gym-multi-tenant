import redisClient from "../config/redis.js";
import type { ClientBody } from "../types/ClientType.js";

// Configuración interna del módulo (encapsulamiento funcional)
const DEFAULT_TTL = 3600; // 1 hora en segundos

/**
 * Recupera la lista completa de clientes de un gimnasio desde Redis
 */
export const getClientsListCache = async (gymId: number): Promise<ClientBody[] | null> => {
    const data = await redisClient.get(`gym:${gymId}:clients`);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Guarda la lista completa de clientes de un gimnasio en Redis
 */
export const setClientsListCache = async (gymId: number, clients: ClientBody[]): Promise<void> => {
    await redisClient.set(`gym:${gymId}:clients`, JSON.stringify(clients), {
        EX: DEFAULT_TTL
    });
};

/**
 * Recupera un cliente individual por su ID desde Redis
 */
export const getSingleClientCache = async (gymId: number, clientId: number): Promise<ClientBody | null> => {
    const data = await redisClient.get(`gym:${gymId}:client:${clientId}`);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Guarda un cliente individual en Redis
 */
export const setSingleClientCache = async (gymId: number, clientId: number, client: ClientBody): Promise<void> => {
    await redisClient.set(`gym:${gymId}:client:${clientId}`, JSON.stringify(client), {
        EX: DEFAULT_TTL
    });
};

/**
 * ⚡️ Elimina las llaves de caché (Invalida la caché) cuando ocurren mutaciones
 */
export const invalidateClientCache = async (gymId: number, clientId?: number): Promise<void> => {
    // Borramos la lista general
    await redisClient.del(`gym:${gymId}:clients`);

    // Si nos pasaron un cliente específico, también lo borramos de la RAM
    if (clientId) {
        await redisClient.del(`gym:${gymId}:client:${clientId}`);
    }
};