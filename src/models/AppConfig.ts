import { query } from "../connect/connect.js";
import { z } from 'zod';
import type { AppConfig } from '../types/AppConfigType.js';
const ConfigSchema = z.object({
  id: z.number().optional(),
  platform: z.string().nonempty("Platform is required"),
  download_url: z.string().url("Invalid URL"),
  version_label: z.string().optional(),
  is_active: z.boolean().default(true),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const createConfigApp = async (config: AppConfig): Promise<AppConfig> => {
  const parsed = ConfigSchema.parse(config);
  
  await query("BEGIN");
  try {
    // Desactivamos la configuración anterior para esta plataforma
    await query(`
      UPDATE app_config 
      SET is_active = false 
      WHERE platform = $1 AND is_active = true
    `, [parsed.platform]);

    // Insertamos la nueva versión como la activa
    const result = await query(`
      INSERT INTO app_config (platform, download_url, version_label, is_active)
      VALUES ($1, $2, $3, true)
      RETURNING *;
    `, [parsed.platform, parsed.download_url, parsed.version_label]);
    
    await query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }
}


export const getConfigApp = async (platform?: string): Promise<AppConfig | null> => {
  let sql = `
    SELECT * FROM app_config 
    WHERE is_active = true
  `;
  const params: any[] = [];

  if (platform) {
    sql += ` AND platform = $1`;
    params.push(platform);
  }

  sql += ` ORDER BY created_at DESC LIMIT 1;`;

  const result = await query(sql, params);
  return result.rows[0] || null;
}


export const updatedConfigApp = async (config: AppConfig): Promise<AppConfig> => {
  const parsed = ConfigSchema.parse(config);
  const sql = `UPDATE app_config SET platform = $1, download_url = $2, 
                version_label = $3, is_active = $4 WHERE id = $5 RETURNING *;`;
  const result = await query(sql, [
    parsed.platform, parsed.download_url, parsed.version_label, parsed.is_active, parsed.id
  ]);
  return result.rows[0];
}


export const deleteConfig = async (id: number): Promise<AppConfig | null> => {
  const sql = `DELETE FROM app_config WHERE id = $1 RETURNING *;`
  const result = await query(sql, [id]);
  return result.rows[0];
}