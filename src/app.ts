import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/routes.js";

const app = express();

// Orígenes permitidos (Agregué el dominio definitivo de tu servidor por si acaso)
const allowedOrigins = [
    "http://localhost:5173",
    "https://frontend-gym-topaz.vercel.app",
    "https://u2.rsgve.com"
];

// Configuración de CORS limpia y segura
app.use(
    cors({
        origin: function (origin, callback) {
            // Permitir peticiones sin origen (como Postman, curl, o Server-to-Server)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("No permitido por políticas de CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept", "x-client-key"]
    })
);



// Middlewares de parseo esenciales
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

// Enrutador principal
app.use("/api", router);

export default app;