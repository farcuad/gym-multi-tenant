import type { Request, Response } from 'express';
import { getBcvRate, getCopTrm } from '../service/bcvService.js';

export const getRates = async (req: Request, res: Response) => {
  try {
    // Ejecutamos ambas peticiones en paralelo
    const [bcvData, copTrm] = await Promise.all([
      getBcvRate(),
      getCopTrm()
    ]);

    if (!bcvData) {
      return res.status(500).json({
        success: false,
        error: 'No se pudieron obtener las tasas del BCV'
      });
    }

    return res.json({
      success: true,
      message: 'Tasas obtenidas correctamente',
      data: {
        usd: bcvData.usd,
        eur: bcvData.eur,
        cop_trm: copTrm, // Retorna el número o null si la API de Colombia falla
        updatedAt: bcvData.updatedAt
      }
    });
  } catch (error) {
    console.error('Error en el controlador de tasas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};
