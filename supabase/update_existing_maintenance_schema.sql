-- Actualiza tablas de mantenimiento ya existentes sin borrar datos.
-- Ejecutar en Supabase SQL Editor si maintenance_records o maintenance_workshops ya existian.

alter table public.maintenance_workshops
  add column if not exists contact_name text,
  add column if not exists contact_phone text,
  add column if not exists address text,
  add column if not exists status text not null default 'activo',
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.maintenance_records
  add column if not exists ambulance_patente text,
  add column if not exists requested_by_user_id uuid,
  add column if not exists requested_by_name text,
  add column if not exists requested_by_role text,
  add column if not exists maintenance_type text not null default 'preventiva',
  add column if not exists reason text not null default 'Mantenimiento registrado',
  add column if not exists source text not null default 'manual',
  add column if not exists source_form_id uuid,
  add column if not exists workshop_id uuid,
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
  add column if not exists updated_at timestamptz not null default now();

alter table public.maintenance_records
  drop constraint if exists maintenance_records_requested_by_user_id_fkey,
  drop constraint if exists maintenance_records_source_form_id_fkey,
  drop constraint if exists maintenance_records_workshop_id_fkey;

alter table public.maintenance_records
  add constraint maintenance_records_requested_by_user_id_fkey
    foreign key (requested_by_user_id)
    references public.system_users(id)
    on update cascade,
  add constraint maintenance_records_source_form_id_fkey
    foreign key (source_form_id)
    references public.shift_route_forms(id)
    on delete set null,
  add constraint maintenance_records_workshop_id_fkey
    foreign key (workshop_id)
    references public.maintenance_workshops(id)
    on delete set null;

create index if not exists maintenance_records_requested_by_user_id_idx
  on public.maintenance_records(requested_by_user_id);

create index if not exists maintenance_records_workshop_id_idx
  on public.maintenance_records(workshop_id);

create index if not exists maintenance_records_status_idx
  on public.maintenance_records(status);

create index if not exists maintenance_records_scheduled_date_idx
  on public.maintenance_records(scheduled_date);

alter table public.maintenance_workshops enable row level security;
alter table public.maintenance_records enable row level security;

drop policy if exists "app_select_maintenance_workshops" on public.maintenance_workshops;
drop policy if exists "app_insert_maintenance_workshops" on public.maintenance_workshops;
drop policy if exists "app_update_maintenance_workshops" on public.maintenance_workshops;
drop policy if exists "app_select_maintenance_records" on public.maintenance_records;
drop policy if exists "app_insert_maintenance_records" on public.maintenance_records;
drop policy if exists "app_update_maintenance_records" on public.maintenance_records;

drop policy if exists "Allow app read maintenance workshops" on public.maintenance_workshops;
drop policy if exists "Allow app insert maintenance workshops" on public.maintenance_workshops;
drop policy if exists "Allow app update maintenance workshops" on public.maintenance_workshops;
drop policy if exists "Allow app read maintenance records" on public.maintenance_records;
drop policy if exists "Allow app insert maintenance records" on public.maintenance_records;
drop policy if exists "Allow app update maintenance records" on public.maintenance_records;

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
