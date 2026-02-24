import { z } from 'zod';
import { query } from '../connect/connect.js';
import type { CreatePaymentDTO, PaymentHistoryDTO } from '../types/Payments.js';
export const PaymentSchema = z.object({
  gym_id: z.number(),
  membership_id: z.number(),
  client_id: z.number(),
  plan_price_usd: z.number(),
  chosen_rate_type: z.string(),
  exchange_rate: z.number(),
  amount_paid_bs: z.number(),
  amount_paid_usd: z.number(),
  plan_name: z.string(),
  payment_method: z.string(),
  reference: z.string().optional(),
  status: z.string().default("completed")
});

export const registerPayment = async (data: CreatePaymentDTO) => {
  const validatedData = PaymentSchema.parse(data);
  const sql = `
    INSERT INTO payments (
      gym_id, membership_id, client_id, plan_price_usd, 
      chosen_rate_type, exchange_rate, amount_paid_bs, 
      payment_method, reference, status, amount_paid_usd, plan_name
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
  
  const values = [
    validatedData.gym_id, validatedData.membership_id, validatedData.client_id,
    validatedData.plan_price_usd, validatedData.chosen_rate_type, validatedData.exchange_rate,
    validatedData.amount_paid_bs, validatedData.payment_method, validatedData.reference,
    validatedData.status, validatedData.amount_paid_usd, validatedData.plan_name
  ];

  // Si usas transacciones, pasarías el cliente aquí
  const result = await query(sql, values);
  return result.rows[0];
};

export const getPayment = async (gym_id: number, startDate?: string, endDate?: string): Promise<PaymentHistoryDTO[]> => {
  let sql = `
    SELECT 
    p.id,
    p.amount_paid_bs,
    p.plan_price_usd,
    p.amount_paid_usd,
    p.exchange_rate,
    p.payment_method,
    p.reference,
    p.created_at,
    p.status,
    p.plan_name,
    c.name AS client_name, 
    c.phone AS client_phone
FROM payments p
INNER JOIN clients c ON p.client_id = c.id
WHERE p.gym_id = $1
  `;
  const params: any[] = [gym_id];

  if (startDate && endDate) {
    sql += ` AND p.created_at::date BETWEEN $2 AND $3`;
    params.push(startDate, endDate);
  }

  sql += ` ORDER BY p.created_at DESC`;
  const result = await query(sql, params);
  return result.rows;
};

export const getPaymentForId = async (gym_id: number, id: number) => {
    const sql = `SELECT * FROM payments WHERE gym_id = $1 AND id = $2`;
    const result = await query(sql, [gym_id, id]);
    return result.rows[0];

}