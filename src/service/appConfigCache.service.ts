import redisClient from "../config/redis.js";
import type { AppConfig } from "../types/AppConfigType.js";

// Configuración interna del módulo
const DEFAULT_TTL = 3600; // 1 hora en segundos

/**
 * Recupera la configuración de la app desde Redis
 */
export const getAppConfigCache = async (platform?: string): Promise<AppConfig | null> => {
    const key = platform ? `app_config:${platform}` : `app_config:default`;
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Guarda la configuración de la app en Redis
 */
export const setAppConfigCache = async (config: AppConfig, platform?: string): Promise<void> => {
    const key = platform ? `app_config:${platform}` : `app_config:default`;
    await redisClient.set(key, JSON.stringify(config), {
        EX: DEFAULT_TTL
    });
};

/**
 * ⚡️ Elimina las llaves de caché (Invalida la caché) cuando ocurren mutaciones
 */
export const invalidateAppConfigCache = async (platform?: string): Promise<void> => {
    if (platform) {
        await redisClient.del(`app_config:${platform}`);
    }
    await redisClient.del(`app_config:default`);
};
