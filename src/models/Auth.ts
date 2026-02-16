import { query } from "../connect/connect.js";
import { z } from "zod";
import type { UserBase } from "../types/AuthType.js";
//Utilizamos Zod para validar los datos de entrada
export const RegisterUser = z.object({
  gym_name: z.string().min(3).max(100),
  name: z.string().min(3).max(100),
  email: z.string().email().min(5).max(100),
  password: z.string().min(6).max(100),
  role: z.string().min(3).max(50),
});
//Utilizamos Zod para validar los datos de entrada
export const LoginUser = z.object({
  email: z.string().email().min(5).max(100),
  password: z.string().min(6).max(100),
});
export const RegisterAdmin = async (data: UserBase): Promise<UserBase> => {
  // Validamos datos de entrada
  const validatedData = RegisterUser.parse(data);
  const slug = validatedData.gym_name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "");
  // Crear gimnasio
  const gymSql =
    "INSERT INTO gyms (name_gym, slug) VALUES ($1, $2) RETURNING id";
  // Hacemos la consulta para crear el gym
  const gymResult = await query(gymSql, [validatedData.gym_name, slug]);
  // Lo transformamos a id
  const gymId = gymResult.rows[0].id;
  const sql =
    "INSERT INTO users (gym_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *";
  const values = [
    gymId,
    validatedData.name,
    validatedData.email,
    validatedData.password,
    validatedData.role,
  ];
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  const sqlSubscription = `INSERT INTO gym_subscriptions
       (gym_id, plan_type, status, price_paid, start_date, end_date)
       VALUES ($1, 'trial', 'trialing', 0, $2, $3) RETURNING *`;
  const subscriptionValues = [gymId, startDate, endDate];
  await query(sqlSubscription, subscriptionValues);
  // Se crea el admin con el gym creado
  const result = await query(sql, values);
  return result.rows[0];
};

// Funcion para obtener el usuario por gmail
export const GetUserByEmail = async (
  email: string,
): Promise<UserBase | null> => {
  const sql = `SELECT * FROM users WHERE email = $1`;
  const result = await query(sql, [email]);
  if (result.rows.length === 0) return null;
  return result.rows[0] as UserBase;
};
