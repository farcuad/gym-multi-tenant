import type { Request, Response } from "express";

export const getSubscriptions = async (req: Request, res: Response) => {
    const subscription = req.subscription;
    return res.status(200).json({ message: "Obtener suscripciones", 
        plan_type: subscription.plan_type,
        status: subscription.status,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
     });
}