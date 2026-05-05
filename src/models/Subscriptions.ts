import { query } from "../connect/connect.js";

export const getSubscriptions = async (gymId: number) => {
    const sql = `
        SELECT *, (end_date < (CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'America/Caracas')::date) as is_expired
        FROM gym_subscriptions
        WHERE gym_id = $1 AND status IN ('active', 'trialing')
        ORDER BY end_date DESC
        LIMIT 1
    `;
    const result = await query(sql, [gymId]);
    return result.rows[0];
};