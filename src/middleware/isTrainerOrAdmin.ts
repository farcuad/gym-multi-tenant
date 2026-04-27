import type { Request, Response, NextFunction } from "express";

export const isTrainerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
    // Verificamos si el usuario es entrenador o administrador del gimnasio
    if(req.user && (req.user.role === "trainer" || req.user.role === "admin" || req.user.role === "super_admin")) {
        return next();
    }

    return res.status(403).json({ error: "Acceso denegado: Se requiere rol de entrenador o administrador" });
}
