import type { Request, Response } from "express";
import { z } from "zod";
import { registerRoutine, getRoutinesByGymId, getRoutineById, updateRoutineById, 
  deleteRoutineById, addExerciseToRoutine,getExercisesByRoutineId, removeExerciseFromRoutine,
  assignRoutineToClient,getActiveRoutineByClientId,deactivateClientRoutine, getClientRoutines } from "../models/Routines.js";

// === RUTINAS ===

export const createRoutine = async (req: Request, res: Response) => {
  try {
    const gym_id = req.user.gym_id;
    // Si el rol es trainer, le asignamos su propio ID, sino lo dejamos en nulo (ej: admin creando)
    const trainer_id = req.user.role === 'trainer' ? req.user.id : null; 
    
    const routine = await registerRoutine(Number(gym_id), trainer_id, req.body);
    res.status(201).json({ message: "Rutina creada", routine });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Datos de entrada inválidos", details: error.issues });
    }
    res.status(500).json({ error: (error as Error).message });
  }
};

export const fetchRoutines = async (req: Request, res: Response) => {
  try {
    const gym_id = req.user.gym_id;
    const routines = await getRoutinesByGymId(Number(gym_id));
    res.status(200).json({ message: "Rutinas obtenidas", routines });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const fetchRoutineById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const gym_id = req.user.gym_id;

    const routine = await getRoutineById(id, Number(gym_id));
    if (!routine) {
      return res.status(404).json({ error: "Rutina no encontrada" });
    }
    
    // Obtenemos los ejercicios con la información adicional
    const exercises = await getExercisesByRoutineId(id, Number(gym_id));
    
    const routineData = { ...routine, exercises };
    
    res.status(200).json({ message: "Rutina obtenida", routine: routineData });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateRoutine = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const gym_id = req.user.gym_id;
    const updated = await updateRoutineById(id, Number(gym_id), req.body);
    
    if (!updated) return res.status(404).json({ error: "Rutina no encontrada o sin cambios" });
    res.status(200).json({ message: "Rutina actualizada", routine: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Datos inválidos", details: error.issues });
    res.status(500).json({ error: "Error interno" });
  }
};

export const deleteRoutine = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const gym_id = req.user.gym_id;
    
    const deleted = await deleteRoutineById(id, Number(gym_id));
    if (!deleted) return res.status(404).json({ error: "Rutina no encontrada" });
    
    res.status(200).json({ message: "Rutina eliminada" });
  } catch (error: any) {
    res.status(500).json({ error: "Error interno" });
  }
};

// === EJERCICIOS DE LA RUTINA ===

export const addExercise = async (req: Request, res: Response) => {
  try {
    const gym_id = req.user.gym_id;
    // Forzamos el ID de la rutina desde la URL por seguridad
    const data = { ...req.body, routine_id: Number(req.params.routineId) };
    
    const exercise = await addExerciseToRoutine(Number(gym_id), data);
    res.status(201).json({ message: "Ejercicio agregado a la rutina", exercise });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Datos inválidos", details: error.issues });
    res.status(500).json({ error: (error as Error).message });
  }
};

export const removeExercise = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const gym_id = req.user.gym_id;
    
    const deleted = await removeExerciseFromRoutine(id, Number(gym_id));
    if (!deleted) return res.status(404).json({ error: "Detalle de ejercicio no encontrado" });
    
    res.status(200).json({ message: "Ejercicio removido de la rutina" });
  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  }
};

// === ASIGNACIONES ===

export const assignRoutine = async (req: Request, res: Response) => {
  try {
    const gym_id = req.user.gym_id;
    const assignment = await assignRoutineToClient(Number(gym_id), req.body);
    res.status(201).json({ message: "Rutina asignada al cliente exitosamente", assignment });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Datos inválidos", details: error.issues });
    res.status(500).json({ error: (error as Error).message });
  }
};

export const fetchActiveClientRoutine = async (req: Request, res: Response) => {
  try {
    const gym_id = req.user.gym_id;
    const client_id = Number(req.params.clientId);
    
    // El middleware isClient ya garantiza que el rol es 'client'
    if (req.user.id !== client_id) {
        return res.status(403).json({ message: "Acceso denegado. Solo puedes consultar tu propia rutina activa." });
    }
    
    // Calculamos el día de la semana actual (1 = Lunes, 7 = Domingo)
    const day = new Date().getDay(); 
    const dayOfWeek = day === 0 ? 7 : day; 

    const activeAssignment = await getActiveRoutineByClientId(client_id, Number(gym_id), dayOfWeek);
    if (!activeAssignment) return res.status(404).json({ message: "No tienes una rutina asignada para el día de hoy." });
    
    // Buscamos la cabecera de la rutina
    const routineHeader = await getRoutineById(activeAssignment.routine_id, Number(gym_id));
    
    // Obtenemos los ejercicios. 
    // Si la rutina tiene ejercicios específicos por día (en routine_exercises), los filtramos.
    // Si no, traemos todos los de esa rutina.
    const exercises = await getExercisesByRoutineId(activeAssignment.routine_id, Number(gym_id), dayOfWeek);
    const finalExercises = exercises.length > 0 ? exercises : await getExercisesByRoutineId(activeAssignment.routine_id, Number(gym_id));

    res.status(200).json({ 
      message: "Tu rutina activa ha sido obtenida", 
      assignment: activeAssignment,
      routine: {
        ...routineHeader,
        exercises: finalExercises
      } 
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno al obtener la rutina" });
  }
};

export const deactivateRoutine = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id); // ID de client_routines
    const gym_id = req.user.gym_id;
    
    const deactivated = await deactivateClientRoutine(id, Number(gym_id));
    if (!deactivated) return res.status(404).json({ error: "Asignación no encontrada" });
    
    res.status(200).json({ message: "Rutina desactivada para el cliente", assignment: deactivated });
  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  }
};

export const fetchClientRoutines = async (req: Request, res: Response) => {
  try {
    const gym_id = req.user.gym_id;
    const client_id = Number(req.params.clientId);
    
    const assignments = await getClientRoutines(client_id, Number(gym_id));

    res.status(200).json({ 
      message: "Rutinas del cliente obtenidas", 
      assignments
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno al obtener las rutinas del cliente" });
  }
};

