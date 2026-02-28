// Controlador para la inteligencia artificial
import type { Request, Response } from "express";
import { getModel } from "../config/geminis.js";
import { getChatForUser } from "../config/chatStore.js";
import { registerClient, getClientsByGymId } from "../models/Clients.js";
import { registerPlan, getPlansByGymId } from "../models/Plans.js";
import { getMembershipByGymId } from "../models/Memberships.js";
import { getPayment } from "../models/Payments.js";
import {
  getMetrticsPayments,
  getMonthlyNewClients,
} from "../models/Metricas.js";
export const analizarGanancias = async (req: Request, res: Response) => {
  try {
    const gymId = req.user.gym_id;
    const userId = String(req.user.id);
    const { preguntaUsuario } = req.body;

    // Iniciamos el chat
    const modelAi = getModel();
    const chat = getChatForUser(userId, modelAi);
    let result = await chat.sendMessage(preguntaUsuario);

    // Bucle Multi-Turno: Permite encadenar (Buscar -> Registrar -> Asignar)
    let loopCount = 0;
    const MAX_LOOPS = 4; // Límite para evitar bucles infinitos
    let calls = result.response.functionCalls();
    while (calls && calls.length > 0 && loopCount < MAX_LOOPS) {
      const resultsForGemini = [];

      for (const call of calls) {
        let data;
        const args = call.args as any;

        switch (call.name) {
          case "buscarClientes":
            data = await getClientsByGymId(gymId);
            break;

          case "buscarPlanes":
            data = await getPlansByGymId(gymId);
            break;

          case "buscarMembresias":
            data = await getMembershipByGymId(gymId);
            break;

          case "registrarCliente":
            if (!args.name || !args.cedula || !args.phone) {
              data = { error: "Datos incompletos" };
              break;
            }
            data = await registerClient({
              ...args,
              gym_id: gymId,
            });
            break;

          case "registrarPlan":
            data = await registerPlan({
              ...args,
              gym_id: gymId,
            });
            break;
          case "consultarPagos":
            const { startDate, endDate } = args;
            data = await getPayment(gymId, startDate, endDate);
            break;
          case "consultarMetricasIngresos": {
            const year = args.year || new Date().getFullYear();
            data = await getMetrticsPayments(year, gymId);
            break;
          }

          case "consultarMetricasNuevosClientes": {
            const year = args.year || new Date().getFullYear();
            data = await getMonthlyNewClients(year, gymId);
            break;
          }
        }

        resultsForGemini.push({
          functionResponse: { name: call.name, response: { content: data } },
        });
      }

      result = await chat.sendMessage(resultsForGemini);
      calls = result.response.functionCalls();
      loopCount++;
    }

    // Respuesta final para el Admin (texto natural)
    res.json({ respuesta: result.response.text() });
  } catch (error) {
    console.error("Error en Agente IA:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
