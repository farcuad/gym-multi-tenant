import type { Request, Response } from "express";
import { createGastos, getGastosByGymId, updateGastosByGym, deleteGastosGym } from "../models/Gastos.js";

export const createGastosGyms = async (req: Request, res: Response) => {
    try {
        const gym_id = req.user.gym_id;
        const data = req.body;
        const result = await createGastos(gym_id, data);
        return res.status(201).json({ message: "Gastos creado correctamente", result });
    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ message: error.message });
        }
        return res.status(500).json({ message: "Error al crear los gastos" });
    }
}

export const getGastosByGymIdGyms = async (req: Request, res: Response) => {
    try {
        const gym_id = req.user.gym_id;
        const result = await getGastosByGymId(gym_id);
        return res.status(200).json({ message: "Gastos obtenidos correctamente", result });
    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ message: error.message });
        }
        return res.status(500).json({ message: "Error al obtener los gastos" });
    }
}

export const updateGastosByGymGyms = async (req: Request, res: Response) => {
    try {
        const gym_id = req.user.gym_id;
        const id = Number(req.params.id);
        const data = req.body;
        const result = await updateGastosByGym(gym_id, id, data);
        if (!result) {
            return res.status(404).json({ message: "Gastos no encontrado" });
        }
        return res.status(200).json({ message: "Gastos actualizado correctamente", result });
    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ message: error.message });
        }
        return res.status(500).json({ message: "Error al actualizar los gastos" });
    }
}

export const deleteGastosGymGyms = async (req: Request, res: Response) => {
    try {
        const gym_id = req.user.gym_id;
        const id = Number(req.params.id);
        const result = await deleteGastosGym(gym_id, id);
        if (!result) {
            return res.status(404).json({ message: "Gastos no encontrado" });
        }
        return res.status(200).json({ message: "Gastos eliminado correctamente" });
    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ message: error.message });
        }
        return res.status(500).json({ message: "Error al eliminar los gastos" });
    }
}