import { Router } from "express";
import { loginAdmin, registerAdmin, resetPassword, forgotPassword, } from "../controllers/AuthController.js";
import { createClient, fetchClientsByGymId, fetchClientById, updateClient, deleteClient, alertClient, } from "../controllers/ClientController.js";
import { createMembership, getMembership, renewMembership, deleteMemberships, } from "../controllers/MembershipsController.js";
import { createPlan, fetchPlansByGymId, modifyPlan, removePlan, } from "../controllers/PlansController.js";
import { getDashboardData, updatePlan, getGymHistory, } from "../controllers/AdminSuperiorController.js";
import { getPayments } from "../controllers/PaymentsController.js";
import { analizarGanancias } from "../controllers/AiController.js";
import { authToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { requirePlan } from "../middleware/requirePlan.js";
import { loadSubscription } from "../middleware/loadSubcription.js";
import { getSubscriptions } from "../controllers/SubsCriptionController.js";
import { getMetricsPayments,getMetricsNewClients, } from "../controllers/MetricasController.js";
import { getRate } from "../controllers/BcvController.js";
const router = Router();
// Rutas publicas
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
// Rutas para recuperación de contraseña
router.post("/admin/forgot-password", forgotPassword);
router.post("/admin/password", resetPassword);
router.get("/bcv-rate", getRate);
// Middleware para proteger las rutas siguientes
router.use(authToken, loadSubscription);
// Rutas para el admin superior
router.get("/dashboard", isAdmin, getDashboardData);
router.put("/plans-admin/:id", isAdmin, updatePlan);
router.get("/plans-admin/:id/history", isAdmin, getGymHistory);

router.get("/subscriptions", getSubscriptions);
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
