import { query } from "../connect/connect.js";
import { z } from "zod";
import type { RoutineBody, RoutineExerciseBody, ClientRoutineBody } from "../types/RoutineType.js";

// === ESQUEMAS ZOD ===
export const createRoutineSchema = z.object({
  name: z.string().min(3).max(150),
  description: z.string().optional().nullable(),
});

export const updateRoutineSchema = createRoutineSchema.partial();

export const routineExerciseSchema = z.object({
  routine_id: z.number(),
  exercise_id: z.number(),
  sets: z.number().int().positive(),
  reps: z.string(),
  rest_time_seconds: z.number().int().nonnegative().optional().default(60),
  sort_order: z.number().int().nonnegative(),
  day_of_week: z.number().int().min(1).max(7),
});

export const clientRoutineSchema = z.object({
  client_id: z.number(),
  routine_id: z.number(),
  start_date: z.string().optional(),
  end_date: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  day_of_week: z.number().int().min(1).max(7).optional(),
});

// === RUTINAS (CABECERA) ===

// Crear una Rutina
export const registerRoutine = async (gymId: number, trainerId: number | null, data: unknown): Promise<RoutineBody> => {
  const validatedData = createRoutineSchema.parse(data);
  const sql = "INSERT INTO routines (gym_id, trainer_id, name, description) VALUES ($1, $2, $3, $4) RETURNING *";
  const result = await query(sql, [gymId, trainerId, validatedData.name, validatedData.description || null]);
  return result.rows[0];
};

// Obtener todas las rutinas del gimnasio
export const getRoutinesByGymId = async (gymId: number): Promise<RoutineBody[]> => {
  const sql = "SELECT * FROM routines WHERE gym_id = $1 ORDER BY id DESC";
  const result = await query(sql, [gymId]);
  return result.rows;
};

// Obtener rutina por ID
export const getRoutineById = async (id: number, gymId: number): Promise<RoutineBody | null> => {
  const sql = "SELECT * FROM routines WHERE id = $1 AND gym_id = $2";
  const result = await query(sql, [id, gymId]);
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

// Actualizar Rutina
export const updateRoutineById = async (id: number, gymId: number, data: unknown): Promise<RoutineBody | null> => {
  const validateData = updateRoutineSchema.parse(data);
  const fields = Object.keys(validateData);
  const values = Object.values(validateData);
  
  if (fields.length === 0) return null;

  const setString = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
  const sql = `UPDATE routines SET ${setString} WHERE id = $${fields.length + 1} AND gym_id = $${fields.length + 2} RETURNING *`;
  
  const result = await query(sql, [...values, id, gymId]);
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

// Eliminar Rutina
export const deleteRoutineById = async (id: number, gymId: number): Promise<boolean> => {
  const sql = "DELETE FROM routines WHERE id = $1 AND gym_id = $2";
  const result = await query(sql, [id, gymId]);
  return (result.rowCount ?? 0) > 0;
};

// === EJERCICIOS DE LA RUTINA (DETALLE) ===

// Agregar ejercicio a una rutina
export const addExerciseToRoutine = async (gymId: number, data: unknown): Promise<RoutineExerciseBody> => {
  const validatedData = routineExerciseSchema.parse(data);
  const sql = `INSERT INTO routine_exercises (gym_id, routine_id, exercise_id, sets, reps, rest_time_seconds, sort_order, day_of_week) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
  const values = [
    gymId, 
    validatedData.routine_id, 
    validatedData.exercise_id, 
    validatedData.sets, 
    validatedData.reps, 
    validatedData.rest_time_seconds, 
    validatedData.sort_order,
    validatedData.day_of_week
  ];
  const result = await query(sql, values);
  return result.rows[0];
};

// Obtener todos los ejercicios de una rutina
export const getExercisesByRoutineId = async (routineId: number, gymId: number, dayOfWeek?: number): Promise<any[]> => {
  let sql = `
    SELECT re.*, e.name as exercise_name, e.muscle_group 
    FROM routine_exercises re
    JOIN exercises e ON re.exercise_id = e.id
    WHERE re.routine_id = $1 AND re.gym_id = $2
  `;
  
  const values: any[] = [routineId, gymId];
  
  if (dayOfWeek) {
    sql += " AND re.day_of_week = $3";
    values.push(dayOfWeek);
  }
  
  sql += " ORDER BY re.sort_order ASC";
  
  const result = await query(sql, values);
  return result.rows;
};

// Eliminar ejercicio de la rutina
export const removeExerciseFromRoutine = async (id: number, gymId: number): Promise<boolean> => {
  const sql = "DELETE FROM routine_exercises WHERE id = $1 AND gym_id = $2";
  const result = await query(sql, [id, gymId]);
  return (result.rowCount ?? 0) > 0;
};

// === ASIGNACION A CLIENTES ===

// Asignar rutina a cliente
export const assignRoutineToClient = async (gymId: number, data: unknown): Promise<ClientRoutineBody> => {
  const validatedData = clientRoutineSchema.parse(data);
  const startDate = validatedData.start_date || new Date().toISOString().slice(0, 10);
  
  // Si se especifica un día, desactivamos solo la rutina previa de ese día
  if (validatedData.day_of_week) {
    await query(
      "UPDATE client_routines SET is_active = FALSE WHERE client_id = $1 AND gym_id = $2 AND day_of_week = $3", 
      [validatedData.client_id, gymId, validatedData.day_of_week]
    );
  } else {
    // Si no hay día (comportamiento antiguo o rutina global), desactivamos todas
    await query(
      "UPDATE client_routines SET is_active = FALSE WHERE client_id = $1 AND gym_id = $2", 
      [validatedData.client_id, gymId]
    );
  }

  const sql = `INSERT INTO client_routines (gym_id, client_id, routine_id, start_date, end_date, is_active, day_of_week) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
  const values = [
    gymId, 
    validatedData.client_id, 
    validatedData.routine_id, 
    startDate, 
    validatedData.end_date || null, 
    validatedData.is_active,
    validatedData.day_of_week || null
  ];
  
  const result = await query(sql, values);
  return result.rows[0];
};

// Obtener rutina activa del cliente
export const getActiveRoutineByClientId = async (clientId: number, gymId: number, dayOfWeek?: number): Promise<ClientRoutineBody | null> => {
  let sql = "SELECT * FROM client_routines WHERE client_id = $1 AND gym_id = $2 AND is_active = TRUE";
  const params: any[] = [clientId, gymId];

  if (dayOfWeek) {
    sql += " AND (day_of_week = $3 OR day_of_week IS NULL)";
    params.push(dayOfWeek);
  }

  sql += " ORDER BY day_of_week DESC NULLS LAST, id DESC LIMIT 1";
  
  const result = await query(sql, params);
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

// Desactivar rutina del cliente
export const deactivateClientRoutine = async (id: number, gymId: number): Promise<ClientRoutineBody | null> => {
  const sql = "UPDATE client_routines SET is_active = FALSE WHERE id = $1 AND gym_id = $2 RETURNING *";
  const result = await query(sql, [id, gymId]);
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

// Obtener todas las rutinas asignadas a un cliente (historial)
export const getClientRoutines = async (clientId: number, gymId: number): Promise<any[]> => {
  const sql = `
    SELECT cr.*, r.name as routine_name, r.description as routine_description
    FROM client_routines cr
    JOIN routines r ON cr.routine_id = r.id
    WHERE cr.client_id = $1 AND cr.gym_id = $2
    ORDER BY cr.is_active DESC, cr.created_at DESC
  `;
  const result = await query(sql, [clientId, gymId]);
  return result.rows;
};

