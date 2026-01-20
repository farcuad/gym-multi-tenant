import type { Request, Response } from 'express';
import { registerMembership, getMembershipByGymId, updatedMembership, deleteMembership, getMembershipById } from '../models/Memberships.js';
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
            estado: "activo" as "activo" | "vencido" | "suspendido",
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
export const updateMembership = async (req: Request, res: Response) => {
    try {
        // Obtener el id del cliente de los parámetros de la ruta
        const id = Number(req.params.id);
        // Obtenemos el gym_id del token de autenticación
        const gym_id_token = req.user.gym_id;
        // Obtenemos los datos a actualizar del cuerpo de la solicitud
        const data = req.body;
        // Actualizamos la membresía
        const updated = await updatedMembership(id, Number(gym_id_token), data);
        // Verificamos si se actualizó correctamente, si no lanzamos un error 404
        if(!updated) {
            return res.status(404).json({ error: "Membresía no encontrada o sin datos para actualizar" });
        }
        res.status(200).json({ message: "Membresía actualizada correctamente", membership: updated });
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