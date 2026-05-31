-- Agrega correo de contacto para talleres.

alter table public.maintenance_workshops
  add column if not exists contact_email text;
