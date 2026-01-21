// Tipado para Registro de admin
export interface UserBase {
    id: number;
    name: string;
    email: string;
    password: string;
    role: string;
    gym_id: number;
    system_plan?: string
}

// Tipado para el body de registro (sin id y con gym_id)
export interface UserWidthPassowrd extends UserBase {
    password: string;
}


export interface AuthBody extends Omit<UserBase, "id"> {
    password: string;
    gym_name: string;
}

export type UserRole = 'super_admin' | 'gym_owner';
export type SystemPlan = 'Basic' | 'Medium' | 'Premium';
export interface TokenPayload {
    id: number;
    gym_id: number;
    role: UserRole;
    system_plan: SystemPlan
}
