export interface GymSummary {
    id: number;
    name_gym: string;
    system_plan: 'Basic' | 'Medium' | 'Premium' | 'trial';
    owner_name: string | null;
    owner_email: string | null;
    expiration?: Date;
    timezone?: string;
    phone_prefix?: string;
    health_status: 'active' | 'warning' | 'expired';
}

export interface PlanUpgradeData {
    gymId: number;
    planType: 'Basic' | 'Medium' | 'Premium';
    monts: number;
    price: number;
}