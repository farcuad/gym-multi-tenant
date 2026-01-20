export interface GymSummary {
    id: number;
    name_gym: string;
    system_plan: 'Basic' | 'Medium' | 'Premium';
    owner_name: string | null;
    owner_email: string | null;
    expiration?: Date;
}

export interface PlanUpgradeData {
    id: number;
    gymId: number;
    planType: 'Basic' | 'Medium' | 'Premium';
    monts: number;
    price: number;
}