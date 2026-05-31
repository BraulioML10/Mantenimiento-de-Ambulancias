-- Esquema limpio propuesto para Mantenimiento de Ambulancias SAMU/SSVQ.
-- No ejecuta DROP TABLE. Sirve para crear una base ordenada sin borrar datos existentes.
-- Si se quiere reiniciar la base completamente, primero se debe respaldar y confirmar.

create extension if not exists pgcrypto;

-- =========================================================
-- 1. Usuarios del sistema
-- Login propio de la app. No usa Supabase Auth por ahora.
-- =========================================================

create table if not exists public.system_users (
  id uuid primary key default gen_random_uuid(),
  user_code text not null unique,
  name text not null,
  username text not null unique,
  email text,
  role text not null,
  status text not null default 'Activo',
  temporary_password text not null,
  last_access timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_users_role_check
    check (role in ('Administrador', 'Coordinador', 'Chofer')),
  constraint system_users_status_check
    check (status in ('Activo', 'Inactivo'))
);

-- =========================================================
-- 2. Ambulancias
-- Fuente central para flota, kilometraje y estado operativo.
-- =========================================================

create table if not exists public.ambulances (
  code text primary key,
  patente text not null unique,
  base text not null,
  modelo text not null,
  status text not null default 'operativa',
  kilometraje_actual integer not null default 0,
  kilometraje_ultima_mantencion integer not null default 0,
  uso_desde_ultima_mantencion integer not null default 0,
  pauta_preventiva_km integer not null default 10000,
  last_update text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ambulances_status_check
    check (status in (
      'operativa',
      'mantencion_preventiva',
      'mantencion_correctiva',
      'fuera_servicio'
    )),
  constraint ambulances_km_check
    check (
      kilometraje_actual >= 0
      and kilometraje_ultima_mantencion >= 0
      and uso_desde_ultima_mantencion >= 0
      and pauta_preventiva_km > 0
    )
);

-- =========================================================
-- 3. Formularios sin GPS
-- Hoja de ruta / pre-turno / documentos / daños / recepcion.
-- Lo llena principalmente el Chofer.
-- =========================================================

create table if not exists public.shift_route_forms (
  id uuid primary key default gen_random_uuid(),
  ambulance_code text not null references public.ambulances(code) on update cascade,
  ambulance_patente text not null,
  ambulance_base text not null,
  ambulance_modelo text not null,
  registered_by_user_id uuid references public.system_users(id) on update cascade,
  registered_by_name text not null,
  registered_by_role text not null,
  shift_type text not null,
  form_date date not null,
  start_time time,
  end_time time,
  start_km integer not null,
  end_km integer not null,
  total_km integer generated always as (end_km - start_km) stored,
  destination_reason text not null,
  fuel_liters numeric(10, 2),
  fuel_value numeric(12, 0),
  fuel_km integer,
  delivery_observations text,
  reception_observations text,
  inspection_items jsonb not null default '[]'::jsonb,
  document_checks jsonb not null default '[]'::jsonb,
  damage_reports jsonb not null default '[]'::jsonb,
  status text not null default 'Enviado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shift_route_forms_registered_role_check
    check (registered_by_role in ('Administrador', 'Coordinador', 'Chofer')),
  constraint shift_route_forms_km_check
    check (start_km >= 0 and end_km >= start_km),
  constraint shift_route_forms_status_check
    check (status in ('Borrador', 'Enviado', 'Revisado', 'Anulado'))
);

-- =========================================================
-- 4. Talleres
-- Catalogo editable de talleres externos o internos.
-- =========================================================

create table if not exists public.maintenance_workshops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_phone text,
  address text,
  status text not null default 'activo',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_workshops_status_check
    check (status in ('activo', 'pausado', 'inactivo'))
);

-- =========================================================
-- 5. Mantenimientos
-- Registro conectado a ambulancia, usuario que agenda y taller.
-- Preventivo: por pauta/km.
-- Correctivo: por falla, colision, daño o incidencia.
-- =========================================================

create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  ambulance_code text not null references public.ambulances(code) on update cascade,
  ambulance_patente text not null,
  requested_by_user_id uuid references public.system_users(id) on update cascade,
  requested_by_name text,
  requested_by_role text,
  maintenance_type text not null,
  reason text not null,
  source text not null default 'manual',
  source_form_id uuid references public.shift_route_forms(id) on delete set null,
  workshop_id uuid references public.maintenance_workshops(id) on delete set null,
  scheduled_date date,
  scheduled_time time,
  started_at timestamptz,
  finished_at timestamptz,
  estimated_days integer not null default 0,
  estimated_cost numeric(12, 0) not null default 0,
  final_cost numeric(12, 0),
  km_at_start integer,
  km_at_finish integer,
  status text not null default 'programada',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_records_type_check
    check (maintenance_type in ('preventiva', 'correctiva')),
  constraint maintenance_records_source_check
    check (source in ('manual', 'kilometraje', 'formulario', 'incidencia')),
  constraint maintenance_records_status_check
    check (status in (
      'programada',
      'en_taller',
      'esperando_repuesto',
      'finalizada',
      'cancelada'
    )),
  constraint maintenance_records_cost_check
    check (
      estimated_days >= 0
      and estimated_cost >= 0
      and (final_cost is null or final_cost >= 0)
    ),
  constraint maintenance_records_km_check
    check (
      (km_at_start is null or km_at_start >= 0)
      and (km_at_finish is null or km_at_finish >= 0)
      and (km_at_start is null or km_at_finish is null or km_at_finish >= km_at_start)
    )
);

