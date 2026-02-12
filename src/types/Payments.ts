// Tipado principal que refleja la tabla de la DB
export interface Payment {
    id: number;
    gym_id: number;
    membership_id: number;
    client_id: number;
    plan_price_usd: number;
    chosen_rate_type: string;
    exchange_rate: number;
    amount_paid_bs: number;
    payment_method: string;
    reference?: string | null;
    status: 'Confirmado' | 'Pendiente';
    created_at: string;
}

export type CreatePaymentDTO = Omit<Payment, 'id' | 'created_at'>;

export interface PaymentInfoRequest {
    chosen_rate_type: string;
    exchange_rate: number;
    amount_paid_bs: number;
    payment_method: string;
    reference?: string;
}

// types.ts
export interface PaymentHistoryDTO {
    id: number;
    amount_paid_bs: string;
    exchange_rate: string;
    payment_method: string;
    reference: string;
    created_at: string;
    status: string;
    client_name: string;
    plan_name: string;
    plan_price_usd: string;
}