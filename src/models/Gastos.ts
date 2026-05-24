import { query } from "../connect/connect.js";
import { z } from 'zod';
import type { Gastos } from "../types/GastosTypes.js";

export const bodyGastos = z.object({
    titulo: z.string(),
    descripcion: z.string().optional(),
    monto: z.number(),
    categoria: z.enum(['maquinaria', 'mantenimiento', 'servicios', 'insumos', 'nomina', 'marketing', 'otros', 'alquiler']),
    fecha_gasto: z.string(),
});

export const updateBodyGastos = z.object({
    titulo: z.string().optional(),
    descripcion: z.string().optional(),
    monto: z.number().optional(),
    categoria: z.enum(['maquinaria', 'mantenimiento', 'servicios', 'insumos', 'nomina', 'marketing', 'otros', 'alquiler']).optional(),
    fecha_gasto: z.string().optional(),
});

export const createGastos = async (gymId: number, data: unknown): Promise<Gastos> => {
    const validatedData = bodyGastos.parse(data);
    const sql = "INSERT INTO gastos (gym_id, titulo, descripcion, monto, categoria, fecha_gasto) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *";
    const result = await query(sql, [gymId, validatedData.titulo, validatedData.descripcion, validatedData.monto, validatedData.categoria, validatedData.fecha_gasto]);
    return result.rows[0];
};

export const getGastosByGymId = async (gymId: number): Promise<Gastos[]> => {
    const sql = "SELECT * FROM gastos WHERE gym_id = $1 ORDER BY id DESC";
    const result = await query(sql, [gymId]);
    return result.rows;
};

export const updateGastosByGym = async (gymId: number, id: number, data: unknown): Promise<Gastos | null> => {
    const validatedData = updateBodyGastos.parse(data);
    const fields = Object.keys(validatedData);
    const values = Object.values(validatedData);

    if (fields.length === 0) return null;

    const setString = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
    const sql = `UPDATE gastos SET ${setString} WHERE id = $${fields.length + 1} AND gym_id = $${fields.length + 2} RETURNING *`;

    const result = await query(sql, [...values, id, gymId]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
};

export const deleteGastosGym = async (gymId: number, id: number): Promise<boolean> => {
    const sql = "DELETE FROM gastos WHERE id = $1 AND gym_id = $2";
    const result = await query(sql, [id, gymId]);
    return (result.rowCount ?? 0) > 0;
};

