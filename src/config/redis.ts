// import { createClient } from "redis";

// Redis deshabilitado temporalmente - consultas directas a la base de datos
// Para reactivar, descomentar el código de abajo y las importaciones de cache en los controladores.

// const redisClient = createClient({
//     url: process.env.REDIS_URL || "redis://localhost:6379"
// });

// redisClient.on("error", (err: any) => {
//     console.error("[REDIS ERROR]: No se pudo conectar a la memoria RAM", err);
// });

// redisClient.on("connect", () => {
//     console.log("[REDIS]: Conectado exitosamente a la memoria RAM");
// });

// await redisClient.connect();

// export default redisClient;

// console.log("[REDIS]: Deshabilitado. Se usarán consultas directas a la base de datos.");
// export default null;