import type { Request, Response } from "express";
import { getSubscriptions } from "../models/Subscriptions.js";
export const getSubscription = async (req: Request, res: Response) => {
    const subscriptions = await getSubscriptions(req.user.gym_id);
    if(subscriptions.length === 0) {
        return res.status(404).json({ message: "No se encontraron suscripciones" });
    }
    return res.status(200).json(subscriptions[0]);
}