-- =========================================================
-- 6. GPS futuro
-- Separado del formulario sin GPS.
-- =========================================================

create table if not exists public.ambulance_locations (
  id uuid primary key default gen_random_uuid(),
  ambulance_code text not null references public.ambulances(code) on update cascade,
  ambulance_patente text,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  speed_kmh numeric(8, 2),
  heading numeric(6, 2),
  source text not null default 'gps',
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 7. Indices
-- =========================================================

create index if not exists ambulances_status_idx
  on public.ambulances(status);

create index if not exists shift_route_forms_ambulance_code_idx
  on public.shift_route_forms(ambulance_code);

create index if not exists shift_route_forms_registered_by_user_id_idx
  on public.shift_route_forms(registered_by_user_id);

create index if not exists shift_route_forms_form_date_idx
  on public.shift_route_forms(form_date);

create index if not exists maintenance_records_ambulance_code_idx
  on public.maintenance_records(ambulance_code);

create index if not exists maintenance_records_requested_by_user_id_idx
  on public.maintenance_records(requested_by_user_id);

create index if not exists maintenance_records_workshop_id_idx
  on public.maintenance_records(workshop_id);

create index if not exists maintenance_records_status_idx
  on public.maintenance_records(status);

create index if not exists maintenance_records_scheduled_date_idx
  on public.maintenance_records(scheduled_date);

create index if not exists ambulance_locations_ambulance_code_idx
  on public.ambulance_locations(ambulance_code);

create index if not exists ambulance_locations_recorded_at_idx
  on public.ambulance_locations(recorded_at desc);

-- =========================================================
-- 8. RLS temporal para app con login propio
-- Como la app no usa Supabase Auth, Supabase recibe operaciones como anon.
-- Esto permite operar desde el frontend actual.
-- Cuando se migre a Supabase Auth, estas politicas deben endurecerse.
-- =========================================================

alter table public.system_users enable row level security;
alter table public.ambulances enable row level security;
alter table public.shift_route_forms enable row level security;
alter table public.maintenance_workshops enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.ambulance_locations enable row level security;

drop policy if exists "app_select_system_users" on public.system_users;
drop policy if exists "app_insert_system_users" on public.system_users;
drop policy if exists "app_update_system_users" on public.system_users;
drop policy if exists "app_delete_system_users" on public.system_users;

drop policy if exists "app_select_ambulances" on public.ambulances;
drop policy if exists "app_insert_ambulances" on public.ambulances;
drop policy if exists "app_update_ambulances" on public.ambulances;
drop policy if exists "app_delete_ambulances" on public.ambulances;

drop policy if exists "app_select_shift_route_forms" on public.shift_route_forms;
drop policy if exists "app_insert_shift_route_forms" on public.shift_route_forms;
drop policy if exists "app_update_shift_route_forms" on public.shift_route_forms;

drop policy if exists "app_select_maintenance_workshops" on public.maintenance_workshops;
drop policy if exists "app_insert_maintenance_workshops" on public.maintenance_workshops;
drop policy if exists "app_update_maintenance_workshops" on public.maintenance_workshops;

drop policy if exists "app_select_maintenance_records" on public.maintenance_records;
drop policy if exists "app_insert_maintenance_records" on public.maintenance_records;
drop policy if exists "app_update_maintenance_records" on public.maintenance_records;

drop policy if exists "app_select_ambulance_locations" on public.ambulance_locations;
drop policy if exists "app_insert_ambulance_locations" on public.ambulance_locations;
drop policy if exists "app_update_ambulance_locations" on public.ambulance_locations;

create policy "app_select_system_users"
  on public.system_users for select to anon using (true);
create policy "app_insert_system_users"
  on public.system_users for insert to anon with check (true);
create policy "app_update_system_users"
  on public.system_users for update to anon using (true) with check (true);
create policy "app_delete_system_users"
  on public.system_users for delete to anon using (true);

create policy "app_select_ambulances"
  on public.ambulances for select to anon using (true);
create policy "app_insert_ambulances"
  on public.ambulances for insert to anon with check (true);
create policy "app_update_ambulances"
  on public.ambulances for update to anon using (true) with check (true);
create policy "app_delete_ambulances"
  on public.ambulances for delete to anon using (true);

create policy "app_select_shift_route_forms"
  on public.shift_route_forms for select to anon using (true);
create policy "app_insert_shift_route_forms"
  on public.shift_route_forms for insert to anon with check (true);
create policy "app_update_shift_route_forms"
  on public.shift_route_forms for update to anon using (true) with check (true);

create policy "app_select_maintenance_workshops"
  on public.maintenance_workshops for select to anon using (true);
create policy "app_insert_maintenance_workshops"
  on public.maintenance_workshops for insert to anon with check (true);
create policy "app_update_maintenance_workshops"
  on public.maintenance_workshops for update to anon using (true) with check (true);

create policy "app_select_maintenance_records"
  on public.maintenance_records for select to anon using (true);
create policy "app_insert_maintenance_records"
  on public.maintenance_records for insert to anon with check (true);
create policy "app_update_maintenance_records"
  on public.maintenance_records for update to anon using (true) with check (true);

create policy "app_select_ambulance_locations"
  on public.ambulance_locations for select to anon using (true);
create policy "app_insert_ambulance_locations"
  on public.ambulance_locations for insert to anon with check (true);
create policy "app_update_ambulance_locations"
  on public.ambulance_locations for update to anon using (true) with check (true);
