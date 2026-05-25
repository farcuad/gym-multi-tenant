import type { Request, Response } from "express";
import { getMetrticsPayments, getMonthlyNewClients, getBalanceFinancieroMes, getGastosPorCategoria } from "../models/Metricas.js";
import { z } from "zod";

const queryMetricsSchema = z.object({
  anio: z.string().transform(val => parseInt(val, 10)).optional(),
  mes: z.string().transform(val => parseInt(val, 10)).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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

    if (!parsedQuery.success) {
      return res.status(400).json({ error: "Formato de rango inválido (YYYY-MM-DD)" });
    }
    // 1. Inicializamos las variables de fecha
    let startDate: string;
    let endDate: string;

    // CASO 1: Si el frontend envía rango de fechas en la URL
    if (parsedQuery.data.startDate && parsedQuery.data.endDate) {
      startDate = parsedQuery.data.startDate;
      endDate = parsedQuery.data.endDate;
    }
    // CASO 2: Comportamiento por defecto (Mes actual completo)
    else {
      const hoy = new Date();
      const anio = parsedQuery.data.anio ? parsedQuery.data.anio : hoy.getFullYear();
      const mes = parsedQuery.data.mes ? parsedQuery.data.mes : (hoy.getMonth() + 1);
      const mesString = String(mes).padStart(2, '0');

      startDate = `${anio}-${mesString}-01`;
      const ultimoDia = new Date(anio, mes, 0).getDate();
      endDate = `${anio}-${mesString}-${String(ultimoDia).padStart(2, '0')}`;
    }
    // 4. Ejecutamos la consulta por rango (que sirve tanto para el mes entero como para un solo día)
    const [balance, porCategoria] = await Promise.all([
      getBalanceFinancieroMes(gym_id, startDate, endDate),
      getGastosPorCategoria(gym_id, startDate, endDate)
    ]);

    return res.status(200).json({
      message: "Métricas de finanzas obtenidas correctamente",
      data: {
        filtros: { startDate, endDate }, // El frontend siempre sabrá qué rango se terminó aplicando
        balance,
        porCategoria
      }
    });
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