import { Router } from "express";
import { loginAdmin, registerAdmin, resetPassword, forgotPassword, loginClient, registerUsers, getByUsersRole, updateUsersRole, deleteUsersRole } from "../controllers/AuthController.js";
import { createClient, fetchClientsByGymId, fetchClientById, updateClient, deleteClient, alertClient, } from "../controllers/ClientController.js";
import { createMembership, getMembership, renewMembership, deleteMemberships, verifyMembershipStatus, } from "../controllers/MembershipsController.js";
import { generateAccessTicket, verifyQrTicket } from "../controllers/AccessController.js";
import { createPlan, fetchPlansByGymId, modifyPlan, removePlan, } from "../controllers/PlansController.js";
import { getDashboardData, updatePlan, getGymHistory, } from "../controllers/AdminSuperiorController.js";
import { getPayments } from "../controllers/PaymentsController.js";
import { analizarGanancias } from "../controllers/AiController.js";
import { authToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { isTrainerOrAdmin } from "../middleware/isTrainerOrAdmin.js";
import { isClient } from "../middleware/isClient.js";
import { requirePlan } from "../middleware/requirePlan.js";
import { loadSubscription } from "../middleware/loadSubcription.js";
import { getSubscription } from "../controllers/SubsCriptionController.js";
import { getMetricsPayments, getMetricsNewClients, getFinanzasMetrics } from "../controllers/MetricasController.js";
import { getRate } from "../controllers/BcvController.js";
import { createbotsConfigController, getbotsConfigByIdController, updatebotsConfigByIdController, deletebotsConfigByIdController } from "../controllers/BotConfigController.js";
import { createExercise, fetchExercises, fetchExerciseById, updateExercise, deleteExercise } from "../controllers/ExerciseController.js";
import {
  createRoutine, fetchRoutines, fetchRoutineById,
  updateRoutine, deleteRoutine, addExercise, removeExercise, assignRoutine, fetchActiveClientRoutine,
  deactivateRoutine, fetchClientRoutines
} from "../controllers/RoutineController.js";
import { createConfigAppController, getCongigApp, updatedConfigAppController, deleteConfigController } from "../controllers/AppConfigController.js";
import { configApp } from "../middleware/configApp.js";
import { createGastosGyms, getGastosByGymIdGyms, updateGastosByGymGyms, deleteGastosGymGyms } from "../controllers/GastosController.js";
const router = Router();

// Rutas publicas
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/client/login", loginClient);
// Ruta para obtener los datos de la membresia mediante qr

// Rutas para recuperación de contraseña
router.post("/admin/forgot-password", forgotPassword);
router.post("/admin/password", resetPassword);
router.get("/bcv-rate", getRate);
// Middleware para proteger las rutas siguientes
// Verificación pública de membresía por QR estático (carnet)
router.get("/memberships/:id/verify", verifyMembershipStatus);

// Rutas para la configuracion de la app
router.post("/app-config", configApp, createConfigAppController);
router.get("/app-config", configApp, getCongigApp);
router.put("/app-config/:id", configApp, updatedConfigAppController);
router.delete("/app-config/:id", configApp, deleteConfigController);

router.use(authToken);
// Rutas para el admin superior
router.get("/dashboard", isAdmin, getDashboardData);
router.put("/plans-admin/:id", isAdmin, updatePlan);
router.get("/plans-admin/:id/history", isAdmin, getGymHistory);

router.get("/subscriptions", getSubscription);
router.post("/users", registerUsers);
router.get("/users", getByUsersRole);
router.put("/users/:id", updateUsersRole);
router.delete("/users/:id", deleteUsersRole);

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
// QR dinámico: validación por parte del admin (escaneo de QR del cliente)
router.post("/memberships/:id/verify-qr", verifyQrTicket);

// QR dinámico: generación del ticket por parte del cliente
router.get("/access/generate-ticket", isClient, generateAccessTicket);
// Rutas para los planes
router.post("/plans", createPlan);
router.get("/plans", fetchPlansByGymId);
router.put("/plans/:id", modifyPlan);
router.delete("/plans/:id", removePlan);

router.post("/gastos", createGastosGyms);
router.get("/gastos", getGastosByGymIdGyms);
router.put("/gastos/:id", updateGastosByGymGyms);
router.delete("/gastos/:id", deleteGastosGymGyms);
// Rutas para los pagos
router.get("/payments", getPayments);
router.get("/metrics/payments", getMetricsPayments);
router.get("/metrics/new-clients", getMetricsNewClients);
router.get("/metrics/finanzas", getFinanzasMetrics);
// Rutas para la configuracion del bot
router.post("/bot-config", createbotsConfigController);
router.get("/bot-config", getbotsConfigByIdController);
router.put("/bot-config/:id", updatebotsConfigByIdController);
router.delete("/bot-config/:id", deletebotsConfigByIdController);

router.use(requirePlan("Medium"));

// Rutas para ejercicios (La Biblioteca)
router.post("/exercises", isTrainerOrAdmin, createExercise);
router.get("/exercises", fetchExercises);
router.get("/exercises/:id", fetchExerciseById);
router.put("/exercises/:id", isTrainerOrAdmin, updateExercise);
router.delete("/exercises/:id", isTrainerOrAdmin, deleteExercise);

// Rutas para rutinas (Cabecera y Detalle)
router.post("/routines", isTrainerOrAdmin, createRoutine);
router.get("/routines", fetchRoutines);
router.get("/routines/:id", fetchRoutineById);
router.put("/routines/:id", isTrainerOrAdmin, updateRoutine);
router.delete("/routines/:id", isTrainerOrAdmin, deleteRoutine);

// Rutas para los ejercicios dentro de una rutina
router.post("/routines/:routineId/exercises", isTrainerOrAdmin, addExercise);
router.delete("/routines/exercises/:id", isTrainerOrAdmin, removeExercise);

// Rutas para asignación de rutinas a clientes
router.post("/client-routines", isTrainerOrAdmin, assignRoutine);
router.get("/client-routines/:clientId", fetchClientRoutines);
router.get("/client-routines/active/:clientId", isClient, fetchActiveClientRoutine);
router.put("/client-routines/:id/deactivate", isTrainerOrAdmin, deactivateRoutine);
// Ruta para geminis
router.post("/analizar", analizarGanancias);



//router.post("/rutinas", requirePlan("Premiun") , analizarGanancias);
export default router;
