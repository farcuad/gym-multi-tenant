import type { Request, Response } from "express";
import { registerMembership, getMembershipByGymId,nenewdMembership, deleteMembership, getMembershipById, getPublicMembershipVerification, membershipsExisting } from "../models/Memberships.js";
import { getPlansByGymId } from "../models/Plans.js";
import { registerPayment } from "../models/Payments.js";
import type { CreatePaymentDTO } from "../types/Payments.js";
import { sendMembershipNotification } from "../service/welcomeService.js";
import { getSubscriptions } from "../models/Subscriptions.js";
// función para crear una nueva membresía
export const createMembership = async (req: Request, res: Response) => {
  try {
    // Obtener el gym_id del token de autenticación
    const gym_id_token = req.user.gym_id;
    // Obtenemos los datos de la membresía del cuerpo de la solicitud
    const { client_id, plan_id, fecha_inicio, payment_info } = req.body;

    // Validamos que el cliente no tenga una membresía activa
    const existing = await membershipsExisting(Number(client_id), Number(gym_id_token));
    if (existing) {
      return res.status(400).json({ message: "El cliente ya tiene una membresía activa" });
    }

    const plan = await getPlansByGymId(Number(gym_id_token));
    const planSeleccionado = plan.find((plan) => plan.id === Number(plan_id));
    if (!planSeleccionado) {
      return res.status(404).json({ message: "El plan seleccionado no existe" });
    }
    const [year, month, day] = fecha_inicio.split("-").map(Number);

    const inicio = new Date(year, month - 1, day);

    if (isNaN(inicio.getTime())) throw new Error("Fecha de inicio inválida");

    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + planSeleccionado.duration_day);
    /// Formateamos la fecha de vencimiento a YYYY-MM-DD
    const fechaVencimiento = `${fin.getFullYear()}-${String(fin.getMonth() + 1).padStart(2, "0")}-${String(fin.getDate()).padStart(2, "0")}`;
    const membershipData = {
      gym_id: Number(gym_id_token),
      client_id: Number(client_id),
      plan_id: Number(plan_id),
      fecha_inicio: fecha_inicio,
      fecha_vencimiento: fechaVencimiento,
      estado: "activo" as "activo" | "pendiente" | "suspendido",
      plan_name_purchase: planSeleccionado.name,
      price_purchase: planSeleccionado.price,
    };
    // Registramos la membresía
    const membership = await registerMembership(membershipData);
    const paymentData: CreatePaymentDTO = {
      gym_id: Number(gym_id_token),
      membership_id: membership.id,
      client_id: Number(client_id),
      plan_name: planSeleccionado.name,
      plan_price_usd: Number(planSeleccionado.price),
      chosen_rate_type: payment_info.chosen_rate_type,
      exchange_rate: Number(payment_info.exchange_rate),
      amount_paid_bs: Number(payment_info.amount_paid_bs),
      amount_paid_usd: Number(
        payment_info.amount_paid_bs / Number(payment_info.exchange_rate),
      ),
      payment_method: payment_info.payment_method,
      reference: payment_info.reference,
      status: "Confirmado" as "Confirmado" | "Pendiente",
    };

    const payment = await registerPayment(paymentData);
    // Enviamos notificación de bienvenida por WhatsApp
    const subscription = await getSubscriptions(Number(gym_id_token));

    const hoyCaracas = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Caracas" }),
    );
    hoyCaracas.setHours(0, 0, 0, 0);

    const activeSub = subscription.find((sub) => {
      const expDate = new Date(sub.end_date);
      return sub.status === "active" && expDate >= hoyCaracas;
    });

    if (activeSub?.plan_type === "Premium") {
      sendMembershipNotification({
        client_id: Number(client_id),
        gym_id: Number(gym_id_token),
        plan_name: planSeleccionado.name,
        price: planSeleccionado.price,
        fecha_inicio: fecha_inicio,
        fecha_vencimiento: fechaVencimiento,
        is_renewal: false,
        id_membresia: membership.id,
      });
    }
    res.status(201).json({ message: "Membresía y pago registrados correctamente", membership, payment, });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

