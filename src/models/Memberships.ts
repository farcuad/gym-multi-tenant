import { query } from "../connect/connect.js";
import { z } from "zod";
import type { MembershipBody, CreateMembershipDTO, UpdateMembershipDTO } from "../types/Memberships.js";
// Usamos zod para validar los datos de la membresia
export const MemberSchema = z.object({
  gym_id: z.number(),
  client_id: z.number(),
  plan_id: z.number(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_membresias: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  estado: z.enum(["activo", "pendiente", "suspendido"]).default("activo"),
});

//Funcion para registrar una nueva membresía
export const registerMembership = async ( data: CreateMembershipDTO): Promise<MembershipBody> => {
  const validatedData = MemberSchema.parse(data);
  const sql =
    "INSERT INTO memberships (gym_id, client_id, plan_id, fecha_inicio, fecha_membresias, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *";
  const values = [
    validatedData.gym_id,
    validatedData.client_id,
    validatedData.plan_id,
    validatedData.fecha_inicio,
    validatedData.fecha_membresias,
    validatedData.estado,
  ];
  const result = await query(sql, values);
  return result.rows[0];
};

// Funcion para obtener la membresía por gym_id
export const getMembershipByGymId = async (gym_id: number): Promise<MembershipBody[]> => {
  const sql = ` SELECT  m.id, m.plan_id, c.name as client_name, c.phone as client_phone, p.name as plan_name,  p.price as plan_price,m.fecha_inicio,
      m.fecha_membresias as fecha_vencimiento,  m.estado FROM memberships m JOIN clients c ON m.client_id = c.id  JOIN plans p ON m.plan_id = p.id 
       WHERE m.gym_id = $1  ORDER BY m.fecha_membresias ASC`;
    const result = await query(sql, [gym_id]);
    return result.rows;
};

// Funcion para obtener la membresía por id
export const getMembershipById = async (id: number, gym_id: number): Promise<MembershipBody | null> => {
    const sql = `SELECT * FROM memberships WHERE id = $1 AND gym_id = $2`;
    const result = await query(sql, [id, gym_id]);
    return result.rows[0] || null;
}
// Funcion para actualizar la membresía
export const nenewdMembership = async (id: number, gym_id: number, data: UpdateMembershipDTO): Promise<MembershipBody | null> => { 
    // Validamos los datos a actualizar usando zod de forma parcial
    const validateData = MemberSchema.partial().parse(data);
    // Construimos la consulta dinámica para actualizar solo los campos proporcionados
    const fields = Object.keys(validateData);
    const values = Object.values(validateData);
    // Si no hay campos para actualizar, retornamos null
    if (fields.length === 0) return null;
    // Mapeamos los campos para la consulta SQL
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
    // Hacemos la consulta SQL
    const sql = `UPDATE memberships SET ${setClause} WHERE id = $${fields.length + 1} AND gym_id = $${fields.length + 2} RETURNING *`;
    const result = await query(sql, [...values, id, gym_id]);
    return result.rows[0] || null;
};

// Funcion para eliminar la membresía
export const deleteMembership = async (id: number, gym_id: number): Promise<boolean> => {
    const sql = `DELETE FROM memberships WHERE id = $1 AND gym_id = $2`;
    const result = await query(sql, [id, gym_id]);
    return (result.rowCount ?? 0) > 0;
}
