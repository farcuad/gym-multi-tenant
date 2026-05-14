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
