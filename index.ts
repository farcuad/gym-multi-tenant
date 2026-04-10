import app from "./src/app.js";
import dotenv from "dotenv";
import { initWhatsApp, whatsappClient } from "./src/config/Whatsapp.js";
import { startCronJobs } from "./src/service/cronService.js";
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
dotenv.config();

const PORT = process.env.name === 'FitLog' ? 3000 : 4000;

app.post('/webhook/send-membership', async (req, res) => {
    const { phone, message, pdf, filename } = req.body;
    if (process.env.name !== 'FitLog') {
        return res.status(404).json({ error: "Este proceso no gestiona WhatsApp" });
    }
    try {
        const chatId = `${phone}@c.us`;

        await whatsappClient.sendMessage(`${phone}@c.us`, message);
        if(pdf) {
            console.log(`📄 Enviando carnet PDF a ${phone}...`);
            const media = new MessageMedia(
                'application/pdf', 
                pdf, 
                filename || 'Carnet_FitLog.pdf'
            );
            
            await whatsappClient.sendMessage(chatId, media, { 
                caption: 'Aquí tienes tu carnet digital. 💪🏋️‍♂️' 
            });
        }
        console.log(`📩 Mensaje procesado para ${phone}`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error al enviar desde el bot:", error);
        res.status(500).json({ error: "No se pudo enviar el mensaje" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
    if (process.env.name === 'FitLog') {
        console.log("🤖 Iniciando WhatsApp Client en proceso FitLog...");
        initWhatsApp();
    } else {
        console.log("🚀 Proceso API iniciado (Sin WhatsApp local)");
    }
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

// Crear la carpeta si no existe al arrancar el servidor
if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder);
    console.log("📁 Carpeta 'temp_audio' creada automáticamente.");
}