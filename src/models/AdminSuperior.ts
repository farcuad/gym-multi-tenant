import { query } from "../connect/connect.js";
import type { GymSummary, PlanUpgradeData } from "../types/AdminSuperior.js";

export const getAllGymsData = async (): Promise<GymSummary[]> => {
    const sql = `
        SELECT 
            g.id, 
            g.name_gym, 
            g.system_plan, 
            u.name as owner_name, 
            u.email as owner_email,
            COALESCE(s.status, 'inactive') as status,
            MAX(s.end_date) as expiration_date
        FROM gyms g
        INNER JOIN users u ON g.id = u.gym_id
        LEFT JOIN gym_subscriptions s ON g.id = s.gym_id
        WHERE u.role = 'gym_owner'
        GROUP BY g.id, u.name, u.email, s.status;
    `;
    const result = await query(sql);
    return result.rows;
};

export const updatePlanGyms = async (data: PlanUpgradeData)=> {
    await query("BEGIN");
    try {
        const { gymId, planType, price} = data;
        await query("UPDATE gyms SET system_plan = $1 WHERE id = $2", [planType, gymId]);

        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + data.monts);

        await query(
            "INSERT INTO gym_subscriptions (gym_id, plan_type, price_paid, end_date) VALUES ($1, $2, $3, $4)",
            [gymId, planType, price, endDate]
        )

        await query("COMMIT");
    }catch(error){
        await query("ROLLBACK");
        throw error;
    
    }
}