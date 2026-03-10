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
    `SELECT *, (end_date < (CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'America/Caracas')::date) as is_expired
     FROM gym_subscriptions 
     WHERE gym_id = $1 AND status IN ('active', 'trialing')
     ORDER BY end_date DESC LIMIT 1`,
    [req.user.gym_id],
  );

  const subscription = result.rows[0];

  if (!subscription) {
    return res.status(403).json({ message: "Subscripcion no encontrada" });
  }

  if (new Date(subscription.end_date) < new Date()) {
    return res.status(403).json({
      code: "SUBSCRIPTION_EXPIRED",
      message: "Tu periodo de prueba o suscripción ha vencido.",
    });
  }
  req.subscription = subscription;
  next();
};
