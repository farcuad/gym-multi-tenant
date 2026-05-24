export interface Gastos {
    id: number;
    gym_id: number;
    titulo: string;
    descripcion?: string;
    monto: number;
    categoria: CategoriaGasto;
    fecha_gasto: Date;
    creado_en: Date;
}

export type CategoriaGasto =
    | 'maquinaria'
    | 'mantenimiento'
    | 'servicios'
    | 'insumos'
    | 'nomina'
    | 'marketing'
    | 'otros'
    | 'alquiler';

export interface ResumenGastos {
    categoria: CategoriaGasto;
    total: number;
}

export interface BalanceFinancieroMes {
    total_ingresos: number;
    total_gastos: number;
    balance_neto: number;
}

