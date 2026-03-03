export interface MembershipBody {
    id: number;
    gym_id: number;
    client_id: number;
    plan_id: number;
    fecha_inicio: string | Date;
    fecha_vencimiento: string | Date;
    estado: 'activo' | 'pendiente' | 'suspendido';
}

export type CreateMembershipDTO = Omit<MembershipBody, 'id'>;

export type UpdateMembershipDTO = Partial<CreateMembershipDTO>;