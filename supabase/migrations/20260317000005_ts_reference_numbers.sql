-- Migration 006: persistent, race-safe TS reference numbers
-- Format: TS-YY-NNNNN  (e.g. TS-26-00001), resets each calendar year

alter table public.time_entries
  add column if not exists reference_number text unique;

-- Function: fires BEFORE UPDATE; assigns reference_number when status
-- transitions to 'submitted' and no number has been assigned yet.
-- pg_advisory_xact_lock prevents two concurrent submissions racing to
-- the same MAX() and producing duplicate numbers.
create or replace function public.assign_ts_reference()
returns trigger language plpgsql as $$
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

drop trigger if exists tr_assign_ts_reference on public.time_entries;
create trigger tr_assign_ts_reference
  before update on public.time_entries
  for each row execute function public.assign_ts_reference();
