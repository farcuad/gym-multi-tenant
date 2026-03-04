import type { Request, Response } from 'express';
import { getBcvRate } from '../service/bcvService.js';

export const getRate = async (req: Request, res: Response) => {
  const rate = await getBcvRate();
  
  if (rate) {
    return res.json({ message: "Tasa obtenida correctamente", rate: rate });
  }
  
  res.status(500).json({ error: "No se pudo obtener la tasa actual" });
};
