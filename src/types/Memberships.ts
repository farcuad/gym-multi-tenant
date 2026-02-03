export interface MembershipBody {
    id: number;
    gym_id: number;
    client_id: number;
    plan_id: number;
    fecha_inicio: string;
    fecha_membresias: string;
    estado: 'activo' | 'pendiente' | 'suspendido';
}

export type CreateMembershipDTO = Omit<MembershipBody, 'id'>;

export type UpdateMembershipDTO = Partial<CreateMembershipDTO>;