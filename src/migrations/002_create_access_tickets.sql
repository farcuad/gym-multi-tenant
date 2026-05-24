-- Migration: 002_create_access_tickets
-- Tabla para registrar los ingresos por QR dinámico

CREATE TABLE IF NOT EXISTS access_tickets (
    id            SERIAL PRIMARY KEY,
    gym_id        INTEGER NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL,                  -- client.id (usuario que generó el ticket)
    membership_id INTEGER NOT NULL,                  -- membership.id al momento de la generación
    jti           UUID NOT NULL UNIQUE,              -- JWT ID único por token generado
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),-- Primer ingreso del día (o re-entrada)
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,     -- FALSE = QR ya fue consumido/validado
    is_reentry    BOOLEAN NOT NULL DEFAULT FALSE,    -- TRUE = re-entrada dentro de las 4h
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para acelerar las consultas más frecuentes
CREATE INDEX IF NOT EXISTS idx_access_tickets_jti         ON access_tickets (jti);
CREATE INDEX IF NOT EXISTS idx_access_tickets_user_date   ON access_tickets (user_id, check_in_time);
CREATE INDEX IF NOT EXISTS idx_access_tickets_gym         ON access_tickets (gym_id, check_in_time);

-- Columna para almacenar la URL o base64 de la imagen/foto del cliente
ALTER TABLE clients ADD COLUMN IF NOT EXISTS image TEXT;

CREATE TYPE categoria_gasto AS ENUM (
    'maquinaria', 
    'mantenimiento', 
    'servicios', 
    'insumos', 
    'nomina', 
    'marketing', 
    'otros'
);

ALTER TYPE categoria_gasto ADD VALUE 'alquiler';

CREATE TABLE gastos (
    id SERIAL PRIMARY KEY,
    gym_id INTEGER NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL, -- Ej: "Compra de 2 mancuernas de 30kg" o "Pago de luz"
    descripcion TEXT, -- Detalles adicionales
    monto NUMERIC(10, 2) NOT NULL, -- El costo del gasto
    categoria categoria_gasto NOT NULL, -- Para poder filtrar en las gráficas
    fecha_gasto DATE NOT NULL DEFAULT CURRENT_DATE, -- Cuándo se ejecutó el gasto real
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);