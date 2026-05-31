import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { TokenPayload } from "../types/AuthType.js";
// Traemos el token desde el .env
const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-super-secret-key-456";
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

type StrictExpiresIn = Exclude<SignOptions['expiresIn'], undefined>;
// Función para generar un token JWT
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN as StrictExpiresIn });
};

// Generar Refresh Token (Largo - 7 días)
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN as StrictExpiresIn });
};

// Verificar el Refresh Token (Lo usaremos en el controlador de actualización)
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};