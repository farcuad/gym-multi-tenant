import { createClient } from "redis";

// Creamos el cliente apuntando a tu variable de entorno o al localhost por defecto
const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

// Escuchadores de eventos para monitorear el estado en la consola
redisClient.on("error", (err) => {
    console.error("❌ [REDIS ERROR]: No se pudo conectar a la memoria RAM", err);
});

redisClient.on("connect", () => {
    console.log("⚡ [REDIS]: Conectado exitosamente a la memoria RAM");
});

// Iniciamos la conexión de forma asíncrona inmediatamente
// (Top-level await es totalmente válido en las versiones modernas de Node/TS con ESM)
await redisClient.connect();

export default redisClient;