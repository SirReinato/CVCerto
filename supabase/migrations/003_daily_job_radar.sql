-- ==============================================================================
-- Migration 003: Radar Diário de Vagas IA (Runs, Items, Trigger updated_at, RLS)
-- Estritamente aditiva — não altera tabelas existentes
-- ==============================================================================

-- 1. Função reutilizável para atualização automática de updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Controle diário de execuções (trava atômica em America/Sao_Paulo)
create table if not exists public.daily_job_radar_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  run_date date not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  source text not null default 'adzuna_br',
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (user_id, run_date)
);

-- 3. Vagas descobertas, triagem preliminar e deduplicação por fingerprint
create table if not exists public.daily_job_radar_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  run_id uuid references public.daily_job_radar_runs(id) on delete set null,
  source text not null default 'adzuna_br',
  external_id text not null,
  fingerprint text not null,
  title text not null,
  company_name text not null,
  location_raw text not null,
  work_model work_model not null,
  is_brasilia_df boolean not null default false,
  summary_snippet text not null,
  source_url text not null,
  published_at timestamptz,
  direct_fit_score int not null check (direct_fit_score between 0 and 100),
  adaptability_score int not null check (adaptability_score between 0 and 100),
  fit_category text not null check (fit_category in ('aderente', 'adaptavel', 'baixa_aderencia')),
  matched_facts text[] not null default '{}',
  adaptability_notes text not null default '',
  triage_status text not null default 'nova' check (triage_status in ('nova', 'salva_kanban', 'descartada')),
  linked_application_id uuid references public.job_applications(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, fingerprint)
);

create index if not exists idx_daily_job_radar_items_user_triage
  on public.daily_job_radar_items(user_id, triage_status, created_at desc);

drop trigger if exists trg_daily_job_radar_items_updated_at on public.daily_job_radar_items;
create trigger trg_daily_job_radar_items_updated_at
  before update on public.daily_job_radar_items
  for each row execute procedure public.set_updated_at();

-- 4. Row Level Security (RLS)
-- daily_job_radar_runs: cliente possui apenas SELECT; escritas são exclusivas da Edge Function (service_role)
alter table public.daily_job_radar_runs enable row level security;
alter table public.daily_job_radar_items enable row level security;

drop policy if exists "daily_job_radar_runs_select_own" on public.daily_job_radar_runs;
create policy "daily_job_radar_runs_select_own"
  on public.daily_job_radar_runs
  for select
  using (auth.uid() = user_id);

drop policy if exists "daily_job_radar_items_select_own" on public.daily_job_radar_items;
create policy "daily_job_radar_items_select_own"
  on public.daily_job_radar_items
  for select
  using (auth.uid() = user_id);

drop policy if exists "daily_job_radar_items_update_own" on public.daily_job_radar_items;
create policy "daily_job_radar_items_update_own"
  on public.daily_job_radar_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
