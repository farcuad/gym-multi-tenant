-- Clients
CREATE INDEX idx_clients_gym_id_id
ON clients (gym_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_gym_cedula
ON clients (gym_id, cedula);

CREATE INDEX IF NOT EXISTS idx_clients_gym_activo
ON clients (gym_id, activo);

-- Membresias
CREATE INDEX idx_memberships_gym_estado_fecha
ON memberships (gym_id, estado, fecha_membresias);

CREATE INDEX idx_memberships_client_id
ON memberships (client_id);

CREATE INDEX idx_memberships_gym_vencimiento_sort 
ON memberships (gym_id, fecha_membresias ASC);

--Plans
CREATE INDEX IF NOT EXISTS idx_plans_gym_id
ON plans (gym_id);

--Pagos
CREATE INDEX idx_payments_gym_created
ON payments (gym_id, created_at DESC);

--Indices para reportar los datos anuales de clientes nuevos y monto de usd
CREATE INDEX idx_payments_gym_month_func 
ON payments (gym_id, DATE_TRUNC('month', created_at));
CREATE INDEX idx_clients_simple_date ON clients (fecha_ingreso);

-- Indicie para claves foraneas
CREATE INDEX idx_memberships_plan_id ON memberships (plan_id);
CREATE INDEX idx_payments_client_id ON payments (client_id);
CREATE INDEX idx_payments_membership_id ON payments (membership_id);

-- Nuevas tablas para el funcionamiento de roles entre entrenadores,adminis y gerentes + tablas para asignacion de rutinas

-- 1. Crear Enum para los roles
CREATE TYPE user_role AS ENUM ('admin', 'trainer', 'cashier');


-- 3. Crear exercises con los tipos correctos
CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    gym_id INTEGER REFERENCES gyms(id) ON DELETE CASCADE, 
    name TEXT NOT NULL,
    muscle_group TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Definición de Rutinas (Cabecera)
-- gym_id ahora es INTEGER para coincidir con la tabla gyms
CREATE TABLE routines (
    id SERIAL PRIMARY KEY,
    gym_id INTEGER NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    trainer_id INTEGER REFERENCES users(id) ON DELETE SET NULL, 
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Detalle de los ejercicios dentro de una rutina
CREATE TABLE routine_exercises (
    id SERIAL PRIMARY KEY,
    gym_id INTEGER NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE, -- Ejercicios también usa SERIAL
    sets INTEGER NOT NULL,
    reps TEXT NOT NULL,
    rest_time_seconds INTEGER DEFAULT 60,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Asignación de rutinas a los clientes
-- client_id ahora es INTEGER para coincidir con la tabla clients
CREATE TABLE client_routines (
    id SERIAL PRIMARY KEY,
    gym_id INTEGER NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE routine_exercises 
ADD COLUMN day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7)

-- Indices para optimizar las consultas comunes
CREATE INDEX idx_routine_exercises_routine ON routine_exercises(routine_id);
CREATE INDEX idx_client_routines_client ON client_routines(client_id);
