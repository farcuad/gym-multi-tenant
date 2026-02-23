import { query } from "../connect/connect.js";

export const getMetrticsPayments = async (year: number, gym_id: number) => {
    const sql = `
    SELECT 
      TO_CHAR(months.month, 'YYYY-MM') AS month,
      COALESCE(ROUND(SUM(p.amount_paid_bs / p.exchange_rate), 2),0) AS total_usd
    FROM generate_series(
      DATE_TRUNC('year', MAKE_DATE($1, 1, 1)),
      DATE_TRUNC('year', MAKE_DATE($1, 1, 1)) + INTERVAL '11 months',
      INTERVAL '1 month'
    ) AS months(month)
    LEFT JOIN payments p
      ON DATE_TRUNC('month', p.created_at) = months.month
      AND p.gym_id = $2
      AND p.status = 'Confirmado'
    GROUP BY months.month
    ORDER BY months.month;
  `;
  
  const { rows } = await query(sql, [year, gym_id]);
  return rows.map((row: any) => ({
  month: row.month,
  total_usd: Number(row.total_usd)
}));
}

// funcion para obtener clientes por mes
export const getMonthlyNewClients = async (year: number, gymId: number) => {
  const sql = `
    SELECT 
  TO_CHAR(months.month, 'YYYY-MM') AS month,
  COALESCE(COUNT(c.id), 0) AS total_clients
FROM generate_series(
  DATE_TRUNC('year', MAKE_DATE($1, 1, 1)),
  DATE_TRUNC('year', MAKE_DATE($1, 1, 1)) + INTERVAL '11 months',
  INTERVAL '1 month'
) AS months(month)
LEFT JOIN clients c 
  ON DATE_TRUNC('month', c.fecha_ingreso) = months.month
  AND c.gym_id = $2
GROUP BY months.month
ORDER BY months.month;
  `;

  const { rows } = await query(sql, [year, gymId]);

  return rows.map((row: any) => ({
    month: row.month,
    total_clients: Number(row.total_clients)
  }));
};