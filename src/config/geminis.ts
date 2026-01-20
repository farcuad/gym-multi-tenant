import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
// Comprobamos si existe la api key
if (!API_KEY) {
    throw new Error("API_KEY no encontrada en las variables de entorno.");
}

const genAI = new GoogleGenerativeAI(API_KEY);  

// Obtenemos el modelo
export const modelAi = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: "v1" });