import type { Request, Response } from 'express';
import { getPayment } from '../models/Payments.js';

export const getPayments = async (req: Request, res: Response) => {
    try {
        // Obtenemos el gym_id del token de autenticación
        const gym_id = Number(req.user.gym_id);
        // Obtenemos el pago
        const payment = await getPayment(gym_id);
        res.status(200).json({ message: "Historial de pagos obtenidos correctamente", payment });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};  