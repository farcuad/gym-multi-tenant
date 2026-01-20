import type { Request, Response, NextFunction } from "express";
import type { TokenPlayLoad } from "../types/AuthType.js";
import jwt from "jsonwebtoken";
// Traemos la clave secreta desde el .env
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export const authToken = (req: Request, res: Response, next: NextFunction) => {
    // Obtenemos el token del encabezado Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    // Validamos si el token existe
    if(!token) {
        return res.status(401).json({ message: "Acceso denegado. Token no proporcionado" });
    }

    try {
        // Verificamos el token
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPlayLoad;
        req.user =  {
            id: decoded.id,
            gym_id: decoded.gym_id,
            role: decoded.role,
        };
        // Si el token es válido, pasamos al siguiente middleware
        next();
    }catch (error) {
        return res.status(403).json({ message: "Token inválido" });
    }
}

