-- Migration 004: prevent duplicate time_entries for same employee + date
-- First, remove any existing duplicates by keeping the most recently updated row
delete from public.time_entries
where id not in (
  select distinct on (employee_id, date) id
  from public.time_entries
  order by employee_id, date, updated_at desc nulls last
);

-- Then add the unique constraint to prevent it happening again
alter table public.time_entries
  add constraint time_entries_employee_date_unique
  unique (employee_id, date);
