-- ============================================================
-- Production schema drift check
-- ------------------------------------------------------------
-- Migrations in supabase/migrations/ are applied to production BY HAND in the
-- Supabase SQL Editor (the CLI is not used to push to prod). It's easy for a
-- migration to land on staging but be forgotten on prod.
--
-- HOW TO USE: after any deploy that includes a DB migration, paste this whole
-- query into the PRODUCTION project's SQL Editor and run it. Every row should
-- read `present = true`. Any `false` row (they sort to the top) is a migration
-- whose artifact is missing on prod — apply that migration's SQL, then re-run.
--
-- Keep this list in sync: when you add a migration, add a check for the table /
-- column / constraint / function / trigger it creates.
-- ============================================================

with checks(label, present) as (
  values
    -- 000 init
    ('000 fn is_admin',                   to_regprocedure('public.is_admin()') is not null),
    ('000 tbl clients',                   to_regclass('public.clients')    is not null),
    ('000 tbl employees',                 to_regclass('public.employees')  is not null),
    ('000 tbl equipment',                 to_regclass('public.equipment')  is not null),
    ('000 tbl projects',                  to_regclass('public.projects')   is not null),
    -- 001 columns + time_entries
    ('001 tbl time_entries',              to_regclass('public.time_entries') is not null),
    ('001 col employees.active_status',   exists(select 1 from information_schema.columns where table_schema='public' and table_name='employees' and column_name='active_status')),
    ('001 col employees.employment_type', exists(select 1 from information_schema.columns where table_schema='public' and table_name='employees' and column_name='employment_type')),
    ('001 col employees.start_date',      exists(select 1 from information_schema.columns where table_schema='public' and table_name='employees' and column_name='start_date')),
    ('001 col projects.hours_logged',     exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='hours_logged')),
    ('001 col equipment.active_status',   exists(select 1 from information_schema.columns where table_schema='public' and table_name='equipment' and column_name='active_status')),
    ('001 fn set_updated_at',             to_regprocedure('public.set_updated_at()') is not null),
    ('001 trig time_entries_updated_at',  exists(select 1 from pg_trigger where tgname='time_entries_updated_at' and not tgisinternal)),
    -- 002 role rename to 'user'
    ('002 role check allows user',        exists(select 1 from pg_constraint where conname='employees_role_check' and pg_get_constraintdef(oid) ilike '%user%')),
    -- 003 unique (employee_id,date)
    ('003 uniq time_entries(emp,date)',   exists(select 1 from pg_constraint where conname='time_entries_employee_date_unique')),
    -- 004 projects.state
    ('004 col projects.state',            exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='state')),
    -- 005 reference numbers
    ('005 col time_entries.reference_number', exists(select 1 from information_schema.columns where table_schema='public' and table_name='time_entries' and column_name='reference_number')),
    ('005 fn assign_ts_reference',        to_regprocedure('public.assign_ts_reference()') is not null),
    ('005 trig tr_assign_ts_reference',   exists(select 1 from pg_trigger where tgname='tr_assign_ts_reference' and not tgisinternal)),
    -- 006 street_address
    ('006 col projects.street_address',   exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='street_address')),
    -- 007 geo
    ('007 col projects.lat',              exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='lat')),
    ('007 col projects.lng',              exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='lng')),
    ('007 col projects.place_id',         exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='place_id')),
    -- 008 feedback
    ('008 tbl feedback',                  to_regclass('public.feedback') is not null),
    -- 009 security definer on assign_ts_reference
    ('009 assign_ts_reference SECDEF',    exists(select 1 from pg_proc where proname='assign_ts_reference' and prosecdef))
)
select label, present from checks order by present, label;
