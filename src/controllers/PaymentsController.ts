import type { Request, Response } from 'express';
import { getPayment } from '../models/Payments.js';
import { getPaymentsListCache, setPaymentsListCache } from '../service/paymentsCache.service.js';

export const getPayments = async (req: Request, res: Response) => {
    try {
        // Obtenemos el gym_id del token de autenticación
        const gym_id = Number(req.user.gym_id);
        // Verificamos cache
        const cachePayments = await getPaymentsListCache(gym_id);
        if (cachePayments) {
            return res.status(200).json({ message: "Historial de pagos obtenidos correctamente de la caché", payment: cachePayments });
        }
        // Obtenemos el pago
        const payment = await getPayment(gym_id);
        // Guardamos en cache
        await setPaymentsListCache(gym_id, payment);
        res.status(200).json({ message: "Historial de pagos obtenidos correctamente", payment });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};  