import { query } from "../connect/connect.js";
import { z } from 'zod';
import type { AppConfig } from '../types/AppConfigType.js';
const ConfigSchema = z.object({
  id: z.number().optional(),
  gym_id: z.number().optional(),
  platform: z.string().nonempty("Platform is required"),
  download_url: z.string().url("Invalid URL"),
  version_label: z.string().optional(),
  is_active: z.boolean().default(true),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const createConfigApp = async (gym_id: number, config: AppConfig): Promise<AppConfig> => {
  const parsed = ConfigSchema.parse(config);
  
  await query("BEGIN");
  try {
    // Desactivamos la configuración anterior para esta plataforma y este gym
    await query(`
      UPDATE app_config 
      SET is_active = false 
      WHERE gym_id = $1 AND platform = $2 AND is_active = true
    `, [gym_id, parsed.platform]);

    // Insertamos la nueva versión como la activa
    const result = await query(`
      INSERT INTO app_config (gym_id, platform, download_url, version_label, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *;
    `, [gym_id, parsed.platform, parsed.download_url, parsed.version_label]);
    
    await query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }
}


export const getConfigApp = async (gym_id: number, platform?: string): Promise<AppConfig | null> => {
  let sql = `
    SELECT * FROM app_config 
    WHERE gym_id = $1 
    AND is_active = true
  `;
  const params: any[] = [gym_id];

  if (platform) {
    sql += ` AND platform = $2`;
    params.push(platform);
  }

  sql += ` ORDER BY created_at DESC LIMIT 1;`;

  const result = await query(sql, params);
  return result.rows[0] || null;
}


export const updatedConfigApp = async (gym_id: number, config: AppConfig): Promise<AppConfig> => {
  const parsed = ConfigSchema.parse(config);
  const sql = `UPDATE app_config SET platform = $1, download_url = $2, 
                version_label = $3, is_active = $4 WHERE id = $5 AND gym_id = $6 RETURNING *;`;
  const result = await query(sql, [
    parsed.platform, parsed.download_url, parsed.version_label, parsed.is_active, parsed.id, gym_id
  ]);
  return result.rows[0];
}


export const deleteConfig = async (gym_id: number, id: number): Promise<AppConfig | null> => {
  const sql = `DELETE FROM app_config WHERE id = $1 AND gym_id = $2 RETURNING *;`
  const result = await query(sql, [id, gym_id]);
  return result.rows[0];
}