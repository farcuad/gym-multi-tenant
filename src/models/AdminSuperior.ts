import { query } from "../connect/connect.js";
import type { GymSummary, PlanUpgradeData } from "../types/AdminSuperior.js";

export const getAllGymsData = async (): Promise<GymSummary[]> => {
  const sql = `
        SELECT DISTINCT ON (g.id)
    g.id,
    g.name_gym,
    g.timezone,
    g.phone_prefix,
    u.name as owner_name,
    u.email as owner_email,
    s.plan_type as system_plan,
    s.status,
    s.end_date as expiration,
    -- Calculamos si está vencido o a punto de vencer (menos de 5 días)
    CASE 
        WHEN s.end_date < CURRENT_DATE THEN 'expired'
        WHEN s.end_date <= CURRENT_DATE + INTERVAL '5 days' THEN 'warning'
        ELSE 'active'
    END as health_status
FROM gyms g
INNER JOIN users u ON g.id = u.gym_id
LEFT JOIN gym_subscriptions s ON g.id = s.gym_id
WHERE u.role = 'admin'
ORDER BY g.id, s.end_date DESC;

    `;
  const result = await query(sql);
  return result.rows;
};

export const updatePlanGyms = async (data: PlanUpgradeData) => {
  await query("BEGIN");
  try {
    const { gymId, planType, price, monts } = data;
    const currentSub = await query(
      "SELECT end_date FROM gym_subscriptions WHERE gym_id = $1 ORDER BY end_date DESC LIMIT 1",
      [gymId],
    );
    let startDate = new Date();
    if (currentSub.rows.length > 0) {
      const currentEndDate = new Date(currentSub.rows[0].end_date);
      if (currentEndDate > startDate) {
        startDate = currentEndDate;
      }
    }
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + monts);

    await query(
      "UPDATE gym_subscriptions SET status = 'replaced' WHERE gym_id = $1 AND status = 'active'",
      [gymId],
    );
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

export const getHistoryGyms = async (gymId: number) => {
  const sql = `
    SELECT plan_type, price_paid, end_date, status, created_at
    FROM gym_subscriptions
    WHERE gym_id = $1
    ORDER BY created_at DESC;
  `;
  const result = await query(sql, [gymId]);
  return result.rows;
};
