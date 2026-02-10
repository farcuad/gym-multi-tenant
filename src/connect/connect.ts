import { Pool } from 'pg';
import dotenv from 'dotenv';
// Cargamos variables de entorno desde el archivo .env
dotenv.config();

export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
});

//Hacmos una funcion para hacer consultas a la base de datos
export const query = (text: string, params?: any[]) => {
    return pool.query(text, params);
}
