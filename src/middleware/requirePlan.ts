import type { Request, Response, NextFunction } from "express";

export const requirePlan = (minPlan: 'Basic' | 'Medium' | 'Premium') => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Asignamos un valor numérico a cada plan para comparar niveles
        const planWeights = {
            'Basic': 1,
            'Medium': 2,
            'Premium': 3
        };

        const userPlan = (req.user?.system_plan || 'free') as keyof typeof planWeights;

        if (planWeights[userPlan] >= planWeights[minPlan]) {
            return next();
        }

        return res.status(403).json({
            error: "Acceso denegado",
            message: `Esta función requiere el plan ${minPlan} o superior. Tu plan actual es: ${userPlan}`
        });
    };
};