import app from "./src/app.js";
import dotenv from "dotenv";
import { initWhatsApp } from "./src/config/Whatsapp.js";
import { startCronJobs } from "./src/service/cronService.js";


dotenv.config();

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
    initWhatsApp();
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