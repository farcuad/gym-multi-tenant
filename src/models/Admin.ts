import { query } from "../connect/connect.js";

// funcion para guardar el token
export const saveRecovery = async (email: string, token: string) => {
    const sql = `INSERT INTO recovery (email, token) VALUES ($1, $2)`;
    await query(sql, [email, token]);
    return;
}

// funcion para obtener el token
export const getRecovery = async (email: string, token: string) => {
    const sql = `SELECT * FROM recovery WHERE email = $1 AND token = $2 ORDER BY created_at DESC LIMIT 1`;
    const results = await query(sql, [email, token]);
    return results.rows[0];
}

// funcion para actualizar la contraseña
export const updatePassword = async (id: number, password: string) => {
    const sql = `UPDATE users SET password = $1 WHERE id = $2 RETURNING *`;
    const result = await query(sql, [password, id]);
    return result.rows[0];
}


