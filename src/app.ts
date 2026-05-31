import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/routes.js";
const app = express();


app.use(cors({
    origin: ['http://localhost:5173', 'https://frontend-gym-topaz.vercel.app'],
    credentials: true
}));
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }));

app.use("/api", router);

export default app;
