import type { Request, Response } from "express";
import { createConfigApp, getConfigApp, updatedConfigApp, deleteConfig } from "../models/AppConfig.js";
import { z } from "zod";
export const createConfigAppController = async (req: Request, res: Response) => {
    try {
        const config = await createConfigApp(req.body);
        res.json({ message: "Configuracion de app guardada correctamente", config: config });
    } catch (error) {
        if(error instanceof z.ZodError) {
            return res.status(400).json({ error: "Datos de entrada inválidos", details: error.issues });
        }
        res.status(500).json({ error: "Error interno del servidor" });
    }
}

export const getCongigApp = async (req: Request, res: Response) => {
    try {
        const platform = req.query.platform as string;
        const getConfig = await getConfigApp(platform);
        res.json({ message: "Configuracion de app obtenida correctamente", config: getConfig })
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
}

export const updatedConfigAppController = async (req: Request, res: Response) => {
    try {
        const config = await updatedConfigApp(req.body);
        res.json({ message: "Configuracion de app actualizada correctamente", config: config })
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
}

export const deleteConfigController = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const config = await deleteConfig(id);
        res.json({ message: "Configuracion de app eliminada correctamente", config: config })
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
}   