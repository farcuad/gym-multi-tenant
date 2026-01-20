export interface PlanBody {
    gym_id: number;
    id: number;
    name: string;
    duration_day: number;
    price: number;
}

export type CreatePlanDTO = Omit<PlanBody, 'id'>;

export type UpdatePlanDTO = Partial<CreatePlanDTO>; 