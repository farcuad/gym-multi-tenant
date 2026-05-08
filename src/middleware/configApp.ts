import type { Request, Response, NextFunction } from 'express';

export const configApp = async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers["x-client-key"];

    const validateKey = process.env.INTERNAL_SERVICE_API_KEY

    if (!apiKey || apiKey !== validateKey) {
        return res.status(401).json({ error: "Personal no autorizado" })
    }

    next();
}