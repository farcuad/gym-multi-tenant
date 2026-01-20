import type { Request, Response } from "express";
import { registerPlan, getPlansByGymId, updatePlan, deletePlan } from "../models/Plans.js";

// Funcion para crear un nuevo plan
export const createPlan = async (req: Request, res: Response) => {
    try {
        // Obtener gym_id del usuario autenticado
        const gym_id = req.user.gym_id;
        // Crear el plan
        const planData = { ...req.body, gym_id: gym_id };
        // Registrar el plan
        const plan = await registerPlan(planData);
        res.status(201).json({ message: "Plan registrado correctamente", plan });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

// Funcion para obtener todos los planes de un gimnasio
export const fetchPlansByGymId = async (req: Request, res: Response) => {
    try{
        // Obtenemos el gym_id del usuario autenticado
        const gym_id = req.user.gym_id;
        // Obtenemos los planes
        const plans = await getPlansByGymId(Number(gym_id));
        res.status(200).json({ message: "Planes obtenidos correctamente", plans});
    }catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

// Funcion para actualizar los planes
export const modifyPlan = async (req: Request, res: Response) => {
    try {
        // Obtenemos el id del plan de los parámetros de la ruta 
        const id = Number(req.params.id);
        // Obtenemos el gym_id del usuairo autenticado
        const gym_id = req.user.gym_id;
        //Obtenemos los datos a actualizar
        const data = req.body;
        // Actualizamos el plan
        const updatedPlan = await updatePlan(id, Number(gym_id), data);
        // Si algo fallo, mandamos mensaje
        if(!updatedPlan) {
            return res.status(404).json({ error: "Plan no encontrado o sin datos para actualizar" });
        }
        // Devolvemos el plan actualizado
        res.status(200).json({ message: "Plan actualizado correctamente", plan: updatedPlan });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
}
// Funcion para eliminar un plan
export const removePlan = async (req: Request, res: Response) => {
    try {
        // Obtenemos el id de el plan de los parámetros de la ruta
        const id = Number(req.params.id);
        // Obtenemos el gym_id del usuario autenticado
        const gym_id = req.user.gym_id;
        // Eliminamos el plan
        const deleted = await deletePlan(id, Number(gym_id)); 
        // Si algo fallo, mandamos mensaje  
        if(!deleted) {
            return res.status(404).json({ error: "Plan no encontrado" });
        }
        res.status(200).json({ message: "Plan eliminado correctamente" });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};