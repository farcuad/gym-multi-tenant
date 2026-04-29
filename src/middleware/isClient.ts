import type { Request, Response, NextFunction } from "express";

export const isClient = (req: Request, res: Response, next: NextFunction) => {
    // Verificamos si el usuario tiene el rol exclusivo de cliente
    if(req.user && (req.user.role === "client" || req.user.role === "trainer" || req.user.role === "admin" )) {
        return next();
    }

    return res.status(403).json({ error: "Acceso denegado: Este endpoint es exclusivo para clientes con inicio de sesión por cédula" });
}
