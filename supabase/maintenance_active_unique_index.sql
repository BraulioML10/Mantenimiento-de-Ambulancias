-- Evita que una ambulancia tenga mas de un mantenimiento activo a la vez.
-- Ejecutar despues de eliminar o finalizar duplicados existentes.

create unique index if not exists maintenance_records_one_active_per_ambulance_idx
  on public.maintenance_records (ambulance_code)
  where status in ('programada', 'en_taller', 'esperando_repuesto');
