import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
// Traemos el token desde el .env
const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret-key";
// Función para generar un token JWT
export const generateToken = (
  payload: object,
  expiresIn: SignOptions["expiresIn"] = "7d",
): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};
