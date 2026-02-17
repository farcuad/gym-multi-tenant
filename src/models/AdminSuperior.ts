import { query } from "../connect/connect.js";
import type { GymSummary, PlanUpgradeData } from "../types/AdminSuperior.js";

export const getAllGymsData = async (): Promise<GymSummary[]> => {
  const sql = `
        SELECT DISTINCT ON (g.id)
    g.id,
    g.name_gym,
    u.name as owner_name,
    u.email as owner_email,
    s.plan_type,
    s.status,
    s.end_date as expiration_date
FROM gyms g
INNER JOIN users u ON g.id = u.gym_id
LEFT JOIN gym_subscriptions s ON g.id = s.gym_id
WHERE u.role = 'gym_owner'
ORDER BY g.id, s.end_date DESC;

    `;
  const result = await query(sql);
  return result.rows;
};

export const updatePlanGyms = async (data: PlanUpgradeData) => {
  await query("BEGIN");
  try {
    const { gymId, planType, price, monts } = data;

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monts);

    await query(
      "INSERT INTO gym_subscriptions (gym_id, plan_type, price_paid, end_date) VALUES ($1, $2, $3, $4)",
      [gymId, planType, price, endDate],
    );

    await query("COMMIT");
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }
};
