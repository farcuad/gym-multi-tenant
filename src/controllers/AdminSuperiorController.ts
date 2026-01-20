// Este controlador es para el dueño del sistema, osea el admin
import type { Request, Response } from "express";
import { getAllGymsData, updatePlanGyms } from "../models/AdminSuperior.js";

// Funcion para obtener los datos de los gimnasios
export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const gyms = await getAllGymsData();
    return res.status(200).json({ message: "Datos obtenidos correctamente", gyms });
  } catch (error) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Funcion para asignarle planes los gimnasios
export const updatePlan = async (req: Request, res: Response) => {
  try {
    // Obtenemos el id del gimnasio de los parametros
    const { id } = req.params;
    // Obtenemos los datos del plan del cuerpo
    const {  planType, monts, price } = req.body;
    // Tipamos el id del gimnasio
    const gymId = Number(id);
    const validatePlans = ["Basic", "Medium", "Premium"];
    // Validamos planes
    if (!validatePlans.includes(planType)) {
      return res.status(400).json({ error: "Tipo de plan inválido" });
    }
    // Hacemos la consulta pasandole los parametros
    await updatePlanGyms({ id: gymId, gymId: gymId, planType, monts, price });
    return res.status(200).json({ message: `Plan ${planType} actualizado correctamente` });
  } catch (error) {
    return res.status(500).json({
      error: "Error interno",
      detail: (error as Error).message,
    });
  }
};
