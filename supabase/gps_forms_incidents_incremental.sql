-- GPS, formularios GPS/sin GPS y siniestros correctivos.
-- Seguro para ejecutar en Supabase SQL Editor. No borra datos.

alter table public.ambulances
  add column if not exists has_gps boolean not null default false,
  add column if not exists gps_device_id text;

alter table public.shift_route_forms
  add column if not exists form_type text not null default 'manual_sin_gps',
  add column if not exists gps_reported_km integer;

alter table public.maintenance_records
  add column if not exists source text,
  add column if not exists notes text;

create index if not exists maintenance_records_source_idx
  on public.maintenance_records(source);

create index if not exists shift_route_forms_form_type_idx
  on public.shift_route_forms(form_type);
