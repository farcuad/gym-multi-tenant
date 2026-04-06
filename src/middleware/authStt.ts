import type { Request, Response, NextFunction } from "express";

export const validateSTTKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-stt-key"]; // Nombre de cabecera personalizado

  if (!apiKey || apiKey !== process.env.STT_INTERNAL_KEY) {
    console.warn(`🚫 Acceso denegado a STT desde: ${req.ip}`);
    return res.status(401).json({
      success: false,
      error: "No autorizado",
      message: "API Key de STT inválida o ausente"
    });
  }

  next();
};