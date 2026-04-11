import { Router } from "express";
import { loginAdmin, registerAdmin, resetPassword, forgotPassword,} from "../controllers/AuthController.js";
import { createClient, fetchClientsByGymId, fetchClientById, updateClient, deleteClient, alertClient,} from "../controllers/ClientController.js";
import { createMembership, getMembership, renewMembership, deleteMemberships, verifyMembershipStatus,} from "../controllers/MembershipsController.js";
import { createPlan, fetchPlansByGymId, modifyPlan, removePlan,} from "../controllers/PlansController.js";
import { getDashboardData, updatePlan, getGymHistory,} from "../controllers/AdminSuperiorController.js";
import { getPayments } from "../controllers/PaymentsController.js";
import { analizarGanancias } from "../controllers/AiController.js";
import { authToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { requirePlan } from "../middleware/requirePlan.js";
import { loadSubscription } from "../middleware/loadSubcription.js";
import { getSubscription } from "../controllers/SubsCriptionController.js";
import { getMetricsPayments,getMetricsNewClients, } from "../controllers/MetricasController.js";
import { getRate } from "../controllers/BcvController.js";
import { transcribeAudioController } from "../controllers/TranscriptionWhatsapp.js";
import { validateSTTKey } from "../middleware/authStt.js";
import multer from "multer";
import path from "path";
import fs from "fs";
const router = Router();
const uploadDir = path.join(process.cwd(), "temp_audio");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "temp_audio/");
  },
  filename: (req, file, cb) => {
    // Le damos un nombre único para evitar bloqueos de Windows
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
});

// Ruta para transcripción de audio de WhatsApp
router.post("/stt/transcribe", validateSTTKey, upload.single("audio"), transcribeAudioController);
// Rutas publicas
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
// Ruta para obtener los datos de la membresia mediante qr

// Rutas para recuperación de contraseña
router.post("/admin/forgot-password", forgotPassword);
router.post("/admin/password", resetPassword);
router.get("/bcv-rate", getRate);
// Middleware para proteger las rutas siguientes
router.get("/memberships/:id/verify", verifyMembershipStatus);
router.use(authToken);
// Rutas para el admin superior
router.get("/dashboard", isAdmin, getDashboardData);
router.put("/plans-admin/:id", isAdmin, updatePlan);
router.get("/plans-admin/:id/history", isAdmin, getGymHistory);

router.get("/subscriptions", getSubscription);

router.use(loadSubscription);
// Rutas para los clientes
router.get("/clients/alert", alertClient);
router.post("/clients", createClient);
router.get("/clients", fetchClientsByGymId);
router.get("/clients/:id", fetchClientById);
router.put("/clients/:id", updateClient);
router.delete("/clients/:id", deleteClient);
// Rutas para las membresias
router.post("/memberships", createMembership);
router.get("/memberships", getMembership);
router.post("/memberships/:id/renew", renewMembership);
router.delete("/memberships/:id", deleteMemberships);
// Rutas para los planes
router.post("/plans", createPlan);
router.get("/plans", fetchPlansByGymId);
router.put("/plans/:id", modifyPlan);
router.delete("/plans/:id", removePlan);
// Rutas para los pagos
router.get("/payments", getPayments);
router.get("/metrics/payments", getMetricsPayments);
router.get("/metrics/new-clients", getMetricsNewClients);
// Ruta para geminis
router.post("/analizar", requirePlan("Medium"), analizarGanancias);

//router.post("/rutinas", requirePlan("Premiun") , analizarGanancias);
export default router;
