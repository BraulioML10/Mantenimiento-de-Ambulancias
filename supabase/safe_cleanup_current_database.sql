-- Limpieza segura de la base actual.
-- No ejecuta DROP TABLE.
-- No borra ambulancias, usuarios, formularios, kilometrajes ni mantenimientos.
-- Corrige/anula solo datos de prueba o montos absurdos detectados en esta base.

begin;

-- =========================================================
-- 1. Auditoria antes de limpiar
-- Ejecuta estas consultas para ver que se tocara.
-- =========================================================

select
  'budget_movements sospechosos' as revision,
  id,
  budget_id,
  movement_type,
  amount,
  movement_date,
  description,
  created_at
from public.budget_movements
where amount >= 1000000000
   or amount < 0
order by created_at desc;

select
  'maintenance_records sospechosos' as revision,
  id,
  ambulance_code,
  maintenance_type,
  reason,
  estimated_cost,
  final_cost,
  status,
  created_at
from public.maintenance_records
where coalesce(estimated_cost, 0) >= 1000000000
   or coalesce(final_cost, 0) >= 1000000000
   or coalesce(estimated_cost, 0) < 0
   or coalesce(final_cost, 0) < 0
order by created_at desc;

-- =========================================================
-- 2. Asegurar columnas de presupuesto antes de anular
-- Idempotente: se puede ejecutar mas de una vez.
-- =========================================================

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

-- =========================================================
-- 3. Anular el bono absurdo detectado
-- ID detectado: 79a61a9a-f13b-4c99-8881-88e5d9942398
-- Monto: 2.500.000.000 CLP
-- No se elimina; queda historial de que fue anulado.
-- =========================================================

update public.budget_movements
set
  status = 'anulado',
  cancelled_at = coalesce(cancelled_at, now()),
  cancellation_reason = coalesce(
    cancellation_reason,
    'Dato de prueba: bono con monto absurdo ingresado durante pruebas.'
  )
where id = '79a61a9a-f13b-4c99-8881-88e5d9942398'
  and amount >= 1000000000;

-- =========================================================
-- 4. Corregir costo absurdo en mantenimiento sin borrar el registro
-- ID detectado: 70281f68-92a3-47f3-a4c0-69267a0482f1
-- Monto: 25.555.555.555 CLP
-- Se deja costo en 0 para que no contamine estadisticas.
-- La mantencion se conserva.
-- =========================================================

update public.maintenance_records
set
  estimated_cost = 0,
  final_cost = null,
  financial_notes = trim(
    both ' ' from concat(
      coalesce(financial_notes, ''),
      case when financial_notes is null then '' else ' ' end,
      '[Limpieza] Costo estimado absurdo corregido a 0 por dato de prueba.'
    )
  ),
  updated_at = now()
where id = '70281f68-92a3-47f3-a4c0-69267a0482f1'
  and coalesce(estimated_cost, 0) >= 1000000000;

-- =========================================================
-- 5. Auditoria despues de limpiar
-- Debe quedar vacia o solo con registros reales que quieras revisar.
-- =========================================================

select
  'budget_movements sospechosos restantes' as revision,
  id,
  movement_type,
  amount,
  status,
  cancellation_reason
from public.budget_movements
where (amount >= 1000000000 or amount < 0)
  and coalesce(status, 'activo') = 'activo';

select
  'maintenance_records sospechosos restantes' as revision,
  id,
  ambulance_code,
  estimated_cost,
  final_cost,
  financial_notes
from public.maintenance_records
where coalesce(estimated_cost, 0) >= 1000000000
   or coalesce(final_cost, 0) >= 1000000000
   or coalesce(estimated_cost, 0) < 0
   or coalesce(final_cost, 0) < 0;

commit;

-- =========================================================
-- Opcional: eliminar fisicamente movimientos de presupuesto anulados del mes.
-- NO ejecutar si quieres mantener historial de anulaciones.
-- Para usarlo, descomenta y ajusta year/month.
-- =========================================================

-- delete from public.budget_movements
-- where year = 2026
--   and month = 6
--   and status = 'anulado'
--   and (
--     amount >= 1000000000
--     or lower(coalesce(reason, '')) like '%prueba%'
--     or lower(coalesce(description, '')) like '%prueba%'
--   );
