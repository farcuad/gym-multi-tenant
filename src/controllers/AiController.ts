// Controlador para la inteligencia artificial
import type { Request, Response } from "express";
import { modelAi } from "../config/geminis.js";
import { getMembershipByGymId } from "../models/Memberships.js";
export const analizarGanancias = async (req: Request, res: Response) => {
  try {
    // Obtenemos el gym_id del usuario autenticado
    const gym_id = req.user.gym_id;
    // Obtenemos la pregunta del usuario
    const { preguntaUsuario } = req.body;
    // Obtenemos las membresias pasandole el gym_id
    const memberships = await getMembershipByGymId(Number(gym_id));
    // Obtenemos la fecha de hoy
    const fechaHoy = new Date().toISOString().split("T")[0];
    // Creamos el prompt
    const systemPrompt = `
  Actúas como el asistente analista de un Gimnasio. 
  FECHA DE REFERENCIA HOY: ${fechaHoy}

  DATOS DE MEMBRESÍAS:
  ${JSON.stringify(memberships)} 

  TAREA:
  Responde a la pregunta del usuario usando los datos proporcionados. 
  - Si pide listas, identifícalos por fecha_vencimiento.
  - Si pide cálculos de dinero, suma los campos "plan_price" correspondientes.
  - Sé específico y directo.

  IMPORTANTE: Responde ÚNICAMENTE en formato JSON con esta estructura:
  {
    "respuesta": "Aquí va tu respuesta detallada, cálculos o explicaciones",
    "datos_clave": [] // Aquí pon los objetos de los socios involucrados si aplica, o un array vacío si es un cálculo general.
  }

  PREGUNTA DEL USUARIO: ${preguntaUsuario}
`;
    // Le pasamos el prom a geminis
    const result = await modelAi.generateContent(systemPrompt);
    const response = await result.response;
    // Convertimos la respuesta a JSON
    let text = await response.text();
    text = text.replace(/```json|```/g, "").trim();
    try {
      const jsonResponde = JSON.parse(text);

      res.status(200).json(jsonResponde);
    } catch (error) {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
