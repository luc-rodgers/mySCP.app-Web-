-- Migration 008: feedback submissions from operators and admins.
-- Anyone signed in can create a row tied to their own employee record.
-- Admins read and delete; everyone else cannot see other people's entries.

create table if not exists public.feedback (
  id          uuid primary key default uuid_generate_v4(),
  employee_id uuid references public.employees(id) on delete set null,
  section     text not null,
  platform    text not null check (platform in ('mobile', 'desktop')),
  message     text not null check (char_length(message) > 0),
  created_at  timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

-- Users can insert a feedback row that references their own employee record.
create policy "Feedback: any signed-in user can submit" on public.feedback
  for insert
  with check (
    auth.role() = 'authenticated'
    and (
      employee_id is null
      or employee_id = (select id from public.employees where user_id = auth.uid())
    )
  );

-- Only admins can read or delete feedback.
create policy "Feedback: admins can read all" on public.feedback
  for select
  using (public.is_admin());

create policy "Feedback: admins can delete" on public.feedback
  for delete
  using (public.is_admin());
