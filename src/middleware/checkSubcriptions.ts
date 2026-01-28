import type { Request, Response, NextFunction } from "express";
import { query } from "../connect/connect.js";

export const checkSubcription = async (req: Request, res: Response, next: NextFunction,) => {
  try {
    // Verificamos si el usuario esta autenticado
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }

    // Si el usuario es super_admin, pasamos al siguiente middleware
    if (req.user.role === "super_admin") return next();

    const gymId = req.user.gym_id;

    // Consulta sql
    const sql = ` SELECT 
        g.system_plan, 
        s.end_date AS expiration_date
    FROM gyms g
    LEFT JOIN gym_subscriptions s ON g.id = s.gym_id
    WHERE g.id = $1
    ORDER BY s.end_date DESC
    LIMIT 1 `;
    const result = await query(sql, [gymId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Gimnasio no encontrado" });
    }

    const gym = result.rows[0];

    // Validamos los planes
    if (gym.system_plan === "free") {
      req.user.system_plan = "Basic";
      return next();
    }

    // Validación de Expiración
    if (!gym.expiration_date) {
      return res.status(403).json({
        error: "Plan inactivo",
        message: "Tu acceso ha caducado, renueva tu suscripción",
      });
    }
    
    const now = new Date();
    const expiration = new Date(gym.expiration_date);

    if (expiration < now) {
      return res.status(403).json({
        error: "Plan expirado",
        message: `Tu acceso venció el ${expiration.toLocaleDateString()}`,
      });
    }
    req.user.system_plan = gym.system_plan;
    // Todo bien, pasamos al siguiente
    next();
  } catch (error) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
