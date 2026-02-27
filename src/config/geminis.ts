import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclaration,
} from "@google/generative-ai";

import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY no encontrada en las variables de entorno.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Tools calling para geminis
export const gymTools: FunctionDeclaration[] = [
  {
    name: "buscarClientes",
    description: "Obtiene la lista de clientes del gimnasio para buscar IDs.",
  },
  {
    name: "buscarPlanes",
    description: "Obtiene la lista de planes del gimnasio para buscar IDs.",
  },
  {
    name: "buscarMembresias",
    description: "Obtiene las membresías del gimnasio.",
  },
  {
    name: "registrarCliente",
    description:
      "Registra un nuevo cliente en el gimnasio. Una vez lo crees, no digas su id.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        cedula: { type: SchemaType.STRING },
        phone: { type: SchemaType.STRING },
      },
      required: ["name", "cedula", "phone"],
    },
  },
  {
    name: "registrarPlan",
    description:
      "Crea un nuevo plan de entrenamiento. Una vez lo crees, no digas su id.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        duration_day: { type: SchemaType.NUMBER },
        price: { type: SchemaType.NUMBER },
      },
      required: ["name", "duration_day", "price"],
    },
  },
  {
    name: "consultarPagos",
    description:
      "Obtiene el historial de pagos (ingresos) del gimnasio, incluyendo montos en bolívares, dólares, métodos de pago y nombres de clientes.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        startDate: {
          type: SchemaType.STRING,
          description: "Fecha opcional de inicio (YYYY-MM-DD)",
        },
        endDate: {
          type: SchemaType.STRING,
          description: "Fecha opcional de fin (YYYY-MM-DD)",
        },
      },
    },
  },
];

// Exportamos el modelo con la instrucción del sistema para que el chatStore lo use. Esto asegura que cada usuario tenga un chat con el mismo modelo e instrucciones.
export const getModel = () => {
  const hoy = new Date().toISOString().split("T")[0];

  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ functionDeclarations: gymTools }],
    systemInstruction: `
Eres FitLog AI, un asistente para administración de gimnasios.
FECHA DE HOY: ${hoy}

REGLAS OBLIGATORIAS:
- NO inventes IDs.
- PROHIBIDO mencionar nombres de funciones técnicas (ej. No digas 'buscarClientes()', etc.).
- SOLO usa IDs obtenidos mediante tools.
- NUNCA pidas 'client_id' o 'plan_id' al usuario. Esos datos son técnicos y el usuario no los conoce.
- gym_id SIEMPRE es inyectado por el sistema, NUNCA lo pidas.
- Los IDs de cliente, plan los genera el sistema automáticamente.
- Para registrar un cliente SOLO necesitas: nombre, cédula y teléfono.
- Si el usuario no proporciona uno de esos datos, pídeselo en una sola pregunta clara.
- Si el cliente no existe: registrarCliente.
- Responde siempre breve, clara y motivadora.
- fecha_ingreso y activo son asignados automáticamente por el sistema.
- Si la función 'consultarPagos' devuelve un array vacío, responde exactamente que no hay registros para ese periodo.
- NO des respuestas basadas en tus propios conocimientos sobre el gimnasio; usa ÚNICAMENTE los datos devueltos por las funciones.
- Si te piden datos del "mes pasado" o "esta semana", calcula las fechas correctas basándote en la FECHA DE HOY y pásalas a la función.

`,
  });
};
