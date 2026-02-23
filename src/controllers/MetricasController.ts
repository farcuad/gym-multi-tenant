import type { Request, Response } from "express";
import { getMetrticsPayments, getMonthlyNewClients } from "../models/Metricas.js";
import { z } from "zod";
export const getMetricsPayments = async (req: Request, res: Response) => {
  try {
    const gym_id = req.user.gym_id;
    const parsedYear = Number(req.query.year);
    const year = !isNaN(parsedYear) ? parsedYear : new Date().getFullYear();
    const metrics = await getMetrticsPayments(year, gym_id);
    return res.status(200).json({ message: "Metricas obtenidas correctamente", metrics });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Datos de entrada inválidos", details: error.issues });
    }
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getMetricsNewClients = async (req: Request, res: Response) => {
  try {
    const gym_id = req.user.gym_id;
    const parsedYear = Number(req.query.year);
    const year = !isNaN(parsedYear) ? parsedYear : new Date().getFullYear();
    const metrics = await getMonthlyNewClients(year, gym_id);
    return res.status(200).json({ message: "Clientes nuevos obtenidos correctamente", metrics: metrics });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Datos de entrada inválidos", details: error.issues });
    }
    return res.status(500).json({ error: "Error interno del servidor" });
}
};
