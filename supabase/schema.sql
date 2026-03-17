-- ============================================================
-- MySCP — Specialised Concrete Pumping
-- Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up the database.
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- EMPLOYEES
-- Links to Supabase Auth users via user_id
-- ────────────────────────────────────────────────────────────
create table if not exists public.employees (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  first_name  text not null,
  last_name   text not null,
  role        text not null default 'operator'   check (role in ('admin', 'operator')),
  title       text,
  email       text,
  phone       text,
  created_at  timestamptz not null default now()
);

-- One employee record per auth user
create unique index if not exists employees_user_id_idx on public.employees (user_id);

-- ────────────────────────────────────────────────────────────
-- CLIENTS
-- ────────────────────────────────────────────────────────────
create table if not exists public.clients (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  contact_name  text,
  email         text,
  phone         text,
  address       text,
  created_at    timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- PROJECTS
-- ────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  client_id   uuid references public.clients(id) on delete set null,
  status      text not null default 'pending'
                check (status in ('pending', 'active', 'on_hold', 'completed')),
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- TIMESHEETS
-- ────────────────────────────────────────────────────────────
create table if not exists public.timesheets (
  id           uuid primary key default uuid_generate_v4(),
  employee_id  uuid not null references public.employees(id) on delete cascade,
  date         date not null,
  hours        numeric(5, 2) not null default 0 check (hours >= 0),
  project_id   uuid references public.projects(id) on delete set null,
  notes        text,
  created_at   timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- EQUIPMENT
-- ────────────────────────────────────────────────────────────
create table if not exists public.equipment (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  category       text,
  serial_number  text,
  location       text,
  last_service   date,
  hours_used     numeric(10, 2) default 0,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.employees  enable row level security;
alter table public.clients    enable row level security;
alter table public.projects   enable row level security;
alter table public.timesheets enable row level security;
alter table public.equipment  enable row level security;

-- ────────────────────────────────────────────────────────────
-- Helper: is the current user an admin?
-- ────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.employees
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- ────────────────────────────────────────────────────────────
-- EMPLOYEES policies
-- ────────────────────────────────────────────────────────────

-- All authenticated users can read employee records
create policy "Employees: authenticated users can read"
  on public.employees for select
  using (auth.role() = 'authenticated');

-- Users can update their own record; admins can update any
create policy "Employees: own record or admin can update"
  on public.employees for update
  using (user_id = auth.uid() or public.is_admin());

-- Only admins can insert / delete
create policy "Employees: admin can insert"
  on public.employees for insert
  with check (public.is_admin());

create policy "Employees: admin can delete"
  on public.employees for delete
  using (public.is_admin());

-- ────────────────────────────────────────────────────────────
-- TIMESHEETS policies
-- ────────────────────────────────────────────────────────────

-- Users can only see their own timesheets; admins can see all
create policy "Timesheets: own or admin can read"
  on public.timesheets for select
  using (
    employee_id in (
      select id from public.employees where user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "Timesheets: own or admin can insert"
  on public.timesheets for insert
  with check (
    employee_id in (
      select id from public.employees where user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "Timesheets: own or admin can update"
  on public.timesheets for update
  using (
    employee_id in (
      select id from public.employees where user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "Timesheets: own or admin can delete"
  on public.timesheets for delete
  using (
    employee_id in (
      select id from public.employees where user_id = auth.uid()
    )
    or public.is_admin()
  );

-- ────────────────────────────────────────────────────────────
-- PROJECTS, CLIENTS, EQUIPMENT — all authenticated users read
-- only admins can write
-- ────────────────────────────────────────────────────────────

create policy "Projects: authenticated users can read"
  on public.projects for select
  using (auth.role() = 'authenticated');

create policy "Projects: admin can write"
  on public.projects for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Clients: authenticated users can read"
  on public.clients for select
  using (auth.role() = 'authenticated');

create policy "Clients: admin can write"
  on public.clients for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Equipment: authenticated users can read"
  on public.equipment for select
  using (auth.role() = 'authenticated');

create policy "Equipment: admin can write"
  on public.equipment for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- SAMPLE DATA (optional — remove for production)
-- ============================================================

-- insert into public.clients (name, contact_name, email, phone, address) values
--   ('Buildcorp Pty Ltd',    'James Harris',  'james@buildcorp.com.au',  '0412 000 001', '1 George St, Sydney NSW 2000'),
--   ('Pacific Constructions','Sarah Mitchell','sarah@pacific.com.au',    '0412 000 002', '22 Collins St, Melbourne VIC 3000');

-- insert into public.projects (name, client_id, status, start_date, end_date) values
--   ('Darling Harbour Pump Job', (select id from public.clients where name='Buildcorp Pty Ltd'), 'active', '2026-03-01', '2026-06-30'),
--   ('Flinders St Slab',        (select id from public.clients where name='Pacific Constructions'), 'pending', '2026-04-01', null);

-- insert into public.equipment (name, category, serial_number, location, last_service, hours_used) values
--   ('Schwing 47m Boom Pump',    'Boom Pump',   'BP-2201', 'Sydney Depot',    '2026-01-15', 4820),
--   ('Putzmeister Line Pump 30', 'Line Pump',   'LP-1905', 'Melbourne Depot', '2025-12-10', 3110),
--   ('Liebherr Mixer 8m³',       'Concrete Mixer','MX-3301','Sydney Depot',   '2026-02-20',  950);
