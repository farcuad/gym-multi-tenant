import { query } from "../connect/connect.js";
import { z } from "zod";
import type { ExerciseBody } from "../types/ExerciseType.js";

// Utilizamos Zod para validar los datos (sin incluir id ni gym_id)
export const createExerciseSchema = z.object({
  name: z.string().min(2).max(100),
  muscle_group: z.string().max(100).optional().nullable(),
});

export const updateExerciseSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  muscle_group: z.string().max(100).optional().nullable(),
});

// Función para registrar un nuevo ejercicio (La Biblioteca)
export const registerExercise = async (gymId: number, data: unknown): Promise<ExerciseBody> => {
  const validatedData = createExerciseSchema.parse(data);
  const sql = "INSERT INTO exercises (gym_id, name, muscle_group) VALUES ($1, $2, $3) RETURNING *";
  const result = await query(sql, [gymId, validatedData.name, validatedData.muscle_group || null]);
  return result.rows[0];
};

// Función para obtener todos los ejercicios de un gimnasio
export const getExercisesByGymId = async (gymId: number): Promise<ExerciseBody[]> => {
  const sql = "SELECT * FROM exercises WHERE gym_id = $1 ORDER BY id DESC";
  const result = await query(sql, [gymId]);
  return result.rows;
};

// Función para obtener un ejercicio por id
export const getExerciseById = async (id: number, gymId: number): Promise<ExerciseBody | null> => {
  const sql = "SELECT * FROM exercises WHERE id = $1 AND gym_id = $2";
  const result = await query(sql, [id, gymId]);
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

// Función para actualizar un ejercicio
export const updateExerciseById = async (id: number, gymId: number, data: unknown): Promise<ExerciseBody | null> => {
  const validateData = updateExerciseSchema.partial().parse(data);
  const fields = Object.keys(validateData);
  const values = Object.values(validateData);
  
  if (fields.length === 0) return null;

  const setString = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
  const sql = `UPDATE exercises SET ${setString} WHERE id = $${fields.length + 1} AND gym_id = $${fields.length + 2} RETURNING *`;
  
  const result = await query(sql, [...values, id, gymId]);
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

// Función para eliminar un ejercicio
export const deleteExerciseById = async (id: number, gymId: number): Promise<boolean> => {
  const sql = "DELETE FROM exercises WHERE id = $1 AND gym_id = $2";
  const result = await query(sql, [id, gymId]);
  return (result.rowCount ?? 0) > 0;
};
