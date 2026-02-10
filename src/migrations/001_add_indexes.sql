-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_gym_id
ON clients (gym_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_gym_cedula
ON clients (gym_id, cedula);

CREATE INDEX IF NOT EXISTS idx_clients_gym_activo
ON clients (gym_id, activo);

-- Membresias
CREATE INDEX IF NOT EXISTS idx_memberships_gym_id
ON memberships (gym_id);


CREATE INDEX IF NOT EXISTS idx_memberships_gym_fecha
ON memberships (gym_id, fecha_membresias);

CREATE INDEX IF NOT EXISTS idx_memberships_client_id
ON memberships (client_id);

CREATE INDEX IF NOT EXISTS idx_memberships_plan_id
ON memberships (plan_id);

CREATE INDEX IF NOT EXISTS idx_memberships_estado_fecha
ON memberships (estado, fecha_membresias);

-- Para acelerar los JOINs en alertClientExpired y getMembershipByGymId
CREATE INDEX IF NOT EXISTS idx_memberships_composite_lookup 
ON memberships (gym_id, client_id, plan_id);

-- Para la ordenación cronológica que usas en casi todos los GET
CREATE INDEX IF NOT EXISTS idx_memberships_vencimiento_sort 
ON memberships (gym_id, fecha_membresias ASC);
-- Planes
CREATE INDEX IF NOT EXISTS idx_plans_gym_id
ON plans (gym_id);

CREATE INDEX IF NOT EXISTS idx_plans_gym_id_id
ON plans (gym_id, id);
