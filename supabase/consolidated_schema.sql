-- ==============================================================================
-- CV CERTO - SCHEMA CONSOLIDADO COMPLETO (EXECUTAR NO SQL EDITOR DO SUPABASE)
-- Cria todas as 15 tabelas, RLS, Triggers, Storage Buckets e Perfil Retroativo
-- ==============================================================================

-- 1. Extensões Essenciais
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- 2. Enums do Sistema
do $$ begin
  create type app_role as enum ('user', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type work_model as enum ('presencial', 'hibrido', 'remoto');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type application_status as enum (
    'rascunho',
    'curriculo_gerado',
    'curriculo_enviado',
    'triagem_inicial',
    'contato_rh',
    'entrevista_tecnica',
    'entrevista_gestor',
    'aguardando_retorno',
    'aprovado',
    'reprovado',
    'desistencia'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type fact_type as enum (
    'experience',
    'education',
    'certification',
    'skill',
    'project',
    'language',
    'personal_info'
  );
exception when duplicate_object then null;
end $$;

-- 3. Tabela de Perfis Públicos (1:1 com auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  target_role text,
  phone text,
  city text,
  age text,
  linkedin_url text,
  github_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Tabela de Papéis (RBAC)
create table if not exists public.user_roles (
  user_id uuid references public.profiles(id) on delete cascade,
  role app_role not null default 'user',
  primary key (user_id, role)
);

-- 5. Tabela de Currículos Originais
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  storage_path text not null,
  parsed_json jsonb,
  review_status text not null default 'pendente',
  created_at timestamptz not null default now()
);

-- 6. Tabela do Perfil Mestre (Fatos Atômicos Reais)
create table if not exists public.master_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type fact_type not null,
  data jsonb not null,
  source_resume_id uuid references public.resumes(id) on delete set null,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_master_facts_user_type on public.master_facts(user_id, type);

-- 7. Tabela de Templates de Currículo
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  code text not null,
  name text not null,
  config jsonb not null default '{}',
  reference_pdf_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 8. Empresas e Contatos de Recrutadores (Mini CRM)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  website text,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.recruiter_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  name text not null,
  email text,
  phone text,
  linkedin_url text,
  notes text,
  created_at timestamptz not null default now()
);

-- 9. Vagas Cadastradas (Texto da Vaga + Análise Gemini)
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  title text not null,
  source_url text,
  raw_description text not null,
  analysis jsonb,
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_jobs_user_open on public.jobs(user_id, is_open);
create index if not exists idx_jobs_title_trgm on public.jobs using gin (title gin_trgm_ops);

-- 10. Candidaturas (Processo Seletivo do Mini CRM)
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  recruiter_id uuid references public.recruiter_contacts(id) on delete set null,
  status application_status not null default 'rascunho',
  match_overall numeric(5,2),
  match_technical numeric(5,2),
  match_behavioral numeric(5,2),
  salary_range_min numeric(12,2),
  salary_range_max numeric(12,2),
  salary_offered numeric(12,2),
  work_schedule text,
  work_model work_model default 'hibrido',
  benefits text,
  notes text,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_applications_user_status on public.job_applications(user_id, status);
create index if not exists idx_applications_user_applied on public.job_applications(user_id, applied_at);

-- 11. Versões Geradas de Currículo
create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.job_applications(id) on delete cascade,
  template_id uuid references public.templates(id),
  version int not null default 1,
  content jsonb not null,
  pdf_path text,
  ats_score numeric(5,2),
  validation_report jsonb,
  status text not null default 'rascunho',
  was_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_resume_versions_user on public.resume_versions(user_id, created_at desc);

-- 12. Histórico de Mudanças de Status (CRM)
create table if not exists public.application_status_history (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.job_applications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  from_status application_status,
  to_status application_status not null,
  note text,
  changed_at timestamptz not null default now()
);

create index if not exists idx_status_history_app on public.application_status_history(application_id, changed_at);

-- 13. Conexões Microsoft Graph / Outlook
create table if not exists public.ms_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  ms_account_email text not null,
  refresh_token_encrypted text not null,
  scopes text[] not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 14. Log de E-mails Enviados pelo Outlook
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.job_applications(id) on delete set null,
  resume_version_id uuid references public.resume_versions(id) on delete set null,
  to_email text not null,
  subject text not null,
  body text not null,
  status text not null,
  error text,
  graph_message_id text,
  sent_at timestamptz not null default now()
);

