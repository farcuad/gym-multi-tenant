import { Request } from "express";

declare global {
    namespace Express {
        interface Request {
            user: {
                id: number;
                gym_id: number | null;
                role: 'super_admin' | 'gym_owner';
                system_plan: 'Basic' | 'Medium' | 'Premium';
            };
        }
    }
}
