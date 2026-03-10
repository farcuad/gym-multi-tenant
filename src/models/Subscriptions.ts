import { query } from "../connect/connect.js";

export const getSubscriptions = async (gymId: number) => {
    const sql = `
        SELECT plan_type, status, start_date, end_date
        FROM gym_subscriptions
        WHERE gym_id = $1
        ORDER BY end_date DESC
    `;
    const result = await query(sql, [gymId]);
    return result.rows;
};