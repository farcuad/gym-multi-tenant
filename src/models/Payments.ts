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
      payment_method, reference, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
  
  const values = [
    validatedData.gym_id, validatedData.membership_id, validatedData.client_id,
    validatedData.plan_price_usd, validatedData.chosen_rate_type, validatedData.exchange_rate,
    validatedData.amount_paid_bs, validatedData.payment_method, validatedData.reference,
    validatedData.status
  ];

  // Si usas transacciones, pasarías el cliente aquí
  const result = await query(sql, values);
  return result.rows[0];
};

export const getPayment = async (gym_id: number): Promise<PaymentHistoryDTO[]> => {
  const sql = `
    SELECT 
      p.id,
      p.amount_paid_bs,
      p.exchange_rate,
      p.payment_method,
      p.reference,
      p.created_at,
      p.status,
      c.name AS client_name, 
      c.phone AS client_phone,      
      pl.name AS plan_name,          
      p.plan_price_usd                 
    FROM payments p
    INNER JOIN clients c ON p.client_id = c.id
    INNER JOIN memberships m ON p.membership_id = m.id
    INNER JOIN plans pl ON m.plan_id = pl.id
    WHERE p.gym_id = $1
    ORDER BY p.created_at DESC;
  `;
  
  const result = await query(sql, [gym_id]);
  return result.rows;
};

export const getPaymentForId = async (gym_id: number, id: number) => {
    const sql = `SELECT * FROM payments WHERE gym_id = $1 AND id = $2`;
    const result = await query(sql, [gym_id, id]);
    return result.rows[0];

}