# Orden recomendado para Supabase

Usa estos scripts en este orden desde Supabase SQL Editor.

## 1. Estructura limpia incremental

Ejecutar:

```sql
supabase/core_rules_incremental.sql
```

Este script deja la base preparada con tablas y columnas nuevas sin borrar datos.

## 2. Limpieza segura de datos de prueba actuales

Ejecutar:

```sql
supabase/safe_cleanup_current_database.sql
```

Este script:

- Anula el movimiento de presupuesto absurdo detectado.
- Corrige a 0 el costo absurdo de una mantención de prueba.
- No borra ambulancias.
- No borra formularios.
- No borra mantenimientos.
- No hace `drop table`.

## 3. No usar salvo reinicio total confirmado

Evitar por ahora:

```sql
supabase/reset_clean_database.sql
```

Ese archivo es para reinicio completo y puede eliminar tablas/datos si se ejecuta.
