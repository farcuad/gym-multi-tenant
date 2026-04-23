import type { Request, Response} from 'express';
import { createbotsConfig, getbotsConfigById, updatebotsConfigById, deletebotsConfigById } from '../models/BotConfig.js';

// funcion para crear la configuracion del bot
export const createbotsConfigController = async (req: Request, res: Response) => {
    try {
        const gym_id = req.user.gym_id;
        const data = req.body;
        const result = await createbotsConfig(data, gym_id);
        return res.status(201).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al crear la configuracion del bot' });
    }
}

// funcion para obtener la configuracion del bot por id
export const getbotsConfigByIdController = async (req: Request, res: Response) => {
    try {
        const gym_id = req.user.gym_id;
        const result = await getbotsConfigById(gym_id);
        if (!result) {
            return res.status(404).json({ message: 'Configuracion del bot no encontrada' });
        }
        return res.status(200).json({ message: "Bots obtenidos correctamente", bots: result});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al obtener la configuracion del bot' });
    }
}

// funcion para actualizar la configuracion del bot por id
export const updatebotsConfigByIdController = async (req: Request, res: Response) => {
    try {
        const gym_id = req.user.gym_id;
        const id = String(req.params.id);
        const data = req.body;
        const result = await updatebotsConfigById(id, data, gym_id);
        if (!result) {
            return res.status(404).json({ message: 'Configuracion del bot no encontrada' });
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al actualizar la configuracion del bot' });
    }
}

// funcion para eliminar la configuracion del bot por id
export const deletebotsConfigByIdController = async (req: Request, res: Response) => {
    try {
        const gym_id = req.user.gym_id;
        const id = String(req.params.id);
        const result = await deletebotsConfigById(id, gym_id);
        if (!result) {
            return res.status(404).json({ message: 'Configuracion del bot no encontrada' });
        }
        return res.status(200).json({ message: 'Configuracion del bot eliminada correctamente' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al eliminar la configuracion del bot' });
    }
}