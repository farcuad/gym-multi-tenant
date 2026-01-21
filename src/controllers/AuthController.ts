import type { Request, Response } from "express";
import bycrypt from "bcrypt";
import { GetUserByEmail, RegisterAdmin } from "../models/Auth.js";
import { savePassword, getPassword, updatePassword } from "../models/Admin.js";
import { generateToken } from "../utils/jwt.js";
import { transporter } from "../utils/mailer.js";
export const registerAdmin = async (req: Request, res: Response) => {
  try {
    // Extraer datos del cuerpo de la solicitud
    const { email, password } = req.body;
    const existingUser = await GetUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "El correo ya está registrado" });
    }
    // Hashear la contraseña
    const hashedPassword = await bycrypt.hash(password, 10);
    const userData = {
      ...req.body,
      role: "gym_owner",
      password: hashedPassword,
    };
    // Registrar el admin
    const newUser = await RegisterAdmin(userData);
    // Enviamos respuesta exitosa
    const { password: _, ...user } = newUser;
    const welcomeTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #d32f2f; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">¡Bienvenido a FitLog!</h1>
            </div>
            <div style="padding: 30px; color: #333; line-height: 1.6;">
                <h2>Hola, ${req.body.name}</h2>
                <p>Gracias por elegir <strong>FitLog</strong> para la gestión de tu gimnasio. Estamos emocionados de ayudarte a llevar tu negocio al siguiente nivel.</p>
                <p>Desde ahora puedes:</p>
                <ul>
                    <li>Registrar a tus clientes.</li>
                    <li>Gestionar planes y membresías.</li>
                    <li>Recibir alertas automáticas de vencimientos.</li>
                </ul>
            </div>
            <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
                © 2026 FitLog System.
            </div>
        </div>
        `;
    await transporter.sendMail({
      from: "FitLog",
      to: email,
      subject: "Bienvenido a FitLog",
      html: welcomeTemplate,
    });
    res.status(201).json({ message: "Admin registrado correctamente", user: user });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    // Extraer datos del cuerpo de la solicitud
    const { email, password } = req.body;
    // Buscar el usuario por email
    const existingUser = await GetUserByEmail(email);
    if (!existingUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    // Verificar contraseña
    const isPasswordValid = await bycrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }
    // Enviamos respuesta exitosa
    const { password: _, ...user } = existingUser;
    // Generar token JWT
    const token = generateToken({
      id: existingUser.id,
      gym_id: existingUser.gym_id,
      role: existingUser.role,
    });
    res
      .status(200)
      .json({ message: "Inicio de sesion exitoso", token: token, user });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
};

// Funcion para enviar código de recuperación
export const forgotPassword = async (req: Request, res: Response) => {
  // Obtenemos el correo del cuerpo de la solicitud
  const { email } = req.body;
  const existingUser = await GetUserByEmail(email);
  // Confirmamos que el usuario exista
  if (!existingUser) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  // Generamos un token aleatorio
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  // Se lo pasamos a la base de datos
  await savePassword(email, token);
  // Enviamos el correo
  const emailTemplate = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #1a1a1a; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">FitLog</h1>
    </div>
    <div style="padding: 30px; color: #333; line-height: 1.6;">
        <h2 style="color: #1a1a1a;">Recuperación de contraseña</h2>
        <p>Hola!</p>
        <p>Has solicitado restablecer tu contraseña para acceder al sistema de gestión de gimnasios. Utiliza el siguiente código de verificación:</p>
        
        <div style="background-color: #f4f4f4; border-radius: 4px; padding: 20px; text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #d32f2f;">${token}</span>
        </div>
        
        <p style="font-size: 14px; color: #666;">Este código expirará pronto. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
    </div>
    <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0;">
        © 2026 FitLog. Todos los derechos reservados.
    </div>
</div>
`;
  try {
    await transporter.sendMail({
      from: "Gym App" + process.env.EMAIL,
      to: email,
      subject: "Recuperación de contraseña",
      html: emailTemplate,
    });
    res.json({ message: "Correo enviado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al enviar el correo" });
  }
};

// Funcion para restablecer contraseña
export const resetPassword = async (req: Request, res: Response) => {
  // Obtenemos los datos del cuerpo de la soclicitud
  const { email, token, newPassword } = req.body;
  // Confirmamos que el usuario exista
  const recovery = await getPassword(email, token);
  // Si no existe, devolvemos un error
  if (!recovery) {
    return res.status(404).json({ error: "Código Incorrecto" });
  }
  // Buscamos al usuario
  const user = await GetUserByEmail(email);
  // Si no existe, enviamos error
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  // Hasheamos la nueva contraseña
  const hashedPassword = await bycrypt.hash(newPassword, 10);
  // Actualizamos la contraseña
  await updatePassword((user as any).id, hashedPassword);
  res.json({ message: "Contraseña actualizada correctamente" });
};
