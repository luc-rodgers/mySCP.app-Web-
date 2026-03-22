-- Migration 005: add state column to projects table
alter table public.projects
  add column if not exists state text check (state in ('QLD', 'NSW'));
