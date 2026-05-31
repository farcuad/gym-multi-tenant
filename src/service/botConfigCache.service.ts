import redisClient from "../config/redis.js";
import type { IGymBotConfig } from "../types/botConfig.js";

// Configuración interna del módulo
const DEFAULT_TTL = 3600; // 1 hora en segundos

/**
 * Recupera la configuración del bot de un gimnasio desde Redis
 */
export const getBotConfigCache = async (gymId: number): Promise<IGymBotConfig | null> => {
    const data = await redisClient.get(`gym:${gymId}:bot_config`);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Guarda la configuración del bot de un gimnasio en Redis
 */
export const setBotConfigCache = async (gymId: number, config: IGymBotConfig): Promise<void> => {
    await redisClient.set(`gym:${gymId}:bot_config`, JSON.stringify(config), {
        EX: DEFAULT_TTL
    });
};

/**
 * ⚡️ Elimina las llaves de caché (Invalida la caché) cuando ocurren mutaciones
 */
export const invalidateBotConfigCache = async (gymId: number): Promise<void> => {
    await redisClient.del(`gym:${gymId}:bot_config`);
};
