import type { Request, Response } from "express";
import { getMetrticsPayments, getMonthlyNewClients, getBalanceFinancieroMes, getGastosPorCategoria } from "../models/Metricas.js";
import { z } from "zod";

const queryMetricsSchema = z.object({
  anio: z.string().transform(val => parseInt(val, 10)).optional(),
  mes: z.string().transform(val => parseInt(val, 10)).optional(),
});
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

export const getFinanzasMetrics = async (req: Request, res: Response) => {
  try {
    const gym_id = req.user.gym_id;
    const parsedQuery = queryMetricsSchema.safeParse(req.query);

    const hoy = new Date();
    const anio = parsedQuery.success && parsedQuery.data.anio ? parsedQuery.data.anio : hoy.getFullYear();
    const mes = parsedQuery.success && parsedQuery.data.mes ? parsedQuery.data.mes : (hoy.getMonth() + 1);

    const [balance, porCategoria] = await Promise.all([
      getBalanceFinancieroMes(gym_id, anio, mes),
      getGastosPorCategoria(gym_id, anio, mes)
    ]);

    return res.status(200).json({
      message: "Métricas de finanzas obtenidas correctamente",
      data: {
        filtros: { anio, mes },
        balance,
        porCategoria
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Datos de entrada inválidos", details: error.issues });
    }
    console.error("ERROR REAL EN METRICAS:", error);
    return res.status(500).json({

      message: "Error interno en el servidor al compilar las estadísticas financieras"
    })
  }
}