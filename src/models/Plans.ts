import { query } from "../connect/connect.js";
import type { CreatePlanDTO, PlanBody, UpdatePlanDTO } from "../types/Plans.js";
import { z } from "zod";

// Usamos Zod para validar los datos de entrada
const planBodySchema = z.object({
    gym_id: z.number().optional(),
    name: z.string().min(1).max(100),
    duration_day: z.number().int().positive(),
    price: z.number().nonnegative(),
});

// Esquemas específicos para creación y actualización
const registerPLanSchema = planBodySchema;
const updatePlanSchema = planBodySchema;

// Funciones para interactuar con la base de datos
export const registerPlan = async (data: CreatePlanDTO): Promise<PlanBody> => {
    // Validar los datos de entrada
    const validatedData = registerPLanSchema.parse(data);
    // Hacemos la consulta sql
    const sql = "INSERT INTO plans (gym_id, name, duration_day, price) VALUES ($1, $2, $3, $4) RETURNING *";
    const values = [
        validatedData.gym_id,
        validatedData.name,
        validatedData.duration_day,
        validatedData.price,
    ];
    // Ejecutamos la consulta
    const result = await query(sql, values);
    return result.rows[0];
};

// Funcion para obtener todos los planes de un gimnasio
export const getPlansByGymId = async (gymId: number): Promise<PlanBody[]>=> {
    const sql = "SELECT * FROM plans WHERE gym_id = $1 ORDER BY id ASC";
    const result = await query(sql, [gymId]);
    return result.rows;
}

// Funcion para actualizar un plan
export const updatePlan = async (id: number, gym_id: number, data: UpdatePlanDTO): Promise<PlanBody | null> => {
    // Validar los datos de entrada
    const validatedData = updatePlanSchema.parse(data);
    // Construir la consulta SQL dinámicamente
    const fields = Object.keys(validatedData);
    const values = Object.values(validatedData);
    // Validar que hay campos para actualizar
    if (fields.length === 0) {
        return null;
    }
    // Mapear los campos y los valores
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
    // Hacemos la consulta sql
    const sql = `UPDATE plans SET ${setClause} WHERE id = $${fields.length + 1} AND gym_id = $${fields.length + 2} RETURNING *`;
    // Se los pasamos a values
    values.push(id, gym_id);
    // Ejecutamos la consulta
    const result = await query(sql, values);
    return result.rows[0] || null;
};
// Funcion para eliminar un plan
export const deletePlan = async (id: number, gym_id: number): Promise<boolean> => {
    const sql = "DELETE FROM plans WHERE id = $1 AND gym_id = $2";
    const values = [id, gym_id];
    const result = await query(sql, values);
    return (result.rowCount ?? 0) > 0;
}