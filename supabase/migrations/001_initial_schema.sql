-- ==============================================================================
-- CV CERTO - MIGRATION 001_INITIAL_SCHEMA.SQL
-- Arquitetura: Supabase PostgreSQL com Row Level Security (RLS) estrito
-- ==============================================================================

-- 1. Extensões Essenciais
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- 2. Enums do Sistema
create type app_role as enum ('user', 'admin');

create type work_model as enum ('presencial', 'hibrido', 'remoto');

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

create type fact_type as enum (
  'experience',
  'education',
  'certification',
  'skill',
  'project',
  'language',
  'personal_info'
);

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

-- 5. Tabela de Currículos Originais (PDFs enviados para base de conhecimento)
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,                              -- Ex: "Curriculo_Modelo_01.pdf"
  storage_path text not null,                      -- Caminho no bucket curriculos_originais
  parsed_json jsonb,                               -- Extração estruturada bruta
  review_status text not null default 'pendente',  -- 'pendente' | 'aprovado'
  created_at timestamptz not null default now()
);

-- 6. Tabela do Perfil Mestre (Fatos Atômicos Reais - FONTE DA VERDADE ANTI-ALUCINAÇÃO)
create table if not exists public.master_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type fact_type not null,
  data jsonb not null,                             -- Schema validado via Zod
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
  user_id uuid references public.profiles(id) on delete cascade, -- null = template global do sistema
  code text not null,                              -- 'OFICIAL_RENATO', 'MINIMALISTA', etc.
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
  raw_description text not null,                   -- Texto puro colado pelo usuário
  analysis jsonb,                                  -- Extração de requisitos, hard/soft skills, ATS keywords
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
  match_overall numeric(5,2),                      -- Ex: 85.00
  match_technical numeric(5,2),                    -- Ex: 92.00
  match_behavioral numeric(5,2),                   -- Ex: 78.00
  salary_range_min numeric(12,2),
  salary_range_max numeric(12,2),
  salary_offered numeric(12,2),
  work_schedule text,                              -- Ex: "Segunda a Sexta, 8h às 17h"
  work_model work_model default 'hibrido',
  benefits text,
  notes text,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_applications_user_status on public.job_applications(user_id, status);
create index if not exists idx_applications_user_applied on public.job_applications(user_id, applied_at);

-- 11. Versões Geradas de Currículo (Histórico Completo por Candidatura)
create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.job_applications(id) on delete cascade,
  template_id uuid references public.templates(id),
  version int not null default 1,
  content jsonb not null,                          -- Conteúdo JSON final editado pelo usuário
  pdf_path text,                                   -- Caminho no bucket curriculos_gerados
  ats_score numeric(5,2),
  validation_report jsonb,                         -- Relatório determinístico anti-invenção
  status text not null default 'rascunho',         -- 'rascunho' | 'aprovado' | 'enviado'
  was_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_resume_versions_user on public.resume_versions(user_id, created_at desc);

-- 12. Histórico de Mudanças de Status (Auditoria de Funil do CRM)
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

-- 13. Conexões Microsoft Graph / Outlook (Criptografia / Segredo Protegido)
create table if not exists public.ms_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  ms_account_email text not null,
  refresh_token_encrypted text not null,           -- Token de atualização criptografado
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
  status text not null,                            -- 'enviado' | 'erro'
  error text,
  graph_message_id text,
  sent_at timestamptz not null default now()
);

create index if not exists idx_email_logs_user on public.email_logs(user_id, sent_at desc);

-- 15. Auditoria de Gerações por IA (Gemini Token Usage & Prompts)
create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.job_applications(id) on delete set null,
  kind text not null,                              -- 'extract' | 'analyze' | 'match' | 'generate'
  model text not null,                             -- Ex: 'gemini-2.5-flash'
  prompt_version text not null,
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10,6),
  request jsonb,
  response jsonb,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 16. TRIGGERS E AUTOMAÇÕES
-- ==============================================================================

-- A) Criação automática do Perfil ao cadastrar usuário no Supabase Auth
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
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- B) Registro automático de histórico na alteração de status da candidatura
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
-- 17. ROW LEVEL SECURITY (RLS) - ISOLAMENTO TOTAL POR USUÁRIO
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

-- Policies para PROFILES
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Policies para RESUMES
create policy "resumes_all_own" on public.resumes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies para MASTER_FACTS
create policy "master_facts_all_own" on public.master_facts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies para TEMPLATES (Lê templates públicos ou próprios)
create policy "templates_select" on public.templates for select using (user_id is null or auth.uid() = user_id);
create policy "templates_modify_own" on public.templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies para COMPANIES
create policy "companies_all_own" on public.companies for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies para RECRUITER_CONTACTS
create policy "recruiter_contacts_all_own" on public.recruiter_contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies para JOBS
create policy "jobs_all_own" on public.jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies para JOB_APPLICATIONS
create policy "job_applications_all_own" on public.job_applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies para RESUME_VERSIONS
create policy "resume_versions_all_own" on public.resume_versions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies para APPLICATION_STATUS_HISTORY
create policy "status_history_select_own" on public.application_status_history for select using (auth.uid() = user_id);

-- Policies para EMAIL_LOGS
create policy "email_logs_all_own" on public.email_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies para AI_GENERATIONS
create policy "ai_generations_all_own" on public.ai_generations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- MS_CONNECTIONS: NENHUM acesso direto pelo cliente frontend (somente service_role nas Edge Functions)
-- Isso impede que tokens OAuth2 sejam expostos no navegador.
