import { query } from "../connect/connect.js";
import { z } from "zod";
import type { ClientBody} from "../types/ClientType.js";
// Utilizamos Zod para validar los datos
export const createClient = z.object({
    name: z.string().min(3).max(100),
    cedula: z.string(),
    phone: z.string(),
    fecha_ingreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "El formato debe ser YYYY-MM-DD"
    }).optional(),
    activo: z.boolean().optional(),
    gym_id: z.number(),
})

export const updateClientSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  cedula: z.string().optional(),
  phone: z.string().optional(),
  activo: z.boolean().optional(),
});

// Funcion para registrar un nuevo cliente
export const registerClient = async (data: unknown): Promise<ClientBody> => {
    const validatedData = createClient.parse(data);
    const fechaIngreso =
    validatedData.fecha_ingreso ?? new Date().toISOString().slice(0, 10);

  const activo = validatedData.activo ?? true;
    const sql = "INSERT INTO clients (name, cedula, phone, fecha_ingreso, activo, gym_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *";
    const values = [
        validatedData.name,
        validatedData.cedula,
        validatedData.phone,
        fechaIngreso,
        activo,
        validatedData.gym_id,
    ];
    const result = await query(sql, values);
    return result.rows[0];
}

// Funcion para obtener todos los clientes de un gimnasio
export const getClientsByGymId = async (gym_id: number): Promise<ClientBody[]> => {
    const sql = "SELECT * FROM clients WHERE gym_id = $1";
    const result = await query(sql, [gym_id]);
    return result.rows;
}

// Funcion para obtener un cliente por id
 export const getClientById = async (id: number, gym_id: number): Promise<ClientBody | null> => {
     const sql = "SELECT * FROM clients WHERE id = $1 AND gym_id = $2";
     const result = await query(sql, [id, gym_id]);
     if(result.rows.length === 0) return null;
     return result.rows[0];
 }
 
 // Funcion para actualizar un cliente por id
export const updateClientById = async (id: number, gym_id: number, data: unknown): Promise<ClientBody | null> => {
    // Validamos los datos de entrada
    const validateData = updateClientSchema.partial().parse(data);
    // Construimos la consulta dinamicamente
    const fields = Object.keys(validateData);
    const values = Object.values(validateData);
    // Verificamos que haya campos para actualizar
    if(fields.length === 0) return null;
    // Mapeamos los campos y los valores
    const setString = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    // Hacemos la query para actualizar
    const sql = `UPDATE clients SET ${setString} WHERE id = $${fields.length + 1} AND gym_id = $${fields.length + 2} RETURNING *`;
    // Ejecutamos la query
    const result = await query(sql, [...values, id, gym_id]);
    if(result.rows.length === 0) return null;
    return result.rows[0] || null;
}

// Funcion para eliminar un cliente por id  
export const deleteClientById = async (id: number, gym_id: number): Promise<boolean> => {
    const sql = "DELETE FROM clients WHERE id = $1 AND gym_id = $2";
    const result = await query(sql, [id, gym_id]);
    return (result.rowCount ?? 0) > 0;
}

// funcion para alerta de cliente vencido
export const alertClientExpired = async (gymId: number): Promise<ClientBody[]> => {
    const sql = ` 
    SELECT 
            c.name, 
            c.phone, 
            c.cedula, 
            m.fecha_membresias AS fecha_vencimiento,
            p.name AS plan_name
        FROM clients c
        INNER JOIN memberships m ON c.id = m.client_id 
        INNER JOIN plans p ON m.plan_id = p.id
        WHERE c.gym_id = $1 
        AND c.activo = true 
        AND m.estado = 'activo'
        AND m.fecha_membresias <= CURRENT_DATE
        ORDER BY m.fecha_membresias ASC
    `;
    const result = await query(sql, [gymId]);
    return result.rows;
}