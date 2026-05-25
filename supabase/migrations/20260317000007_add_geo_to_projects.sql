-- Migration 007: add geocoded address fields to projects
-- Populated from Google Places Autocomplete on the Add Project / Project Profile forms.
-- lat/lng are used to compute "as-the-crow-flies" distance between projects
-- for the transfer-kms allowance — no external API call needed at query time.
alter table public.projects
  add column if not exists lat numeric,
  add column if not exists lng numeric,
  add column if not exists place_id text;