// Funcion para obtener la membresía por gym_id
export const getMembership = async (req: Request, res: Response) => {
  try {
    // Obtener el gym_id del token de autenticación
    const gym_id_token = req.user.gym_id;
    // Obtenemos la membresía del gimnasio
    const membership = await getMembershipByGymId(Number(gym_id_token));
    res.status(200).json({ message: "Membresía obtenida correctamente", membership });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

// Funcion para actualizar la membresía
export const renewMembership = async (req: Request, res: Response) => {
  try {
    // Extraemos el id del plan de los parámetros de la ruta
    const id = Number(req.params.id);
    // Extraemos el gym_id del token de autenticación
    const gym_id = Number(req.user.gym_id);
    // Extraemos el plan_id del cuerpo de la solicitud
    const { plan_id, payment_info } = req.body || {};

    // Validamos el plan_id
    if (!payment_info) {
      return res.status(400).json({ error: "El pago es requerido" });
    }
    // Obtenemos la membresía
    const membership = await getMembershipById(id, gym_id);
    // Validamos
    if (!membership) {
      return res.status(404).json({ error: "Membresía no encontrada" });
    }
    // Obtenemos el plan
    const plans = await getPlansByGymId(gym_id);
    // Buscamos el plan
    const plan = plans.find(
      (p) => p.id === Number(plan_id ?? membership.plan_id),
    );
    // Validamos
    if (!plan) {
      return res.status(404).json({ error: "Plan no encontrado" });
    }

    const fechaCaracas = new Date().toLocaleString("en-CA", {timeZone: "America/Caracas", hour12: false, }).split(",")[0]; // Resultado: "2026-04-05"

    if (!fechaCaracas) {
      return res.status(500).json({ error: "Error al obtener la fecha de caracas" });
    }
    // 2. CREAR EL OBJETO "HOY" BASADO EN ESA FECHA
    const [year, month, day] = fechaCaracas.split("-").map(Number);
    if (!year || !month) {
      return res.status(500).json({ error: "Error al parsear la fecha de caracas" });
    }
    const hoy = new Date(year, month - 1, day);

    let fechaString = "";

    const valorFecha = membership.fecha_vencimiento;
    // Validamos el tipo de fecha (puede ser string o Date dependiendo de cómo se haya obtenido de la base de datos) y formateamos a YYYY-MM-DD
    if (valorFecha instanceof Date) {
      const y = valorFecha.getFullYear();
      const m = String(valorFecha.getMonth() + 1).padStart(2, "0");
      const d = String(valorFecha.getDate()).padStart(2, "0");
      fechaString = `${y}-${m}-${d}`;
    } else if (typeof valorFecha === "string") {
      // Si es string, usamos split
      fechaString = valorFecha.split("T")[0] ?? "";
    }

    const partesRaw = fechaString.split("-");

    // 2. Validamos que tengamos los 3 componentes
    if (partesRaw.length !== 3 || fechaString === "") {
      throw new Error(
        `El formato de fecha es irreconocible. Recibido: ${membership.fecha_vencimiento}`,
      );
    }

    const [y, m, d] = partesRaw.map(Number) as [number, number, number];
    const currentEnd = new Date(y, m - 1, d);

    let newEndDate: Date;
    // Comparamos objetos Date (getTime() es opcional pero ayuda a la claridad)
    if (membership.estado === "activo" && currentEnd.getTime() > hoy.getTime()) {
      newEndDate = new Date(currentEnd);
    } else {
      newEndDate = new Date(hoy);
    }

    // Sumamos la duración
    newEndDate.setDate(newEndDate.getDate() + plan.duration_day);

    // Formato final YYYY-MM-DD
    const fecha = `${newEndDate.getFullYear()}-${String(newEndDate.getMonth() + 1).padStart(2, "0")}-${String(newEndDate.getDate()).padStart(2, "0")}`;
    // Registramos pago
    const paymentData: CreatePaymentDTO = {
      gym_id,
      membership_id: membership.id,
      client_id: membership.client_id,
      plan_name: plan.name,
      plan_price_usd: Number(plan.price),
      chosen_rate_type: payment_info.chosen_rate_type,
      exchange_rate: Number(payment_info.exchange_rate),
      amount_paid_bs: Number(payment_info.amount_paid_bs),
      amount_paid_usd: Number(payment_info.amount_paid_bs / Number(payment_info.exchange_rate)),
      payment_method: payment_info.payment_method,
      reference: payment_info.reference,
      status: "Confirmado",
    };
    // Formateamos la fecha a YYYY-MM-DD
    const hoyFormateado = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    const payment = await registerPayment(paymentData);
    // Actualizamos la membresía
    const membershipData = {
      plan_id: plan.id,
      fecha_inicio: hoyFormateado,
      fecha_membresias: fecha,
      estado: "activo" as const,
      plan_name_purchase: plan.name,
      price_purchase: Number(plan.price),
    };
    // Hacemos la consulta
    const updated = await nenewdMembership(id, gym_id, membershipData);

    const subscription = await getSubscriptions(Number(gym_id));
    const hoyCaracas = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Caracas" }),
    );
    hoyCaracas.setHours(0, 0, 0, 0);

    const activeSub = subscription.find((sub) => {
      const expDate = new Date(sub.end_date);
      return sub.status === "active" && expDate >= hoyCaracas;
    });

    if (activeSub?.plan_type === "Premium") {
      sendMembershipNotification({
        client_id: membership.client_id, // Usamos el ID que ya teníamos de la membresía anterior
        gym_id: gym_id,
        plan_name: plan.name,
        price: plan.price,
        fecha_inicio: hoyFormateado,
        fecha_vencimiento: fecha,
        is_renewal: true,
        id_membresia: membership.id,
      });
    }

    res.status(200).json({ message: "Membresía renovada correctamente", membership: updated, payment, });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

// Funcion para eliminar la membresía
export const deleteMemberships = async (req: Request, res: Response) => {
  try {
    // Obtenemos el id del cliente de los parámetros de la ruta
    const id = Number(req.params.id);
    // Obtenemos el gym_id del token de autenticación
    const gym_id = Number(req.user.gym_id);
    // Eliminamos la membresía
    const deleted = await deleteMembership(id, gym_id);
    res.status(200).json({ message: "Membresía eliminada correctamente", deleted });
  } catch (error: any) {
    // Manejamos error de postgresql
    if (error.code === "23503") {
      return res.status(400).json({ message: "No se puede eliminar la membresía porque tiene pagos asociados", });
    }
    // Si algo falla, mostramos error por defecto
    return res.status(500).json({ message: "Ocurrio un error al eliminar la membresia" });
  }
};

export const verifyMembershipStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const membership = await getPublicMembershipVerification(Number(id));

    if (!membership) {
      return res.status(404).json({ valid: false, message: "La membresía no existe en nuestro sistema.", });
    }

    // Obtener fecha actual en Caracas para comparar
    const ahoraCaracas = new Date().toLocaleString("en-CA", { timeZone: "America/Caracas", hour12: false, }).split(",")[0];
    if (!ahoraCaracas) {
      return res.status(500).json({ error: "Error al obtener la fecha actual" });
    }

    const fechaVencimiento = membership.fecha_vencimiento instanceof Date
        ? membership.fecha_vencimiento.toISOString().split("T")[0]
        : membership.fecha_vencimiento.split("T")[0];

    // Lógica de validación
    const isExpired = fechaVencimiento < ahoraCaracas;
    const isActive = membership.estado === "activo";
    const canAcces = !isExpired && isActive;

    res.status(200).json({
      valid: canAcces,
      data: {
        socio: membership.client_name,
        cedula: membership.client_cedula,
        gimnasio: membership.name_gym,
        plan: membership.plan_name,
        vencimiento: fechaVencimiento,
        estado_db: membership.estado,
        mensaje: isExpired ? "Membresía Vencida" : isActive ? "Acceso Permitido": "Membresía Inactiva",},
    });
  } catch (error) {
    console.error("Error en verificación pública:", error);
    res.status(500).json({ error: "Error interno al verificar el código" });
  }
};
