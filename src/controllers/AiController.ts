// Controlador para la inteligencia artificial
import type { Request, Response } from "express";
import { getModel } from "../config/geminis.js";
import { registerClient, getClientsByGymId } from "../models/Clients.js";
import { registerPlan, getPlansByGymId } from "../models/Plans.js";
import {
  getMembershipByGymId,
  registerMembership,
} from "../models/Memberships.js";
export const analizarGanancias = async (req: Request, res: Response) => {
  try {
    const gymId = req.user.gym_id;
    const { preguntaUsuario } = req.body;

    // Iniciamos el chat
    const modelAi = getModel();
    const chat = modelAi.startChat();
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
              data = { error: "Datos incompletos"}
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

          case "asignarMembresia":
            const formatDate = (date: Date): string =>
              date.toISOString().slice(0, 10);

            const fechaInicioISO =
              typeof args.fecha_inicio === "string"
                ? args.fecha_inicio
                : formatDate(new Date());

            const planes = await getPlansByGymId(gymId);
            const plan = planes.find((p) => p.id === Number(args.plan_id));

            if (!plan) {
              data = { error: "Plan no encontrado" };
              break;
            }

            const fechaVencimiento = new Date(fechaInicioISO);
            fechaVencimiento.setDate(fechaVencimiento.getDate() + plan.duration_day);

            const membershipArgs = {
              gym_id: Number(gymId),
              client_id: Number(args.client_id),
              plan_id: Number(args.plan_id),
              fecha_inicio: fechaInicioISO,
              fecha_membresias: formatDate(fechaVencimiento),
              estado: "activo" as const,
            };

            data = await registerMembership(membershipArgs);
            break;
        }

        resultsForGemini.push({
          functionResponse: { name: call.name, response: { content: data } },
        });
      }

      // IMPORTANTE: Enviamos los resultados de las funciones de vuelta a Gemini
      // Esto le permite ver los IDs que acaba de crear o buscar para el siguiente paso
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
