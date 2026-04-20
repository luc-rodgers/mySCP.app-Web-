-- ============================================================
-- MySCP — Migration 003
-- Renames the 'operator' role to 'user' throughout.
-- Run this in the Supabase SQL Editor after migration_002.sql.
-- ============================================================

-- Update any existing 'operator' rows to 'user'
update public.employees
  set role = 'user'
  where role = 'operator';

-- Drop the old check constraint and add the new one
alter table public.employees
  drop constraint if exists employees_role_check;

alter table public.employees
  add constraint employees_role_check
  check (role in ('admin', 'user'));