create index if not exists idx_email_logs_user on public.email_logs(user_id, sent_at desc);

-- 15. Auditoria de Gerações por IA
create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.job_applications(id) on delete set null,
  kind text not null,
  model text not null,
  prompt_version text not null,
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10,6),
  request jsonb,
  response jsonb,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 16. INSERIR PERFIS RETROATIVOS PARA CONTAS JÁ CRIADAS
-- ==============================================================================
insert into public.profiles (id, full_name, target_role, phone, city, age)
select 
  id,
  coalesce(raw_user_meta_data->>'full_name', 'Renato de França Lima'),
  'ANALISTA DE SUPORTE | MICROSOFT 365 | AZURE',
  '(61) 9935-3163',
  'SAMAMBAIA, DF.',
  '28 ANOS'
from auth.users
on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
select id, 'user'::app_role
from auth.users
on conflict do nothing;

-- ==============================================================================
-- 17. TRIGGERS E AUTOMAÇÕES
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, target_role, phone, city, age)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Renato de França Lima'),
    'ANALISTA DE SUPORTE | MICROSOFT 365 | AZURE',
    '(61) 9935-3163',
    'SAMAMBAIA, DF.',
    '28 ANOS'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger de Histórico de Mudança de Status
create or replace function public.handle_application_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (old.status is distinct from new.status) then
    insert into public.application_status_history (
      application_id,
      user_id,
      from_status,
      to_status,
      note
    ) values (
      new.id,
      new.user_id,
      old.status,
      new.status,
      'Transição de status da candidatura'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_application_status_changed on public.job_applications;
create trigger on_application_status_changed
  after update on public.job_applications
  for each row execute procedure public.handle_application_status_change();

-- ==============================================================================
-- 18. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.resumes enable row level security;
alter table public.master_facts enable row level security;
alter table public.templates enable row level security;
alter table public.companies enable row level security;
alter table public.recruiter_contacts enable row level security;
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.resume_versions enable row level security;
alter table public.application_status_history enable row level security;
alter table public.ms_connections enable row level security;
alter table public.email_logs enable row level security;
alter table public.ai_generations enable row level security;

-- Policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "resumes_all_own" on public.resumes;
create policy "resumes_all_own" on public.resumes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "master_facts_all_own" on public.master_facts;
create policy "master_facts_all_own" on public.master_facts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "templates_select" on public.templates;
create policy "templates_select" on public.templates for select using (user_id is null or auth.uid() = user_id);

drop policy if exists "templates_modify_own" on public.templates;
create policy "templates_modify_own" on public.templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "companies_all_own" on public.companies;
create policy "companies_all_own" on public.companies for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "recruiter_contacts_all_own" on public.recruiter_contacts;
create policy "recruiter_contacts_all_own" on public.recruiter_contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "jobs_all_own" on public.jobs;
create policy "jobs_all_own" on public.jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "job_applications_all_own" on public.job_applications;
create policy "job_applications_all_own" on public.job_applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "resume_versions_all_own" on public.resume_versions;
create policy "resume_versions_all_own" on public.resume_versions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "status_history_select_own" on public.application_status_history;
create policy "status_history_select_own" on public.application_status_history for select using (auth.uid() = user_id);

drop policy if exists "email_logs_all_own" on public.email_logs;
create policy "email_logs_all_own" on public.email_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ai_generations_all_own" on public.ai_generations;
create policy "ai_generations_all_own" on public.ai_generations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==============================================================================
-- 19. BUCKETS DE ARMAZENAMENTO (STORAGE)
-- ==============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('curriculos_originais', 'curriculos_originais', false, 10485760, array['application/pdf']),
  ('curriculos_gerados', 'curriculos_gerados', false, 10485760, array['application/pdf']),
  ('templates_pdf', 'templates_pdf', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "originais_owner_access" on storage.objects;
create policy "originais_owner_access" on storage.objects
for all using (
  bucket_id = 'curriculos_originais' 
  and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'curriculos_originais' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "gerados_owner_access" on storage.objects;
create policy "gerados_owner_access" on storage.objects
for all using (
  bucket_id = 'curriculos_gerados' 
  and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'curriculos_gerados' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "templates_pdf_read" on storage.objects;
create policy "templates_pdf_read" on storage.objects
for select using (
  bucket_id = 'templates_pdf' 
  and auth.role() = 'authenticated'
);
