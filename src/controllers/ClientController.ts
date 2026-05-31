import type { Request, Response } from "express";
import { registerClient, getClientsByGymId, getClientById, updateClientById, deleteClientById, alertClientExpired, getClientByCedula } from "../models/Clients.js";
import { z } from "zod";
import {
    getClientsListCache,
    setClientsListCache,
    invalidateClientCache,
    getSingleClientCache,
    setSingleClientCache
} from "../service/clientCache.service.js";
// funcion para crear un nuevo cliente
export const createClient = async (req: Request, res: Response) => {
    try {
        const gym_id_token = req.user.gym_id;
        const { cedula } = req.body;

        // Validamos si el cliente ya existe por cedula en este gimnasio
        const existingClient = await getClientByCedula(cedula, Number(gym_id_token));
        if (existingClient) {
            return res.status(400).json({ message: "Ya existe un cliente registrado con esta cédula" });
        }

        const clientData = { ...req.body, gym_id: gym_id_token };
        const client = await registerClient(clientData);
        // Limpiamos la caché del gimnasio para forzar la recarga en la próxima petición
        await invalidateClientCache(Number(gym_id_token));

        res.status(201).json({ message: "Cliente registrado correctamente", client });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

// funcion para obtener todos los clientes de un gimnasio
export const fetchClientsByGymId = async (req: Request, res: Response) => {
    try {
        // Obtenemos el gym_id de los parametros de la ruta
        const gym_id = req.user.gym_id;
        // Obtenemos los clientes del gimnasio
        const cacheClients = await getClientsListCache(Number(gym_id));
        if (cacheClients) {
            return res.status(200).json({ message: "Clientes obtenidos correctamente de la caché", clients: cacheClients });
        }
        // Obtenemos los clientes del gimnasio
        const clients = await getClientsByGymId(Number(gym_id));
        // Guardamos los clientes en caché
        await setClientsListCache(Number(gym_id), clients);

        res.status(200).json({ message: "Clientes obtenidos correctamente", clients });
    } catch (error) {
        // Utilizamos zod para una mejor respuesta de error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Datos de entrada inválidos", details: error.issues });
        }
        res.status(500).json({ error: "Error interno del servidor" })
    }
};

export const fetchClientById = async (req: Request, res: Response) => {
    try {
        // Obtenemos el id del cliente de los parametros de la ruta
        const id = Number(req.params.id);
        // Obtenemos el gym_id del usuario autenticado
        const gym_id = req.user.gym_id;
        const cacheClient = await getSingleClientCache(Number(gym_id), id);
        if (cacheClient) {
            return res.status(200).json({ message: "Cliente obtenido correctamente", client: cacheClient });
        }
        // Obtenemos el cliente por id
        const client = await getClientById(id, Number(gym_id));
        // Verificamos si el cliente existe
        if (!client) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }
        res.status(200).json({ message: "Cliente obtenido correctamente", client });
    } catch (error) {
        // Utilizamos zod para una mejor respuesta de error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Datos de entrada inválidos", details: error.issues });
        }
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// funcion para actualizar un cliente
export const updateClient = async (req: Request, res: Response) => {
    try {
        // Obtenemos el id del cliente de los parametros de la ruta
        const id = Number(req.params.id);
        const data = req.body;
        // Obtenemos el gym_id del usuario autenticado
        const gym_id = req.user.gym_id;
        const updatedClient = await updateClientById(id, Number(gym_id), data);
        // Verificamos si el cliente existe
        if (!updatedClient) {
            return res.status(404).json({ error: "Cliente no encontrado o datos no proporcionados" });
        }
        // Invalida la caché del cliente
        await invalidateClientCache(Number(gym_id), id);
        res.status(200).json({ message: "Cliente actualizado correctamente", client: updatedClient });
    } catch (error) {
        // Utilizamos zod para una mejor respuesta de error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Datos de entrada inválidos", details: error.issues });
        }
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// funcion para eliminar un cliente
export const deleteClient = async (req: Request, res: Response) => {
    try {
        // obtenemos el id del cliente de los parametros de la ruta
        const id = Number(req.params.id);
        // obtenemos el gym_id del usuario autenticado
        const gym_id = req.user.gym_id;
        // verificamos token
        if (!gym_id) return res.status(400).json({ error: "Sesión no iniciada" });
        const deleted = await deleteClientById(id, gym_id);
        // Verificamos si el cliente existe
        if (!deleted) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }
        await invalidateClientCache(Number(gym_id), id);
        res.status(200).json({ message: "Cliente eliminado correctamente" });
    } catch (error: any) {
        if (error.code === '23503') {
            return res.status(400).json({
                message: "No se puede eliminar el cliente porque tiene membresías asociadas"
            });
        }
        // Utilizamos zod para una mejor respuesta de error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Datos de entrada inválidos", details: error.issues });
        }
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// funcion para alerta de membresias de clientes
export const alertClient = async (req: Request, res: Response) => {
    try {
        // obtenemos el gym_id del usuario autenticado
        const gym_id = req.user.gym_id;
        // obtenemos los clientes vencidos
        const clients = await alertClientExpired(Number(gym_id));
        // validamos que existan membresias, si no existen mostramos un mensaje
        if (clients.length === 0) {
            return res.status(200).json({ message: "No hay clientes vencidos" });
        }
        // Enviamos respuesta
        res.status(200).json({
            message: `Se encontraron ${clients.length} clientes vencidos`,
            count: clients.length,
            clients
        });
    } catch (error) {
        // Utilizamos zod para una mejor respuesta de error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Datos de entrada inválidos", details: error.issues });
        }
        res.status(500).json({ error: "Error interno del servidor" });
    }
}

