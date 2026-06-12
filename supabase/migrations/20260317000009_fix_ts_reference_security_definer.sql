-- Migration 010: fix timesheet submission for non-admin users.
--
-- BUG: assign_ts_reference() ran with the *caller's* privileges, so its
-- internal `select max(reference_number) ... from time_entries` was filtered
-- by RLS. A non-admin user can only see their own rows, so MAX() came back
-- NULL and the trigger generated TS-YY-00001 every time — colliding with an
-- existing reference_number and failing the submit with a 23505 unique
-- violation. The entry then stayed stuck on 'draft'. Admins were unaffected
-- because the RLS SELECT policy lets is_admin() see every row.
--
-- FIX: run the function as SECURITY DEFINER so the MAX() query sees all rows
-- regardless of who is submitting. The function only reads time_entries to
-- compute the next number; it does not depend on auth.uid().

create or replace function public.assign_ts_reference()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  year_short text;
  next_num   int;
begin
  if new.status = 'submitted'
     and old.status is distinct from 'submitted'
     and new.reference_number is null
  then
    -- Serialize within the transaction so MAX()+1 is safe
    perform pg_advisory_xact_lock(hashtext('ts_reference_number_seq'));

    year_short := to_char(now() at time zone 'Australia/Brisbane', 'YY');

    select coalesce(
      max(cast(split_part(reference_number, '-', 3) as int)), 0
    ) + 1
    into next_num
    from public.time_entries
    where reference_number like 'TS-' || year_short || '-%';

    new.reference_number :=
      'TS-' || year_short || '-' || lpad(next_num::text, 5, '0');
  end if;

  return new;
end;
$$;

-- Trigger definition is unchanged; recreate defensively in case it was dropped.
drop trigger if exists tr_assign_ts_reference on public.time_entries;
create trigger tr_assign_ts_reference
  before update on public.time_entries
  for each row execute function public.assign_ts_reference();
