import type { Request, Response } from "express";
import { z } from "zod";
import { 
  registerExercise, 
  getExercisesByGymId, 
  getExerciseById, 
  updateExerciseById, 
  deleteExerciseById 
} from "../models/Exercises.js";

export const createExercise = async (req: Request, res: Response) => {
  try {
    const gym_id = req.user.gym_id;
    const exercise = await registerExercise(Number(gym_id), req.body);
    res.status(201).json({ message: "Ejercicio registrado correctamente", exercise });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Datos de entrada inválidos", details: error.issues });
    }
    res.status(500).json({ error: (error as Error).message });
  }
};

export const fetchExercises = async (req: Request, res: Response) => {
  try {
    const gym_id = req.user.gym_id;
    const exercises = await getExercisesByGymId(Number(gym_id));
    res.status(200).json({ message: "Ejercicios obtenidos", exercises });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const fetchExerciseById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const gym_id = req.user.gym_id;

    const exercise = await getExerciseById(id, Number(gym_id));
    
    if (!exercise) {
      return res.status(404).json({ error: "Ejercicio no encontrado" });
    }
    res.status(200).json({ message: "Ejercicio obtenido", exercise });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateExercise = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const gym_id = req.user.gym_id;
    const updated = await updateExerciseById(id, Number(gym_id), req.body);
    
    if (!updated) {
      return res.status(404).json({ error: "Ejercicio no encontrado o sin cambios" });
    }
    res.status(200).json({ message: "Ejercicio actualizado", exercise: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Datos de entrada inválidos", details: error.issues });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteExercise = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const gym_id = req.user.gym_id;
    
    const deleted = await deleteExerciseById(id, Number(gym_id));
    if (!deleted) {
      return res.status(404).json({ error: "Ejercicio no encontrado" });
    }
    res.status(200).json({ message: "Ejercicio eliminado" });
  } catch (error: any) {
    if (error.code === '23503') {
      return res.status(400).json({ message: "No se puede eliminar porque está en uso en rutinas" });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
