import app from "./src/app.js";
import dotenv from "dotenv";
import { initWhatsApp, whatsappClient } from "./src/config/Whatsapp.js";
import { startCronJobs } from "./src/service/cronService.js";


dotenv.config();

const PORT = process.env.PORT;

app.post('/webhook/send-membership', async (req, res) => {
    const { phone, message } = req.body;
    try {
        await whatsappClient.sendMessage(`${phone}@c.us`, message);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error al enviar desde el bot:", error);
        res.status(500).json({ error: "No se pudo enviar el mensaje" });
    }
});

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