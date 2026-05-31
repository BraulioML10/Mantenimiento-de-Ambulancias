create table if not exists public.maintenance_workshops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  address text,
  status text not null default 'activo',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_workshops_status_check
    check (status in ('activo', 'pausado', 'inactivo'))
);

create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  ambulance_code text not null references public.ambulances(code) on update cascade,
  ambulance_patente text,
  maintenance_type text not null,
  reason text not null,
  workshop_id uuid references public.maintenance_workshops(id) on delete set null,
  scheduled_date date,
  scheduled_time time,
  estimated_days integer not null default 0,
  estimated_cost numeric(12, 0) not null default 0,
  status text not null default 'programada',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_records_type_check
    check (maintenance_type in ('preventiva', 'correctiva')),
  constraint maintenance_records_status_check
    check (status in (
      'programada',
      'en_taller',
      'esperando_repuesto',
      'finalizada',
      'cancelada'
    )),
  constraint maintenance_records_estimated_days_check
    check (estimated_days >= 0),
  constraint maintenance_records_estimated_cost_check
    check (estimated_cost >= 0)
);

create index if not exists maintenance_records_ambulance_code_idx
  on public.maintenance_records (ambulance_code);

create index if not exists maintenance_records_status_idx
  on public.maintenance_records (status);

create index if not exists maintenance_records_scheduled_date_idx
  on public.maintenance_records (scheduled_date);

create index if not exists maintenance_workshops_status_idx
  on public.maintenance_workshops (status);

alter table public.maintenance_workshops enable row level security;
alter table public.maintenance_records enable row level security;

drop policy if exists "Allow app read maintenance workshops" on public.maintenance_workshops;
drop policy if exists "Allow app insert maintenance workshops" on public.maintenance_workshops;
drop policy if exists "Allow app update maintenance workshops" on public.maintenance_workshops;
drop policy if exists "Allow app read maintenance records" on public.maintenance_records;
drop policy if exists "Allow app insert maintenance records" on public.maintenance_records;
drop policy if exists "Allow app update maintenance records" on public.maintenance_records;

create policy "Allow app read maintenance workshops"
  on public.maintenance_workshops
  for select
  to anon
  using (true);

create policy "Allow app insert maintenance workshops"
  on public.maintenance_workshops
  for insert
  to anon
  with check (true);

create policy "Allow app update maintenance workshops"
  on public.maintenance_workshops
  for update
  to anon
  using (true)
  with check (true);

create policy "Allow app read maintenance records"
  on public.maintenance_records
  for select
  to anon
  using (true);

create policy "Allow app insert maintenance records"
  on public.maintenance_records
  for insert
  to anon
  with check (true);

create policy "Allow app update maintenance records"
  on public.maintenance_records
  for update
  to anon
  using (true)
  with check (true);
