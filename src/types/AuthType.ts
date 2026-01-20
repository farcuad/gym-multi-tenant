// Tipado para Registro de admin
export interface AuthRegister {
    id: number;
    name: string;
    email: string;
    password: string;
    role: string;
}

// Tipado para el body de registro (sin id y con gym_id)
export interface AuthBody extends Omit<AuthRegister, "id"> { gym_id: number;}

export interface TokenPlayLoad {
    id: number;
    gym_id: number;
    role: string;
}
