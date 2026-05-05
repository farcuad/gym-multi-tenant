import type { Request, Response, NextFunction } from "express";
import { getSubscriptions } from "../models/Subscriptions.js";
export const loadSubscription = async ( req: Request, res: Response, next: NextFunction,) => {
  if (!req.user) {
    return res.status(401).json({ message: "No autorizado" });
  }
  if (req.user.role === "super_admin") {
    return next();
  }

  const subscription = await getSubscriptions(req.user.gym_id);

  if (!subscription) {
    return res.status(403).json({ message: "Subscripcion no encontrada" });
  }

  if (subscription.is_expired) {
    return res.status(403).json({
      code: "SUBSCRIPTION_EXPIRED",
      message: "Tu periodo de prueba o suscripción ha vencido.",
    });
  }
  req.subscription = subscription;
  next();
};
