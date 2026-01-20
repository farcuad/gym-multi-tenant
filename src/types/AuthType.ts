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
