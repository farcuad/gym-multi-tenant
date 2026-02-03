import type { Request, Response } from 'express';
import { registerMembership, getMembershipByGymId, nenewdMembership, deleteMembership, getMembershipById } from '../models/Memberships.js';
import { getPlansByGymId } from '../models/Plans.js';
// función para crear una nueva membresía
export const createMembership = async (req: Request, res: Response) => {
    try {
        // Obtener el gym_id del token de autenticación
        const gym_id_token = req.user.gym_id;
        // Obtenemos los datos de la membresía del cuerpo de la solicitud
        const { client_id, plan_id, fecha_inicio } = req.body;
        const plan = await getPlansByGymId( Number(gym_id_token) );
        const planSeleccionado = plan.find(plan => plan.id === Number(plan_id));
        if (!planSeleccionado) {
           return res.status(404).json({ error: "El plan seleccionado no existe" });
        }
        const inicio = new Date(fecha_inicio);
        if (isNaN(inicio.getTime())) throw new Error("Fecha de inicio inválida")
        const fin = new Date(inicio);
        fin.setDate(inicio.getDate() + planSeleccionado.duration_day);
        const fechaVencimiento = fin.toISOString().split('T')[0]!;
        const membershipData = {
            gym_id: Number(gym_id_token),
            client_id: Number(client_id),
            plan_id: Number(plan_id),
            fecha_inicio: fecha_inicio,
            fecha_membresias: fechaVencimiento,
            estado: "activo" as "activo" | "pendiente" | "suspendido",
        };
        // Registramos la membresía
        const membership = await registerMembership(membershipData);
        res.status(201).json({ message: "Membresía registrada correctamente", membership });
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
    const { plan_id } = req.body || {};

    // Obtenemos la membresía
    const membership = await getMembershipById(id, gym_id);
    // Validamos
    if (!membership) {
      return res.status(404).json({ error: "Membresía no encontrada" });
    }
    // Obtenemos el plan
    const plans = await getPlansByGymId(gym_id);
    // Buscamos el plan
    const plan = plans.find(p => p.id === Number(plan_id ?? membership.plan_id));
    // Validamos
    if (!plan) {
      return res.status(404).json({ error: "Plan no encontrado" });
    }
    // Creamos un nuevo end_date
    const today = new Date();
    const currentEnd = new Date(membership.fecha_membresias);

    let newEndDate: Date;
    // Validamos si la membresía esta activa
    if (membership.estado === "activo" && currentEnd > today) {
      newEndDate = new Date(currentEnd);
    } else {
      newEndDate = new Date(today);
    }
    // Actualizamos la fecha de vencimiento
    newEndDate.setDate(newEndDate.getDate() + plan.duration_day);
    const membershipData = {
        plan_id: plan.id,
        fecha_membersias: newEndDate.toISOString().split("T")[0],
        estado: "activo" as "activo" | "pendiente" | "suspendido",
    }
    // Hacemos la consulta
    const updated = await nenewdMembership(id, gym_id, membershipData);

    res.status(200).json({
      message: "Membresía renovada correctamente",
      membership: updated,
    });

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
        const gym_id_token = req.user.gym_id;
        // Eliminamos la membresía
        const deleted = await deleteMembership(id, Number(gym_id_token));
        res.status(200).json({ message: "Membresía eliminada correctamente", deleted });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};