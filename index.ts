import app from "./src/app.js";
import dotenv from "dotenv";
import { startCronJobs } from "./src/service/cronService.js";
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
    console.log("🚀 Proceso API iniciado (WhatsApp vía whaibot.com)");
    startCronJobs();
});


// Código para obtener las versiones de geminis disponibles
// async function listModels() {
//   try {
//     const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`);
//     const data = await response.json();
//     console.log("📋 Modelos disponibles para tu cuenta:", data.models?.map((m: any) => m.name));
//   } catch (e) {
//     console.error("Error al listar modelos:", e);
//   }
// }

// listModels();

import fs from "fs";
import path from "path";


const tempFolder = "./temp_audio";
const carnetsFolder = "./carnets";

// Crear las carpetas si no existen al arrancar el servidor
if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder);
    console.log("📁 Carpeta 'temp_audio' creada automáticamente.");
}
if (!fs.existsSync(carnetsFolder)) {
    fs.mkdirSync(carnetsFolder);
    console.log("📁 Carpeta 'carnets' creada automáticamente.");
}