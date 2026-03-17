-- ============================================================
-- MySCP — Migration 002
-- Adds time_entries table (JSONB) and extra columns to
-- employees, projects, equipment, and clients tables.
--
-- Run this in the Supabase SQL Editor after schema.sql.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- EMPLOYEES — extra columns
-- ────────────────────────────────────────────────────────────
alter table public.employees
  add column if not exists employment_type text default 'Casual'
    check (employment_type in ('Permanent', 'Casual')),
  add column if not exists start_date date,
  add column if not exists active_status text not null default 'active'
    check (active_status in ('active', 'retired'));

-- ────────────────────────────────────────────────────────────
-- PROJECTS — extra columns
-- ────────────────────────────────────────────────────────────
alter table public.projects
  add column if not exists address text,
  add column if not exists project_value text,
  add column if not exists hours_logged numeric(10,2) default 0;

-- ────────────────────────────────────────────────────────────
-- EQUIPMENT — extra columns
-- ────────────────────────────────────────────────────────────
alter table public.equipment
  add column if not exists equipment_type text,
  add column if not exists status text default 'Yard',
  add column if not exists next_service date,
  add column if not exists active_status text not null default 'active'
    check (active_status in ('active', 'retired'));

-- Rename existing "category" to "equipment_type" if needed
-- (already using equipment_type above, category stays for backwards compat)

-- ────────────────────────────────────────────────────────────
-- CLIENTS — extra columns
-- ────────────────────────────────────────────────────────────
alter table public.clients
  add column if not exists project_value text,
  add column if not exists active_projects int default 0;

-- ────────────────────────────────────────────────────────────
-- TIME_ENTRIES — full TimeEntry stored as JSONB
-- Replaces the simple "timesheets" table for the timesheet UI.
-- The entire TimeEntry object (projects, sub-activities, etc.)
-- is serialised into the `data` column.
-- ────────────────────────────────────────────────────────────
create table if not exists public.time_entries (
  id           uuid primary key default uuid_generate_v4(),
  employee_id  uuid not null references public.employees(id) on delete cascade,
  date         date not null,
  status       text not null default 'draft'
                 check (status in ('draft', 'submitted', 'approved')),
  data         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists time_entries_employee_date_idx
  on public.time_entries (employee_id, date desc);

-- Keep updated_at current automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists time_entries_updated_at on public.time_entries;
create trigger time_entries_updated_at
  before update on public.time_entries
  for each row execute procedure public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- TIME_ENTRIES — RLS
-- ────────────────────────────────────────────────────────────
alter table public.time_entries enable row level security;

create policy "TimeEntries: own or admin can read"
  on public.time_entries for select
  using (
    employee_id in (
      select id from public.employees where user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "TimeEntries: own or admin can insert"
  on public.time_entries for insert
  with check (
    employee_id in (
      select id from public.employees where user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "TimeEntries: own or admin can update"
  on public.time_entries for update
  using (
    employee_id in (
      select id from public.employees where user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "TimeEntries: own or admin can delete"
  on public.time_entries for delete
  using (
    employee_id in (
      select id from public.employees where user_id = auth.uid()
    )
    or public.is_admin()
  );
