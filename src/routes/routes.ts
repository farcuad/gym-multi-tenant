import { Router } from "express";
import { loginAdmin, registerAdmin, resetPassword, forgotPassword } from "../controllers/AuthController.js";
import { createClient, fetchClientsByGymId, fetchClientById, updateClient, deleteClient, alertClient } from "../controllers/ClientController.js";
import { createMembership, getMembership, renewMembership, deleteMemberships} from "../controllers/MembershipsController.js";
import { createPlan, fetchPlansByGymId, modifyPlan, removePlan } from "../controllers/PlansController.js";
import { getDashboardData, updatePlan } from "../controllers/AdminSuperiorController.js";
import { analizarGanancias } from "../controllers/AiController.js";
import { authToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { checkSubcription } from "../middleware/checkSubcriptions.js";
import { requirePlan } from "../middleware/requirePlan.js";
const router = Router();
// Rutas publicas
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
// Rutas para recuperación de contraseña
router.post("/admin/forgot-password", forgotPassword);
router.post("/admin/password", resetPassword);

// Middleware para proteger las rutas siguientes
router.use(authToken); 
// Rutas para el admin superior
router.get("/dashboard", isAdmin, getDashboardData);
router.put("/plans-admin/:id", isAdmin , updatePlan);

// Middleware para proteger las rutas siguientes
router.use(checkSubcription);
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
// Ruta para geminis
router.post("/analizar", requirePlan("Medium") , analizarGanancias);

//router.post("/rutinas", requirePlan("Premiun") , analizarGanancias);
export default router;