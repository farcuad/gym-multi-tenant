import { query } from "../connect/connect.js";
import type { IGymBotConfig } from "../types/botConfig.js";
import { z } from "zod";

export const gymBotConfigSchema = z.object({
    whaibot_id: z.string().min(1, 'El ID del bot es requerido').max(255),
    whaibot_key: z.string().min(1, 'La clave del bot es requerida').max(255)
});

export const createbotsConfig = async (data: IGymBotConfig, gym_id: number): Promise<IGymBotConfig> => { 
    const validatedData = gymBotConfigSchema.parse(data);
    const sql = `INSERT INTO gym_bot_configs (whaibot_id, whaibot_key, gym_id) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (gym_id) 
        DO UPDATE SET whaibot_id = EXCLUDED.whaibot_id, whaibot_key = EXCLUDED.whaibot_key, updated_at = NOW()
        RETURNING *`;
    const values = [validatedData.whaibot_id, validatedData.whaibot_key, gym_id];
    const result = await query(sql, values);
    return result.rows[0];
}

// funcion para obtener la configuracion del bot por id
export const getbotsConfigById = async (gym_id: number): Promise<IGymBotConfig | null> => {
    const sql = `SELECT * FROM gym_bot_configs WHERE gym_id = $1`;
    const result = await query(sql, [gym_id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
}

// funcion para actualizar la configuracion del bot por id
export const updatebotsConfigById = async (id: string, data: IGymBotConfig, gym_id: number): Promise<IGymBotConfig | null> => {
    const validatedData = gymBotConfigSchema.parse(data);
    const sql = `UPDATE gym_bot_configs SET whaibot_id = $1, whaibot_key = $2 WHERE id = $3 AND gym_id = $4 RETURNING *`;
    const values = [validatedData.whaibot_id, validatedData.whaibot_key, id, gym_id];
    const result = await query(sql, values);
    if (result.rows.length === 0) return null;
    return result.rows[0];
}

// funcion para eliminar la configuracion del bot por id
export const deletebotsConfigById = async (id: string, gym_id: number): Promise<boolean> => {
    const sql = `DELETE FROM gym_bot_configs WHERE id = $1 AND gym_id = $2 RETURNING *`;
    const result = await query(sql, [id, gym_id]);
    return (result.rowCount ?? 0) > 0;
}