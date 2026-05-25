import { query } from "../connect/connect.js";
import type { BalanceFinancieroMes, ResumenGastos } from "../types/GastosTypes.js";

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

export const getBalanceFinancieroMes = async (gymId: number, startDate: string, endDate: string): Promise<BalanceFinancieroMes> => {

  const sql = `
    SELECT 
      (
        SELECT COALESCE(ROUND(SUM(amount_paid_bs / exchange_rate)::NUMERIC, 2), 0)::FLOAT
        FROM payments
        WHERE gym_id = $1 
          AND status = 'Confirmado' 
          AND created_at >= $2::DATE 
          AND created_at < $3::DATE + INTERVAL '1 day'
      ) AS total_ingresos,
      
      (
        SELECT COALESCE(ROUND(SUM(monto)::NUMERIC, 2), 0)::FLOAT
        FROM gastos 
        WHERE gym_id = $1 
          AND fecha_gasto >= $2::DATE 
          AND fecha_gasto <= $3::DATE
      ) AS total_gastos,

      (
        SELECT COALESCE(COUNT(id)::INT, 0)::INT 
        FROM clients 
        WHERE gym_id = $1 
          AND fecha_ingreso >= $2::DATE 
          AND fecha_ingreso <= $3::DATE
      ) AS new_clients;
  `;

  const result = await query(sql, [gymId, startDate, endDate])
  const total_ingresos = result.rows[0]?.total_ingresos || 0;
  const total_gastos = result.rows[0]?.total_gastos || 0;
  const new_clients = result.rows[0]?.new_clients || 0;
  const balance_neto = total_ingresos - total_gastos;

  return {
    total_ingresos,
    total_gastos,
    balance_neto,
    new_clients
  }
};

export const getGastosPorCategoria = async (gymId: number, startDate: string, endDate: string): Promise<ResumenGastos[]> => {
  const sql = `SELECT 
      categoria, 
      ROUND(SUM(monto)::NUMERIC, 2)::FLOAT AS total
    FROM gastos
    WHERE gym_id = $1 
      AND fecha_gasto >= $2::DATE 
      AND fecha_gasto <= $3::DATE
    GROUP BY categoria
    ORDER BY total DESC;`;

  const result = await query(sql, [gymId, startDate, endDate]);
  return result.rows as ResumenGastos[]
}