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

// ===============================
// TOOLS (FUNCTION DECLARATIONS)
// ===============================
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
    description: "Registra un nuevo cliente en el gimnasio.",
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
    description: "Crea un nuevo plan de entrenamiento.",
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
    name: "asignarMembresia",
    description: "Asigna un plan a un cliente.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        client_id: { type: SchemaType.NUMBER },
        plan_id: { type: SchemaType.NUMBER },
        fecha_inicio: { type: SchemaType.STRING },
      },
      required: ["client_id", "plan_id"],
    },
  },
];


// ===============================
// MODEL
// ===============================
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
- SOLO usa IDs obtenidos mediante tools.
- Si el usuario menciona un cliente o plan por nombre, primero busca su ID.
- Si el cliente no existe: registraCliente → luego asignarMembresia.
- Responde siempre breve, clara y motivadora.
`,
  });
};
