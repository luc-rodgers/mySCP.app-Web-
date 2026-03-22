-- Add street_address column to projects
alter table public.projects
  add column if not exists street_address text;
