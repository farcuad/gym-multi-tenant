import app from "./src/app.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;

// En Vercel (producción), no usamos app.listen(), exportamos la app
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
        console.log("🚀 Proceso API iniciado localmente");
    });
}

// Exportar la aplicación para que Vercel pueda manejarla como Serverless Function
export default app;
