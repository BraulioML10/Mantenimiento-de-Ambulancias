-- Core incremental schema for Mantenimiento de Ambulancias.
-- Safe to run in Supabase SQL Editor: it does not drop tables or delete data.
-- It adds the columns/tables needed for active fleet, mileage history,
-- no-GPS/GPS forms, maintenance stages, notes and budgets.

create extension if not exists pgcrypto;

-- =========================================================
-- Users
-- =========================================================

create table if not exists public.system_users (
  id uuid primary key default gen_random_uuid(),
  user_code text not null unique,
  name text not null,
  username text not null unique,
  email text,
  role text not null,
  status text not null default 'Activo',
  temporary_password text,
  last_access timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.system_users
  add column if not exists user_code text,
  add column if not exists name text,
  add column if not exists username text,
  add column if not exists email text,
  add column if not exists role text,
  add column if not exists status text not null default 'Activo',
  add column if not exists temporary_password text,
  add column if not exists last_access timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- =========================================================
-- Ambulance master
-- Existing app uses code as the public mobile code. A uuid id is added for
-- future relational references without breaking the current frontend.
-- =========================================================

create table if not exists public.ambulances (
  code text primary key,
  patente text not null,
  base text not null,
  modelo text not null,
  status text not null default 'operativa',
  kilometraje_actual integer not null default 0,
  kilometraje_ultima_mantencion integer not null default 0,
  uso_desde_ultima_mantencion integer not null default 0,
  pauta_preventiva_km integer not null default 10000,
  last_update text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ambulances
  add column if not exists patente text,
  add column if not exists base text,
  add column if not exists modelo text,
  add column if not exists status text not null default 'operativa',
  add column if not exists kilometraje_actual integer not null default 0,
  add column if not exists kilometraje_ultima_mantencion integer not null default 0,
  add column if not exists uso_desde_ultima_mantencion integer not null default 0,
  add column if not exists pauta_preventiva_km integer not null default 10000,
  add column if not exists last_update text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists plate_number text,
  add column if not exists brand text,
  add column if not exists model text,
  add column if not exists year integer,
  add column if not exists base_location text,
  add column if not exists operational_status text,
  add column if not exists current_mileage integer,
  add column if not exists last_maintenance_mileage integer,
  add column if not exists preventive_interval_km integer,
  add column if not exists km_since_last_maintenance integer,
  add column if not exists km_until_next_maintenance integer,
  add column if not exists preventive_alert_status text not null default 'sin_alerta',
  add column if not exists has_gps boolean not null default false,
  add column if not exists gps_device_id text,
  add column if not exists general_observation text,
  add column if not exists is_active boolean not null default true,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.ambulances
set
  id = coalesce(id, gen_random_uuid()),
  plate_number = coalesce(plate_number, patente),
  model = coalesce(model, modelo),
  base_location = coalesce(base_location, base),
  operational_status = coalesce(operational_status, status),
  current_mileage = coalesce(current_mileage, kilometraje_actual),
  last_maintenance_mileage = coalesce(last_maintenance_mileage, kilometraje_ultima_mantencion),
  preventive_interval_km = coalesce(preventive_interval_km, pauta_preventiva_km),
  km_since_last_maintenance = coalesce(km_since_last_maintenance, uso_desde_ultima_mantencion),
  km_until_next_maintenance = coalesce(
    km_until_next_maintenance,
    greatest(0, pauta_preventiva_km - uso_desde_ultima_mantencion)
  ),
  is_active = coalesce(is_active, true)
where id is null
   or plate_number is null
   or model is null
   or base_location is null
   or operational_status is null
   or current_mileage is null
   or last_maintenance_mileage is null
   or preventive_interval_km is null
   or km_since_last_maintenance is null
   or km_until_next_maintenance is null
   or is_active is null;

alter table public.ambulances
  alter column id set not null,
  alter column id set default gen_random_uuid(),
  alter column is_active set default true,
  alter column is_active set not null;

create unique index if not exists ambulances_id_uidx
  on public.ambulances(id);

create index if not exists ambulances_active_idx
  on public.ambulances(is_active, archived_at);

-- =========================================================
-- Mileage history
-- Every real mileage change should leave a row here.
-- =========================================================

create table if not exists public.mileage_logs (
  id uuid primary key default gen_random_uuid(),
  ambulance_id uuid references public.ambulances(id) on update cascade,
  ambulance_code text references public.ambulances(code) on update cascade,
  previous_mileage integer,
  new_mileage integer,
  travelled_km integer not null default 0,
  source_type text not null default 'ajuste_admin',
  source_id uuid,
  registered_by_user_id uuid references public.system_users(id) on update cascade,
  registered_by_name text,
  notes text,
  kilometraje_total integer,
  uso_desde_mantencion integer,
  km_faltantes integer,
  created_at timestamptz not null default now()
);

alter table public.mileage_logs
  add column if not exists ambulance_id uuid references public.ambulances(id) on update cascade,
  add column if not exists ambulance_code text,
  add column if not exists previous_mileage integer,
  add column if not exists new_mileage integer,
  add column if not exists travelled_km integer not null default 0,
  add column if not exists source_type text not null default 'ajuste_admin',
  add column if not exists source_id uuid,
  add column if not exists registered_by_user_id uuid references public.system_users(id) on update cascade,
  add column if not exists registered_by_name text,
  add column if not exists notes text,
  add column if not exists kilometraje_total integer,
  add column if not exists uso_desde_mantencion integer,
  add column if not exists km_faltantes integer,
  add column if not exists created_at timestamptz not null default now();

update public.mileage_logs ml
set ambulance_id = a.id
from public.ambulances a
where ml.ambulance_id is null
  and ml.ambulance_code = a.code;

create index if not exists mileage_logs_ambulance_code_idx
  on public.mileage_logs(ambulance_code, created_at desc);

create index if not exists mileage_logs_ambulance_id_idx
  on public.mileage_logs(ambulance_id, created_at desc);

-- =========================================================
-- No-GPS route/shift forms
-- The app still stores detailed checks as jsonb; extra canonical fields are
-- added for future reporting and validation.
-- =========================================================

create table if not exists public.shift_route_forms (
  id uuid primary key default gen_random_uuid(),
  ambulance_code text not null references public.ambulances(code) on update cascade,
  ambulance_patente text,
  ambulance_base text,
  ambulance_modelo text,
  registered_by_user_id uuid references public.system_users(id) on update cascade,
  registered_by_name text,
  registered_by_role text,
  shift_type text,
  form_date date not null default current_date,
  start_time time,
  end_time time,
  start_km integer not null default 0,
  end_km integer not null default 0,
  total_km integer,
  destination_reason text,
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
  updated_at timestamptz not null default now()
);

alter table public.shift_route_forms
  add column if not exists ambulance_patente text,
  add column if not exists ambulance_base text,
  add column if not exists ambulance_modelo text,
  add column if not exists registered_by_user_id uuid references public.system_users(id) on update cascade,
  add column if not exists registered_by_name text,
  add column if not exists registered_by_role text,
  add column if not exists shift_type text,
  add column if not exists form_date date not null default current_date,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists start_km integer not null default 0,
  add column if not exists end_km integer not null default 0,
  add column if not exists total_km integer,
  add column if not exists destination_reason text,
  add column if not exists fuel_liters numeric(10, 2),
  add column if not exists fuel_value numeric(12, 0),
  add column if not exists fuel_km integer,
  add column if not exists delivery_observations text,
  add column if not exists reception_observations text,
  add column if not exists inspection_items jsonb not null default '[]'::jsonb,
  add column if not exists document_checks jsonb not null default '[]'::jsonb,
  add column if not exists damage_reports jsonb not null default '[]'::jsonb,
  add column if not exists status text not null default 'Enviado',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists ambulance_id uuid references public.ambulances(id) on update cascade,
  add column if not exists user_id uuid references public.system_users(id) on update cascade,
  add column if not exists driver_name text,
  add column if not exists form_type text not null default 'manual_sin_gps',
  add column if not exists shift_date date,
  add column if not exists travelled_km integer,
  add column if not exists gps_reported_km integer,
  add column if not exists fuel_level text,
  add column if not exists general_status text,
  add column if not exists observations text,
  add column if not exists updated_at timestamptz not null default now();

update public.shift_route_forms f
set
  ambulance_id = coalesce(f.ambulance_id, a.id),
  user_id = coalesce(f.user_id, f.registered_by_user_id),
  driver_name = coalesce(f.driver_name, f.registered_by_name),
  shift_date = coalesce(f.shift_date, f.form_date),
  travelled_km = coalesce(f.travelled_km, greatest(0, coalesce(f.end_km, 0) - coalesce(f.start_km, 0)))
from public.ambulances a
where f.ambulance_code = a.code
  and (
    f.ambulance_id is null
    or f.user_id is null
    or f.driver_name is null
    or f.shift_date is null
    or f.travelled_km is null
  );

create table if not exists public.form_damage_reports (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.shift_route_forms(id) on delete cascade,
  ambulance_id uuid references public.ambulances(id) on update cascade,
  ambulance_code text references public.ambulances(code) on update cascade,
  damage_type text not null,
  affected_area text not null,
  description text not null,
  requires_corrective_maintenance boolean not null default false,
  related_maintenance_record_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shift_route_forms_ambulance_code_idx
  on public.shift_route_forms(ambulance_code, form_date desc);

create index if not exists form_damage_reports_form_id_idx
  on public.form_damage_reports(form_id);

-- =========================================================
-- GPS future tables
-- =========================================================

create table if not exists public.gps_devices (
  id uuid primary key default gen_random_uuid(),
  ambulance_id uuid references public.ambulances(id) on update cascade,
  ambulance_code text references public.ambulances(code) on update cascade,
  external_device_id text not null,
  provider text,
  status text not null default 'activo',
  installed_at date,
  removed_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gps_mileage_logs (
  id uuid primary key default gen_random_uuid(),
  ambulance_id uuid references public.ambulances(id) on update cascade,
  ambulance_code text references public.ambulances(code) on update cascade,
  gps_device_id uuid references public.gps_devices(id) on delete set null,
  external_device_id text,
  recorded_at timestamptz not null default now(),
  previous_mileage integer,
  gps_mileage integer not null,
  travelled_km integer not null default 0,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists gps_devices_ambulance_code_idx
  on public.gps_devices(ambulance_code);

create index if not exists gps_mileage_logs_ambulance_code_idx
  on public.gps_mileage_logs(ambulance_code, recorded_at desc);

-- =========================================================
-- Workshops and maintenance
-- =========================================================

create table if not exists public.maintenance_workshops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  email text,
  address text,
  status text not null default 'activo',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.maintenance_workshops
  add column if not exists name text,
  add column if not exists contact_name text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists status text not null default 'activo',
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

update public.maintenance_workshops
set
  contact_email = coalesce(contact_email, email),
  email = coalesce(email, contact_email);

create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  ambulance_code text not null references public.ambulances(code) on update cascade,
  ambulance_patente text,
  requested_by_user_id uuid references public.system_users(id) on update cascade,
  requested_by_name text,
  requested_by_role text,
  maintenance_type text not null default 'preventiva',
  reason text not null default '',
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
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.maintenance_records
  add column if not exists ambulance_patente text,
  add column if not exists requested_by_user_id uuid references public.system_users(id) on update cascade,
  add column if not exists requested_by_name text,
  add column if not exists requested_by_role text,
  add column if not exists maintenance_type text not null default 'preventiva',
  add column if not exists reason text not null default '',
  add column if not exists source text not null default 'manual',
  add column if not exists source_form_id uuid references public.shift_route_forms(id) on delete set null,
  add column if not exists workshop_id uuid references public.maintenance_workshops(id) on delete set null,
  add column if not exists scheduled_date date,
  add column if not exists scheduled_time time,
  add column if not exists started_at timestamptz,
  add column if not exists finished_at timestamptz,
  add column if not exists estimated_days integer not null default 0,
  add column if not exists estimated_cost numeric(12, 0) not null default 0,
  add column if not exists final_cost numeric(12, 0),
  add column if not exists km_at_start integer,
  add column if not exists km_at_finish integer,
  add column if not exists status text not null default 'programada',
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists ambulance_id uuid references public.ambulances(id) on update cascade,
  add column if not exists maintenance_status text not null default 'programada',
  add column if not exists current_stage text not null default 'programada',
  add column if not exists request_origin text,
  add column if not exists related_damage_report_id uuid references public.form_damage_reports(id) on delete set null,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists mileage_at_start integer,
  add column if not exists mileage_at_end integer,
  add column if not exists description text,
  add column if not exists workshop_name text,
  add column if not exists responsible_user_id uuid references public.system_users(id) on update cascade,
  add column if not exists responsible_name text,
  add column if not exists parts_cost numeric(12, 0) not null default 0,
  add column if not exists labor_cost numeric(12, 0) not null default 0,
  add column if not exists other_cost numeric(12, 0) not null default 0,
  add column if not exists financial_notes text,
  add column if not exists general_notes text,
  add column if not exists created_by_user_id uuid references public.system_users(id) on update cascade,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.maintenance_records mr
set
  ambulance_id = coalesce(mr.ambulance_id, a.id),
  maintenance_status = coalesce(mr.maintenance_status, mr.status),
  current_stage = coalesce(mr.current_stage, mr.status),
  request_origin = coalesce(mr.request_origin, mr.source),
  start_date = coalesce(mr.start_date, mr.started_at::date),
  end_date = coalesce(mr.end_date, mr.finished_at::date),
  mileage_at_start = coalesce(mr.mileage_at_start, mr.km_at_start),
  mileage_at_end = coalesce(mr.mileage_at_end, mr.km_at_finish),
  description = coalesce(mr.description, mr.reason),
  responsible_user_id = coalesce(mr.responsible_user_id, mr.requested_by_user_id),
  responsible_name = coalesce(mr.responsible_name, mr.requested_by_name),
  general_notes = coalesce(mr.general_notes, mr.notes),
  created_by_user_id = coalesce(mr.created_by_user_id, mr.requested_by_user_id)
from public.ambulances a
where mr.ambulance_code = a.code;

create table if not exists public.maintenance_stage_history (
  id uuid primary key default gen_random_uuid(),
  maintenance_record_id uuid not null references public.maintenance_records(id) on delete cascade,
  previous_stage text,
  new_stage text not null,
  changed_by_user_id uuid references public.system_users(id) on update cascade,
  changed_by_name text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists maintenance_records_ambulance_code_idx
  on public.maintenance_records(ambulance_code);

create index if not exists maintenance_records_status_idx
  on public.maintenance_records(status);

create index if not exists maintenance_records_archived_at_idx
  on public.maintenance_records(archived_at);

create index if not exists maintenance_stage_history_record_idx
  on public.maintenance_stage_history(maintenance_record_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'maintenance_records_one_active_per_ambulance_idx'
  ) then
    if exists (
      select 1
      from (
        select ambulance_code
        from public.maintenance_records
        where status in ('programada', 'en_taller', 'esperando_repuesto')
          and archived_at is null
        group by ambulance_code
        having count(*) > 1
      ) duplicates
    ) then
      raise notice 'Active maintenance unique index was not created because duplicate active records exist. Finish, cancel or archive duplicates first.';
    else
      execute 'create unique index maintenance_records_one_active_per_ambulance_idx on public.maintenance_records (ambulance_code) where status in (''programada'', ''en_taller'', ''esperando_repuesto'') and archived_at is null';
    end if;
  end if;
end $$;

-- =========================================================
-- Ambulance notes and budget
-- =========================================================

create table if not exists public.ambulance_notes (
  id uuid primary key default gen_random_uuid(),
  ambulance_id uuid references public.ambulances(id) on update cascade,
  ambulance_code text references public.ambulances(code) on update cascade,
  note_type text not null default 'general',
  note_text text not null,
  created_by_user_id uuid references public.system_users(id) on update cascade,
  created_by_name text,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_budgets (
  id uuid primary key default gen_random_uuid(),
  budget_year integer not null,
  budget_month integer,
  budget_type text not null default 'anual',
  total_amount numeric(14, 0) not null default 0,
  reserved_amount numeric(14, 0) not null default 0,
  spent_amount numeric(14, 0) not null default 0,
  notes text,
  is_active boolean not null default true,
  created_by_user_id uuid references public.system_users(id) on update cascade,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_budgets_month_check
    check (budget_month is null or budget_month between 1 and 12),
  constraint maintenance_budgets_amount_check
    check (total_amount >= 0 and reserved_amount >= 0 and spent_amount >= 0),
  constraint maintenance_budgets_unique_period
    unique (budget_year, budget_month, budget_type)
);

alter table public.maintenance_budgets
  add column if not exists year integer,
  add column if not exists month integer,
  add column if not exists initial_budget numeric(14, 0) not null default 0,
  add column if not exists preventive_budget numeric(14, 0) not null default 0,
  add column if not exists corrective_budget numeric(14, 0) not null default 0,
  add column if not exists total_budget numeric(14, 0) not null default 0,
  add column if not exists notes text,
  add column if not exists created_by_user_id uuid references public.system_users(id) on update cascade,
  add column if not exists created_by_name text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.maintenance_budgets
set
  year = coalesce(year, budget_year),
  month = coalesce(month, budget_month),
  initial_budget = coalesce(nullif(initial_budget, 0), total_amount, total_budget, 0),
  total_budget = coalesce(nullif(total_budget, 0), total_amount, initial_budget, 0),
  total_amount = coalesce(nullif(total_amount, 0), total_budget, initial_budget, 0),
  budget_year = coalesce(budget_year, year),
  budget_month = coalesce(budget_month, month),
  updated_at = now()
where year is null
   or month is distinct from budget_month
   or total_budget = 0
   or total_amount = 0;

create unique index if not exists maintenance_budgets_year_month_uidx
  on public.maintenance_budgets(year, month)
  where is_active = true;

create table if not exists public.budget_movements (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references public.maintenance_budgets(id) on delete set null,
  maintenance_record_id uuid references public.maintenance_records(id) on delete set null,
  movement_type text not null,
  amount numeric(14, 0) not null default 0,
  movement_date date not null default current_date,
  description text,
  created_by_user_id uuid references public.system_users(id) on update cascade,
  created_by_name text,
  created_at timestamptz not null default now()
);

alter table public.budget_movements
  add column if not exists year integer,
  add column if not exists month integer,
  add column if not exists reason text,
  add column if not exists status text not null default 'activo',
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by_user_id uuid references public.system_users(id) on update cascade,
  add column if not exists cancelled_by_name text,
  add column if not exists cancellation_reason text;

update public.budget_movements
set
  year = coalesce(year, extract(year from movement_date)::integer),
  month = coalesce(month, extract(month from movement_date)::integer),
  reason = coalesce(reason, description),
  status = coalesce(status, 'activo')
where year is null
   or month is null
   or reason is null
   or status is null;

create index if not exists ambulance_notes_ambulance_code_idx
  on public.ambulance_notes(ambulance_code, created_at desc);

create index if not exists budget_movements_budget_id_idx
  on public.budget_movements(budget_id, movement_date desc);

create index if not exists budget_movements_year_month_idx
  on public.budget_movements(year, month, status);

create index if not exists budget_movements_maintenance_record_id_idx
  on public.budget_movements(maintenance_record_id);

-- =========================================================
-- Optional operational map table
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

create index if not exists ambulance_locations_ambulance_code_idx
  on public.ambulance_locations(ambulance_code);

-- =========================================================
-- RLS for current frontend login model
-- The app uses its own system_users login, so requests reach Supabase as anon.
-- These policies are permissive by design until Supabase Auth is introduced.
-- =========================================================

alter table public.system_users enable row level security;
alter table public.ambulances enable row level security;
alter table public.mileage_logs enable row level security;
alter table public.shift_route_forms enable row level security;
alter table public.form_damage_reports enable row level security;
alter table public.gps_devices enable row level security;
alter table public.gps_mileage_logs enable row level security;
alter table public.maintenance_workshops enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.maintenance_stage_history enable row level security;
alter table public.ambulance_notes enable row level security;
alter table public.maintenance_budgets enable row level security;
alter table public.budget_movements enable row level security;
alter table public.ambulance_locations enable row level security;

drop policy if exists app_select_system_users on public.system_users;
drop policy if exists app_insert_system_users on public.system_users;
drop policy if exists app_update_system_users on public.system_users;
drop policy if exists app_delete_system_users on public.system_users;

drop policy if exists app_select_ambulances on public.ambulances;
drop policy if exists app_insert_ambulances on public.ambulances;
drop policy if exists app_update_ambulances on public.ambulances;
drop policy if exists app_delete_ambulances on public.ambulances;

drop policy if exists app_select_mileage_logs on public.mileage_logs;
drop policy if exists app_insert_mileage_logs on public.mileage_logs;
drop policy if exists app_update_mileage_logs on public.mileage_logs;

drop policy if exists app_select_shift_route_forms on public.shift_route_forms;
drop policy if exists app_insert_shift_route_forms on public.shift_route_forms;
drop policy if exists app_update_shift_route_forms on public.shift_route_forms;

drop policy if exists app_select_form_damage_reports on public.form_damage_reports;
drop policy if exists app_insert_form_damage_reports on public.form_damage_reports;
drop policy if exists app_update_form_damage_reports on public.form_damage_reports;

drop policy if exists app_select_gps_devices on public.gps_devices;
drop policy if exists app_insert_gps_devices on public.gps_devices;
drop policy if exists app_update_gps_devices on public.gps_devices;

drop policy if exists app_select_gps_mileage_logs on public.gps_mileage_logs;
drop policy if exists app_insert_gps_mileage_logs on public.gps_mileage_logs;
drop policy if exists app_update_gps_mileage_logs on public.gps_mileage_logs;

drop policy if exists app_select_maintenance_workshops on public.maintenance_workshops;
drop policy if exists app_insert_maintenance_workshops on public.maintenance_workshops;
drop policy if exists app_update_maintenance_workshops on public.maintenance_workshops;

drop policy if exists app_select_maintenance_records on public.maintenance_records;
drop policy if exists app_insert_maintenance_records on public.maintenance_records;
drop policy if exists app_update_maintenance_records on public.maintenance_records;

drop policy if exists app_select_maintenance_stage_history on public.maintenance_stage_history;
drop policy if exists app_insert_maintenance_stage_history on public.maintenance_stage_history;
drop policy if exists app_update_maintenance_stage_history on public.maintenance_stage_history;

drop policy if exists app_select_ambulance_notes on public.ambulance_notes;
drop policy if exists app_insert_ambulance_notes on public.ambulance_notes;
drop policy if exists app_update_ambulance_notes on public.ambulance_notes;

drop policy if exists app_select_maintenance_budgets on public.maintenance_budgets;
drop policy if exists app_insert_maintenance_budgets on public.maintenance_budgets;
drop policy if exists app_update_maintenance_budgets on public.maintenance_budgets;

drop policy if exists app_select_budget_movements on public.budget_movements;
drop policy if exists app_insert_budget_movements on public.budget_movements;
drop policy if exists app_update_budget_movements on public.budget_movements;
drop policy if exists app_delete_budget_movements on public.budget_movements;

drop policy if exists app_select_ambulance_locations on public.ambulance_locations;
drop policy if exists app_insert_ambulance_locations on public.ambulance_locations;
drop policy if exists app_update_ambulance_locations on public.ambulance_locations;

create policy app_select_system_users on public.system_users
  for select to anon using (true);
create policy app_insert_system_users on public.system_users
  for insert to anon with check (true);
create policy app_update_system_users on public.system_users
  for update to anon using (true) with check (true);
create policy app_delete_system_users on public.system_users
  for delete to anon using (true);

create policy app_select_ambulances on public.ambulances
  for select to anon using (true);
create policy app_insert_ambulances on public.ambulances
  for insert to anon with check (true);
create policy app_update_ambulances on public.ambulances
  for update to anon using (true) with check (true);

create policy app_select_mileage_logs on public.mileage_logs
  for select to anon using (true);
create policy app_insert_mileage_logs on public.mileage_logs
  for insert to anon with check (true);
create policy app_update_mileage_logs on public.mileage_logs
  for update to anon using (true) with check (true);

create policy app_select_shift_route_forms on public.shift_route_forms
  for select to anon using (true);
create policy app_insert_shift_route_forms on public.shift_route_forms
  for insert to anon with check (true);
create policy app_update_shift_route_forms on public.shift_route_forms
  for update to anon using (true) with check (true);

create policy app_select_form_damage_reports on public.form_damage_reports
  for select to anon using (true);
create policy app_insert_form_damage_reports on public.form_damage_reports
  for insert to anon with check (true);
create policy app_update_form_damage_reports on public.form_damage_reports
  for update to anon using (true) with check (true);

create policy app_select_gps_devices on public.gps_devices
  for select to anon using (true);
create policy app_insert_gps_devices on public.gps_devices
  for insert to anon with check (true);
create policy app_update_gps_devices on public.gps_devices
  for update to anon using (true) with check (true);

create policy app_select_gps_mileage_logs on public.gps_mileage_logs
  for select to anon using (true);
create policy app_insert_gps_mileage_logs on public.gps_mileage_logs
  for insert to anon with check (true);
create policy app_update_gps_mileage_logs on public.gps_mileage_logs
  for update to anon using (true) with check (true);

create policy app_select_maintenance_workshops on public.maintenance_workshops
  for select to anon using (true);
create policy app_insert_maintenance_workshops on public.maintenance_workshops
  for insert to anon with check (true);
create policy app_update_maintenance_workshops on public.maintenance_workshops
  for update to anon using (true) with check (true);

create policy app_select_maintenance_records on public.maintenance_records
  for select to anon using (true);
create policy app_insert_maintenance_records on public.maintenance_records
  for insert to anon with check (true);
create policy app_update_maintenance_records on public.maintenance_records
  for update to anon using (true) with check (true);

create policy app_select_maintenance_stage_history on public.maintenance_stage_history
  for select to anon using (true);
create policy app_insert_maintenance_stage_history on public.maintenance_stage_history
  for insert to anon with check (true);
create policy app_update_maintenance_stage_history on public.maintenance_stage_history
  for update to anon using (true) with check (true);

create policy app_select_ambulance_notes on public.ambulance_notes
  for select to anon using (true);
create policy app_insert_ambulance_notes on public.ambulance_notes
  for insert to anon with check (true);
create policy app_update_ambulance_notes on public.ambulance_notes
  for update to anon using (true) with check (true);

create policy app_select_maintenance_budgets on public.maintenance_budgets
  for select to anon using (true);
create policy app_insert_maintenance_budgets on public.maintenance_budgets
  for insert to anon with check (true);
create policy app_update_maintenance_budgets on public.maintenance_budgets
  for update to anon using (true) with check (true);

create policy app_select_budget_movements on public.budget_movements
  for select to anon using (true);
create policy app_insert_budget_movements on public.budget_movements
  for insert to anon with check (true);
create policy app_update_budget_movements on public.budget_movements
  for update to anon using (true) with check (true);
create policy app_delete_budget_movements on public.budget_movements
  for delete to anon using (true);

create policy app_select_ambulance_locations on public.ambulance_locations
  for select to anon using (true);
create policy app_insert_ambulance_locations on public.ambulance_locations
  for insert to anon with check (true);
create policy app_update_ambulance_locations on public.ambulance_locations
  for update to anon using (true) with check (true);

grant usage on schema public to anon;
grant select, insert, update on all tables in schema public to anon;
grant delete on public.system_users to anon;
grant delete on public.budget_movements to anon;
grant usage, select on all sequences in schema public to anon;
