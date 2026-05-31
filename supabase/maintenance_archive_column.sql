-- Permite sacar mantenimientos finalizados de la lista principal sin borrar historial.

alter table public.maintenance_records
  add column if not exists archived_at timestamptz;

create index if not exists maintenance_records_archived_at_idx
  on public.maintenance_records(archived_at);
