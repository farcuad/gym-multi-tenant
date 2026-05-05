import type { Request, Response, NextFunction } from "express";
export const requirePlan = (minPlan: "Basic" | "Medium" | "Premium") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Asignamos un valor numérico a cada plan para comparar niveles
    const planWeights: Record<string, number> = {
      trial: 1,
      Basic: 1,
      Medium: 2,
      Premium: 3,
      Premiun: 3, // Soporte para variante en español
    };

    const userPlan = (req.subscription.plan_type || "") as string;
    const userWeight = planWeights[userPlan] || 0;
    const minWeight = planWeights[minPlan] || 0;

    if (userWeight >= minWeight) {
      return next();
    }

    return res.status(403).json({
      error: "Acceso denegado",
      message: `Esta función requiere el plan ${minPlan} o superior. Tu plan actual es: ${userPlan}`,
    });
  };
};
