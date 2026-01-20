import type { Request, Response, NextFunction } from "express";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    // Verificamos si el usuario es administrador
    if(req.user && req.user.role === "super_admin" ) {
        return next();
    }

    return res.status(403).json({ error: "Acceso denegado" });

}