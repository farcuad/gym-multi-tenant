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
