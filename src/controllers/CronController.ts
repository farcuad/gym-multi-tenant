import type { Request, Response } from "express";
import { ejecutarNotifiaciones } from "../service/cronService.js";

export const checkMemberships = async (req: Request, res: Response) => {
    // 🛡️ SEGURIDAD: Evitar que cualquiera que descubra la URL ejecute el cron
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: "No autorizado" });
    }

    try {
        console.log("⏰ Iniciando tareas programadas desde Vercel Cron...");
        await ejecutarNotifiaciones();
        return res.status(200).json({ success: true, message: "Alertas procesadas con éxito" });
    } catch (error) {
        console.error("Error en el cron:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
};
