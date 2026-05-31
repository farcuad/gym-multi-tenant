import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/routes.js";
const app = express();


const allowedOrigins = [
    'http://localhost:5173',
    'https://frontend-gym-topaz.vercel.app'
];

// Middleware de CORS con logs integrados
app.use(cors({
    origin: function (origin, callback) {
        console.log(`[CORS CHECK] Origen de la petición entrante: ${origin}`);

        // Si no hay origen (como Postman o curl) o está en la lista blanca
        if (!origin || allowedOrigins.includes(origin)) {
            console.log(`[CORS SUCCESS] Origen permitido: ${origin}`);
            callback(null, true);
        } else {
            console.error(`[CORS FAIL] Origen denegado: ${origin}`);
            callback(new Error('No permitido por políticas de CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-client-key']
}));

// Interceptor global para registrar CUALQUIER petición que toque Express
app.use((req, res, next) => {
    console.log(`[REQUEST] Método: ${req.method} | Ruta: ${req.originalUrl}`);
    console.log(`[HEADERS RECIBA]`, JSON.stringify(req.headers, null, 2));

    // Capturar las cabeceras justo antes de que se envíen al navegador
    const oldSend = res.send;
    res.send = function (data) {
        console.log(`[RESPONSE] Ruta: ${req.originalUrl} | Status: ${res.statusCode}`);
        console.log(`[HEADERS ENVIADOS]`, JSON.stringify(res.getHeaders(), null, 2));
        return oldSend.apply(res, arguments as any);
    };

    next();
});
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }));

app.use("/api", router);

app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        console.log(`[PREFLIGHT INTERCEPTED] Respondiendo 200 OK directo al método OPTIONS de: ${req.headers.origin}`);
        res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5173');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, x-client-key');
        return res.sendStatus(200); // Corta la petición aquí y le da al navegador lo que quiere
    }
    next();
});

export default app;
