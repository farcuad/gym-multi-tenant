import { query } from "../connect/connect.js";
import { z } from "zod";
import type { MembershipBody, CreateMembershipDTO, UpdateMembershipDTO, } from "../types/Memberships.js";
// Usamos zod para validar los datos de la membresia
export const MemberSchema = z.object({
  gym_id: z.number(),
  client_id: z.number(),
  plan_id: z.number(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_membresias: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  estado: z.enum(["activo", "pendiente", "suspendido"]).default("activo"),
  plan_name_purchase: z.string(),
  price_purchase: z.coerce.number(),
});
//Funcion para registrar una nueva membresía
export const registerMembership = async ( data: CreateMembershipDTO, ): Promise<MembershipBody> => {
  const validatedData = MemberSchema.parse(data);
  const sql =
    "INSERT INTO memberships (gym_id, client_id, plan_id, fecha_inicio, fecha_membresias, estado, plan_name_purchase, price_purchase) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *";
  const values = [
    validatedData.gym_id,
    validatedData.client_id,
    validatedData.plan_id,
    validatedData.fecha_inicio,
    validatedData.fecha_membresias || (validatedData as any).fecha_vencimiento,
    validatedData.estado,
    validatedData.plan_name_purchase,
    validatedData.price_purchase,
  ];
  const result = await query(sql, values);
  return result.rows[0];
};

// Funcion para obtener la membresía por gym_id
export const getMembershipByGymId = async ( gym_id: number, ): Promise<MembershipBody[]> => {
  const sql = `SELECT  
      m.id, 
      m.client_id, 
      m.plan_id, 
      c.name as client_name, 
      c.phone as client_phone, 
      m.plan_name_purchase as plan_name,  
      m.price_purchase as plan_price,
      m.fecha_inicio,
      m.fecha_membresias as fecha_vencimiento, 
      CASE 
        WHEN (m.fecha_membresias AT TIME ZONE 'UTC' AT TIME ZONE 'America/Caracas')::date <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Caracas')::date
        THEN 'vencido' 
        ELSE 'activo'
      END AS estado 
    FROM memberships m 
    JOIN clients c ON m.client_id = c.id  
    JOIN plans p ON m.plan_id = p.id 
    WHERE m.gym_id = $1  
    ORDER BY m.fecha_membresias ASC`;
  const result = await query(sql, [gym_id]);
  return result.rows;
};

// Funcion para obtener la membresía por id
export const getMembershipById = async ( id: number,gym_id: number, ): Promise<MembershipBody | null> => {
  const sql = `SELECT m.id, m.gym_id, m.client_id, m.plan_id, c.name as client_name, c.phone as client_phone, m.plan_name_purchase as plan_name,  m.price_purchase as plan_price,m.fecha_inicio,
      m.fecha_membresias as fecha_vencimiento, CASE WHEN m.fecha_membresias <= CURRENT_DATE THEN 'vencido' ELSE 'activo'
      END AS estado FROM memberships m JOIN clients c ON m.client_id = c.id  JOIN plans p ON m.plan_id = p.id WHERE m.id = $1 AND m.gym_id = $2`;
  const result = await query(sql, [id, gym_id]);
  return result.rows[0] || null;
};
// Funcion para actualizar la membresía
export const nenewdMembership = async ( id: number, gym_id: number, data: UpdateMembershipDTO, ): Promise<MembershipBody | null> => {
  const UpdateSchema = MemberSchema.partial();
  const validatedData = UpdateSchema.parse(data);

  // 3. Convertimos a objeto plano para construir la consulta SQL
  const updatePayload: Record<string, any> = { ...validatedData };

  if (data.fecha_inicio) updatePayload.fecha_inicio = data.fecha_inicio;

  // Manejo de la fecha (si viene como fecha_vencimiento la pasamos a la columna real)
  if (updatePayload.fecha_vencimiento && !updatePayload.fecha_membresias) {
    updatePayload.fecha_membresias = updatePayload.fecha_vencimiento;
    delete updatePayload.fecha_vencimiento;
  }

  const fields = Object.keys(updatePayload);
  const values = Object.values(updatePayload);

  if (fields.length === 0) return null;

  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
  // 4. Usamos el ID y GYM_ID que ya tenemos en los argumentos de la función
  const sql = `UPDATE memberships SET ${setClause} WHERE id = $${fields.length + 1} AND gym_id = $${fields.length + 2} RETURNING *`;

  const result = await query(sql, [...values, id, gym_id]);
  return result.rows[0] || null;
};

// Funcion para eliminar la membresía
export const deleteMembership = async ( id: number, gym_id: number, ): Promise<boolean> => {
  const sql = `DELETE FROM memberships WHERE id = $1 AND gym_id = $2`;
  const result = await query(sql, [id, gym_id]);
  return (result.rowCount ?? 0) > 0;
};

export const getPublicMembershipVerification = async (membershipId: number) => {
  const sql = `
        SELECT 
            m.id,
            m.estado,
            m.fecha_membresias as fecha_vencimiento,
            c.name AS client_name,
            c.cedula AS client_cedula,
            g.name_gym,
            p.name AS plan_name
        FROM memberships m
        JOIN clients c ON m.client_id = c.id
        JOIN gyms g ON m.gym_id = g.id
        JOIN plans p ON m.plan_id = p.id
        WHERE m.id = $1
    `;
  const result = await query(sql, [membershipId]);
  return result.rows[0] || null;
};
