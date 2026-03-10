import type { Request, Response, NextFunction } from "express";
import { query } from "../connect/connect.js";
export const loadSubscription = async ( req: Request, res: Response, next: NextFunction,) => {
  if (!req.user) {
    return res.status(401).json({ message: "No autorizado" });
  }
  if (req.user.role === "super_admin") {
    return next();
  }
  const result = await query(
    `SELECT plan_type, status, end_date 
     FROM gym_subscriptions 
     WHERE gym_id = $1 
     ORDER BY end_date DESC LIMIT 1`,
    [req.user.gym_id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "No se encontró suscripción" });
  }

  // Devolvemos la data. El Frontend decidirá qué hacer con la end_date
  res.status(200).json(result.rows[0]);
  next();
};
