// Tipado para Registro de admin
export interface UserBase {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  gym_id: number;
  plan_type: string;
}

// Tipado para el body de registro (sin id y con gym_id)
export interface UserWidthPassowrd extends UserBase {
  password: string;
}

export interface AuthBody extends Omit<UserBase, "id"> {
  password: string;
  gym_name: string;
}

export type UserRole = "super_admin" | "admin" | "trainer" | "cashier" | "client";
export interface TokenPayload {
  id: number;
  gym_id: number;
  role: UserRole;
  plan_type: string;
  name_gym: string;
}

export interface UserUpdate {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}
