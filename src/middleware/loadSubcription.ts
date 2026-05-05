import type { Request, Response, NextFunction } from "express";
import { getSubscriptions } from "../models/Subscriptions.js";
export const loadSubscription = async ( req: Request, res: Response, next: NextFunction,) => {
  if (!req.user) {
    return res.status(401).json({ message: "No autorizado" });
  }
  if (req.user.role === "super_admin") {
    return next();
  }

  const subscriptions = await getSubscriptions(req.user.gym_id);
  const subscription = subscriptions.find((sub: any) => 
    (sub.status === 'active' || sub.status === 'trialing') && !sub.is_expired
  );

  if (!subscription) {
    return res.status(403).json({ message: "Subscripcion no encontrada o expirada" });
  }
  req.subscription = subscription;
  next();
};
