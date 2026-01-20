// Tipado para clientes
export interface ClientBody {
    id: number;
    name: string;
    cedula: number;
    phone: number;
    fecha_ingreso: string;
    activo: boolean;
    gym_id: number;
}

export type CreateClientDTO = Omit<ClientBody, 'id'>;

export type UpdateClientDTO = Partial<CreateClientDTO>;