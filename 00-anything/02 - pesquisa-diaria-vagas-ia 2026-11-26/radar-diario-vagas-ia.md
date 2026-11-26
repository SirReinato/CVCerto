# Radar Diário de Vagas IA (`JobPortalsView`)

* **Author:** Renato França
* **Status:** Approved for Implementation
* **Date:** 2026-11-26

---

## Overview

O Radar Diário de Vagas IA adiciona à aba de Portais (`JobPortalsView`) do CVCerto uma rotina de descoberta diária de oportunidades focadas em Inteligência Artificial e Desenvolvimento com IA. Na primeira abertura da aba em cada dia civil (fuso `America/Sao_Paulo`), o sistema busca novas vagas em português (Brasil) — priorizando trabalho remoto e aceitando formato híbrido ou presencial apenas em Brasília-DF — utilizando exclusivamente camadas gratuitas.

Cada vaga encontrada é deduplicada contra o histórico do usuário no Supabase e recebe uma triagem preliminar em duas dimensões ancoradas no Perfil Mestre ("Base da Verdade"): **Aderência Direta** e **Adaptabilidade**. A partir dessa triagem, o usuário decide em um clique se descarta a vaga, salva no Kanban como rascunho ou abre o `JobAnalyzer` pré-preenchido para gerar o currículo adaptado.

## The Problem

Hoje a aba `JobPortalsView.tsx` funciona apenas como um diretório estático de links externos (configurados originalmente para "Suporte TI N2/N3" e "Analista de Suporte") que abre janelas laterais manuais via `openSideBrowser` (`src/shared/utils/popupLauncher.ts`). Esse fluxo gera quatro atritos diários para a busca de vagas em IA e Desenvolvimento com IA:

1. **Busca manual repetitiva e dispersa:** O usuário precisa abrir múltiplos portais todos os dias, refazer filtros de idioma/localização (remoto ou Brasília-DF) e revisar novamente vagas que já viu ou descartou em dias anteriores.
2. **Desalinhamento com o foco atual:** Os atalhos fixos atuais (`searchUrl` em `PORTALS`) ainda apontam para Suporte TI e não cruzam as vagas encontradas com o Perfil Mestre do candidato.
3. **Custo cognitivo na triagem inicial:** Sem uma separação prévia entre vagas com aderência direta e vagas onde há espaço real de adaptação (sem inventar fatos fora da Base da Verdade), o usuário gasta tempo abrindo descrições irrelevantes antes de levar uma oportunidade ao `JobAnalyzer` ou ao Kanban.
4. **Restrições de SPA e camada gratuita:** O CVCerto é uma SPA sem orçamento para APIs pagas de scraping ou busca. Qualquer automação precisa operar dentro dos limites gratuitos de execução, manter credenciais fora do navegador e evitar links alucinados por LLM.

## Goals

* Executar no máximo 1 atualização automática por dia civil (`America/Sao_Paulo`) por usuário ao abrir `JobPortalsView`, sem bloquear a visualização imediata dos portais e do histórico já salvo.
* Operar 100% em camadas gratuitas (API gratuita de vagas + Google Gemini + Supabase Free Tier) com todas as chaves mantidas no servidor (Supabase Edge Function autenticada por JWT).
* Filtrar estritamente vagas de IA / Desenvolvimento com IA em português (Brasil), com prioridade para remoto e aceitando híbrido ou presencial exclusivamente em Brasília-DF.
* Persistir o histórico diário e o status de triagem de cada vaga (`nova`, `salva_kanban`, `descartada`) no Supabase com RLS por usuário, impedindo que vagas já vistas, descartadas ou já cadastradas no CRM reapareçam nos dias seguintes.
* Classificar cada vaga em duas dimensões ancoradas exclusivamente nos fatos reais do Perfil Mestre: **Aderência Direta** e **Adaptabilidade**, deixando explícito que se trata de uma triagem preliminar sobre o resumo retornado pela API.
* Permitir ações diretas de 1 clique em cada vaga: descartar, salvar no Kanban (`ApplicationsKanban`) como `rascunho` ou enviar pré-preenchida para análise profunda no `JobAnalyzer`.
* Atualizar os 5 atalhos `searchUrl` existentes em `JobPortalsView.tsx` para foco em IA / Desenvolvimento com IA e isolar a interface do Radar em subcomponente dedicado seguindo 100% das convenções do `AGENTS.md` (zero CSS em `src/`, styled-components com sufixo `Stl` e consumo de `theme.ts`).

## Non-Goals

* Scraping de portais protegidos contra automação (LinkedIn, Gupy, Glassdoor, Catho, InfoJobs).
* Candidatura automática (auto-apply) em portais externos.
* Geração automática de currículo PDF/ATS (Applicant Tracking System) ou dossiê completo de entrevista para todas as vagas descobertas (continua sob demanda no `JobAnalyzer`).
* Agendamento em segundo plano com o app fechado (`pg_cron` ou cron externo), paginação manual de múltiplos lotes (`next_batch`) e notificações por e-mail ou push nesta fase.
* Vagas em inglês ou vagas presenciais/híbridas fora de Brasília-DF.

## Open Questions

Nenhuma questão aberta. Todas as decisões arquiteturais e achados de revisão EGM foram resolvidos e incorporados abaixo.

## Critical User Journeys (CUJs)

### CUJ 1: Primeira abertura da aba no dia (atualização automática não-bloqueante)

* **Given**: O usuário está autenticado no CVCerto e ainda não houve execução concluída do Radar na data civil atual (`America/Sao_Paulo`).
* **When**: O usuário acessa a aba `JobPortalsView`.
* **Then**:
  * A aba renderiza imediatamente os portais e as vagas persistidas de dias anteriores (sem travar a tela) e exibe um indicador discreto de busca em andamento.
  * Se `public.master_facts` do usuário estiver vazio, a Edge Function retorna `status: 'missing_profile'` sem marcar o dia como `completed` e a UI exibe CTA direcionando o usuário a salvar o Perfil Mestre antes de ativar o Radar.
  * Com Perfil Mestre presente, a Edge Function coleta, filtra, deduplica e classifica até **12 vagas novas** em 1 chamada ao Gemini. Se 0 vagas novas restarem após a filtragem/deduplicação, a UI exibe estado vazio claro informando que não houve novas vagas aderentes hoje, mantendo o histórico anterior visível.

### CUJ 2: Triagem de vaga e encaminhamento ao Kanban ou `JobAnalyzer`

* **Given**: Existem vagas ativas (`triage_status != 'descartada'`) listadas no Radar com indicação de modalidade (Remoto ou Híbrido/Presencial em Brasília-DF), selo de triagem preliminar e pontuações de **Aderência Direta** e **Adaptabilidade** com justificativas baseadas no Perfil Mestre.
* **When**: O usuário clica em "Descartar", "Salvar no Kanban" ou "Analisar no JobAnalyzer".
* **Then**:
  * Em **Descartar**, a vaga muda para `descartada`, sai da fila ativa e não reaparece em buscas futuras.
  * Em **Salvar no Kanban**, o botão fica travado durante a operação (`savingItemIds`), `Home.tsx` cria a candidatura com `status: 'rascunho'` e `work_model` inferido, recarrega `listApplications(user.id)` para sincronizar imediatamente o Kanban, e `DailyAiJobsRadar` vincula `linked_application_id` mudando `triage_status` para `salva_kanban`.
  * Em **Analisar no JobAnalyzer**, o workspace navega para a aba `analyze` passando `initialDraft` (título, empresa, link, resumo preliminar e `workModel`), consumido uma única vez via `onDraftConsumed` sem criar card duplicado no Kanban nem alterar `triage_status`.

### CUJ 3: Reabertura no mesmo dia e recuperação de falha

* **Given**: O usuário já abriu a aba hoje (rodada concluída, em andamento ou falhada por indisponibilidade temporária da API gratuita).
* **When**: O usuário reabre `JobPortalsView` no mesmo dia civil (`America/Sao_Paulo`) ou recarrega a página em duas abas simultâneas.
* **Then**: Se a rodada do dia já concluiu (`completed`), está em andamento (`running` < 5 min) ou falhou (`failed`), o modo `auto` **não** dispara novas chamadas externas e a UI exibe os dados salvos no Supabase. Quando `status = 'failed'`, a UI exibe aviso claro com o botão manual **"Tentar novamente hoje"** (`mode: 'retry'`), que adquire trava atômica condicional antes de reexecutar.

## Technical Plan (Architecture)

### Decisões Arquiteturais Fechadas

* **Q1 (Volume e Cota — Simplificação Via A):** Teto automático de até **12 vagas novas classificadas por dia em 1 única chamada ao Gemini**, sem paginação manual (`next_batch`, `next_page`, `has_more` removidos do MVP), eliminando falha parcial entre lotes, perda de cursor e risco de timeout/429 na camada gratuita.
* **Q2 (Fontes no MVP):** Apenas **Adzuna BR** ativa no MVP, isolada atrás de uma interface `JobSourceAdapter` na Edge Function para permitir plugar futuras APIs gratuitas (como Jooble BR) sem alterar banco, deduplicação ou UI.
* **Q3 (Layout em `JobPortalsView`):** Componente dedicado `DailyAiJobsRadar.tsx` renderizado como **seção no topo de `JobPortalsView.tsx`** acima dos portais existentes (página única rolável), com controle de recolher/expandir.
* **Q4 (Falhas e Edição do Perfil):** Botão manual **"Tentar novamente hoje"** (`mode: 'retry'`) liberado apenas quando a rodada do dia encerrar com `status = 'failed'`. Alterações no Perfil Mestre passam a valer a partir da rodada do dia seguinte para preservar a cota gratuita.
* **Q5 (Integração com Kanban e `JobAnalyzer`):** **"Salvar no Kanban"** cria a candidatura com `status = 'rascunho'` e `work_model` inferido e sincroniza `applications` em `Home.tsx`; **"Analisar no JobAnalyzer"** é navegação pura para a aba `analyze` com `initialDraft` consumido uma única vez (preservando `workModel` ao gerar currículo).
* **Q6 (Transparência de Triagem):** Cada card do Radar exibe selo explícito informando que os scores são uma **triagem preliminar baseada no resumo retornado pela API**, orientando o usuário a colar a descrição completa no `JobAnalyzer`.

### Arquitetura e Fluxo de Dados

```text
[JobPortalsView.tsx] (atualiza 5 searchUrl de PORTALS para IA)
  └─ [DailyAiJobsRadar.tsx] (styled-components *Stl + theme.ts, recolhível)
        ├─ 1. Leitura imediata (cache): DailyJobRadarRepository -> Supabase (RLS)
        ├─ 2. Disparo em background (1x/dia): invoke("daily-ai-jobs-radar", { mode: "auto" })
        │       │
        │       ▼
        │  [Edge Function: supabase/functions/daily-ai-jobs-radar/index.ts]
        │    ├─ Valida JWT (createClient ANON + auth.getUser) -> user_id confiável
        │    ├─ Escritas administrativas via SUPABASE_SERVICE_ROLE_KEY (sempre filtrando user_id)
        │    ├─ Guard master_facts: se vazio -> retorna { status: "missing_profile" } sem travar o dia
        │    ├─ Calcula run_date em America/Sao_Paulo (YYYY-MM-DD)
        │    ├─ Trava atômica em daily_job_radar_runs:
        │    │    • auto: INSERT ... ON CONFLICT (user_id, run_date) DO NOTHING
        │    │    • retry / running órfão (> 5 min): UPDATE ... WHERE status = ... RETURNING id
        │    ├─ JobSourceAdapter -> AdzunaBrAdapter (what_or, sort_by=date, max_days_old=7, results_per_page=50, timeout 8000ms)
        │    ├─ Estágio 1 (0 tokens): PT-BR + (remoto > hibrido > presencial | Brasília-DF) + dedup em memória + dedup contra daily_job_radar_items e public.jobs (join companies)
        │    ├─ Estágio 2 (Gemini): 1 lote de até 12 vagas + Zod + Base da Verdade + fit_category determinístico
        │    └─ Persiste daily_job_radar_items (ON CONFLICT (user_id, fingerprint) DO NOTHING) + marca run completed
        │
        └─ 3. Ações do usuário (1 clique):
             ├─ Descartar -> update triage_status = 'descartada'
             ├─ Salvar no Kanban -> Home.tsx onSaveRadarToKanban (status: 'rascunho' + reload listApplications) -> linkApplication
             └─ Analisar no JobAnalyzer -> Home.tsx (tab 'analyze' + initialDraft consume-once com workModel)
```

### Modelo de Dados (Supabase Migration `003_daily_job_radar.sql`)

* **Função de trigger:** Criar `public.set_updated_at()` (`returns trigger`, atualizando `new.updated_at = now()`) na migration `003_daily_job_radar.sql` e espelhar em `supabase/consolidated_schema.sql`.
* **Políticas RLS:**
  * `public.daily_job_radar_runs`: RLS habilitado com política **apenas `SELECT`** (`auth.uid() = user_id`) para o cliente; inserções/atualizações são exclusivas da Edge Function via `SUPABASE_SERVICE_ROLE_KEY`, impedindo reset manual da trava diária pelo navegador.
  * `public.daily_job_radar_items`: RLS habilitado com políticas **`SELECT` e `UPDATE`** (`auth.uid() = user_id`) para o cliente; inserções são exclusivas da Edge Function.

1. **`public.daily_job_radar_runs`** (controle diário e trava contra concorrência):
   * `id` (`uuid`, PK)
   * `user_id` (`uuid`, FK -> `public.profiles(id)` on delete cascade)
   * `run_date` (`date`, calculado no fuso `America/Sao_Paulo`)
   * `status` (`text`: `'running' | 'completed' | 'failed'`)
   * `source` (`text`, default `'adzuna_br'`)
   * `error_message` (`text`, nullable)
   * `started_at` (`timestamptz`, default `now()`), `finished_at` (`timestamptz`, nullable)
   * Constraint: `UNIQUE (user_id, run_date)`

2. **`public.daily_job_radar_items`** (vagas descobertas, triagem e deduplicação):
   * `id` (`uuid`, PK)
   * `user_id` (`uuid`, FK -> `public.profiles(id)` on delete cascade)
   * `run_id` (`uuid`, FK -> `public.daily_job_radar_runs(id)` on delete set null)
   * `source` (`text`, ex.: `'adzuna_br'`)
   * `external_id` (`text`, ID da vaga na API de origem)
   * `fingerprint` (`text`, hash SHA-256 de `normalize(title) | normalize(company_or_external_id) | work_model`)
   * `title` (`text`), `company_name` (`text`), `location_raw` (`text`)
   * `work_model` (`work_model` enum existente: `'presencial' | 'hibrido' | 'remoto'`)
   * `is_brasilia_df` (`boolean`, default `false`)
   * `summary_snippet` (`text`, resumo retornado pela API)
   * `source_url` (`text`)
   * `published_at` (`timestamptz`, nullable)
   * `direct_fit_score` (`int`, 0–100)
   * `adaptability_score` (`int`, 0–100)
   * `fit_category` (`text`: `'aderente' | 'adaptavel' | 'baixa_aderencia'`, calculado deterministicamente)
   * `matched_facts` (`text[]`, fatos reais do Perfil Mestre citados pela IA)
   * `adaptability_notes` (`text`, justificativa curta sem alucinação)
   * `triage_status` (`text`: `'nova' | 'salva_kanban' | 'descartada'`, default `'nova'`)
   * `linked_application_id` (`uuid`, nullable, FK -> `public.job_applications(id)` on delete set null)
   * `created_at` (`timestamptz`, default `now()`), `updated_at` (`timestamptz`, default `now()`, trigger `set_updated_at`)
   * Constraint única: `UNIQUE (user_id, fingerprint)`
   * Índice: `(user_id, triage_status, created_at desc)`

### Edge Function (`supabase/functions/daily-ai-jobs-radar/index.ts`)

* **Autenticação e Clientes Supabase:**
  * Exige header `Authorization: Bearer <jwt>`. Valida o token usando `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` via `auth.getUser(token)`; retorna `401` se inválido.
  * Instancia client administrativo com `SUPABASE_SERVICE_ROLE_KEY` para operar em `daily_job_radar_runs`, `daily_job_radar_items`, `master_facts` e `jobs`, filtrando estritamente pelo `user_id` extraído do JWT.
* **Contrato HTTP:**
  * Request: `POST` com body `{ mode: "auto" | "retry" }`.
  * Response (`200`): `{ status: "completed" | "already_ran" | "running" | "failed" | "missing_profile", run: DailyRadarRun | null, items: DailyRadarItem[], error?: string }`.
  * Códigos de erro: `401` (JWT inválido/ausente), `400` (mode inválido), `409` (execução já em andamento em `retry`), `429`/`500` (erro da API externa ou Gemini — grava `status = 'failed'` e `error_message` na run).
* **Guard de Perfil Mestre e Trava Atômica:**
  1. Antes de travar a execução, consulta `public.master_facts` ativos do usuário. Se retornar 0 registros, devolve `200` com `{ status: "missing_profile", run: null, items: [] }` sem inserir/alterar `daily_job_radar_runs`.
  2. Em `mode: 'auto'`: executa `INSERT INTO daily_job_radar_runs ... ON CONFLICT (user_id, run_date) DO NOTHING RETURNING id`. Se não inserir, consulta a linha de hoje: se `completed`, `failed`, ou `running` (< 5 min), retorna imediatamente o cache salvo sem chamar APIs externas; se `running` > 5 min (órfão), reassume via `UPDATE ... WHERE status = 'running' AND started_at < now() - interval '5 minutes' RETURNING id`.
  3. Em `mode: 'retry'`: executa `UPDATE daily_job_radar_runs SET status = 'running', started_at = now(), error_message = null WHERE user_id = $1 AND run_date = $2 AND status = 'failed' RETURNING id`. Se nenhuma linha for atualizada, retorna `409`.
* **Camada de Coleta (`JobSourceAdapter`):**
  * Interface comum `fetchJobs({ keywords, page, resultsPerPage }) => NormalizedCandidateJob[]`.
  * `AdzunaBrAdapter` consulta `https://api.adzuna.com/v1/api/jobs/br/search/1` com `what_or` (termos de IA / Desenvolvedor IA / LLM / Agentes IA), `sort_by=date`, `max_days_old=7`, `results_per_page=50` e timeout `8000ms`, usando `ADZUNA_APP_ID` e `ADZUNA_APP_KEY` dos Supabase Secrets.
* **Estágio 1 — Pré-filtro Determinístico (0 tokens):**
  1. Filtra idioma PT-BR (avaliando `summary_snippet` + `title`, aceitando título em inglês quando a descrição estiver em português).
  2. Classifica `work_model` com precedência `remoto > hibrido > presencial` e detecta `is_brasilia_df`. Descarta vagas híbridas/presenciais (ou de modalidade indeterminada) fora de Brasília-DF.
  3. Valida `source_url` exigindo protocolo `http:` ou `https:`.
  4. Gera `fingerprint` normalizado, deduplica em memória por `fingerprint` e remove candidatos já presentes em `daily_job_radar_items` (`fingerprint`) ou em `public.jobs` (query `select('title, source_url, companies(name)')` comparando `normalizeUrl(source_url)` OU `normalize(title) | normalize(companies.name)`).
* **Estágio 2 — Classificação em Lote Único no Gemini:**
  1. Seleciona até **12 candidatos novos** e envia em **1 única chamada ao Gemini** (usando o mesmo padrão de modelo com fallback de `supabase/functions/analyze-job/index.ts`), com os fatos ativos de `public.master_facts` como contexto da **Base da Verdade**.
  2. Valida o JSON de retorno com **Zod** (`directFitScore`, `adaptabilityScore`, `matchedFacts`, `adaptabilityNotes`).
  3. Deriva `fit_category` deterministicamente no código: `directFitScore >= 70 -> 'aderente'`; senão `adaptabilityScore >= 60 -> 'adaptavel'`; senão `'baixa_aderencia'`.
  4. Persiste os resultados em `daily_job_radar_items` via `INSERT ... ON CONFLICT (user_id, fingerprint) DO NOTHING` e atualiza `daily_job_radar_runs` para `status = 'completed'`, `finished_at = now()`. *(Gravação em `public.ai_generations` removida do MVP por não ser utilizada em nenhuma outra função ou tela do projeto).*

### Integração no Frontend

* **`src/shared/types/database.types.ts` e `src/domain/entities/DailyJobRadar.ts`:** Os unions de coluna (`DailyRadarRunStatus`, `RadarFitCategory`, `RadarTriageStatus`) e as tabelas são exportados em `database.types.ts` e reutilizados pelas interfaces TypeScript de `DailyJobRadar.ts` (mantendo validação Zod estritamente na Edge Function).
* **`DailyJobRadarRepository.ts` (`src/infrastructure/supabase/`):** Encapsula `listActiveItems(userId)` (retorna itens com `triage_status != 'descartada'`), `getTodayRun(userId)`, `triggerDailyRadar(mode: 'auto' | 'retry')`, `updateTriageStatus(itemId, status)` e `linkApplication(itemId, applicationId)`.
* **`DailyAiJobsRadar.tsx` (`src/presentation/components/`):** Subcomponente isolado no topo de `JobPortalsView.tsx` (recolhível, 100% styled-components com sufixo `Stl` consumindo `theme.ts`). Renderiza cache imediatamente, dispara `mode: 'auto'` em background, exibe selo de triagem preliminar, estado vazio (0 vagas novas), aviso de `missing_profile`, filtros rápidos (`Todas`, `Aderentes`, `Adaptáveis`, `Remoto`, `Brasília-DF`), trava por card (`savingItemIds`) contra clique duplo e botão `"Tentar novamente hoje"` quando `status = 'failed'`.
* **`src/shared/utils/popupLauncher.ts`:** Endurece `openSideBrowser` para validar que a URL resultante possui protocolo `http:` ou `https:` (rejeitando `javascript:` e esquemas inseguros).
* **`JobApplicationsRepository.ts`:** Adiciona `status?: ApplicationStatus` em `CreateApplicationParams` (mantendo `"curriculo_gerado"` como padrão para chamadas existentes e usando `"rascunho"` para vagas vindas do Radar).
* **`Home.tsx`, `JobPortalsView.tsx` e `JobAnalyzer.tsx`:**
  * `Home.tsx` expõe `onSaveRadarToKanban(item: DailyRadarItem): Promise<string>`, que cria a candidatura com `status: "rascunho"` e `workModel: item.work_model`, recarrega `listApplications(user.id)` para sincronizar o estado `applications` e retorna o `applicationId` criado para `DailyAiJobsRadar` chamar `linkApplication`.
  * `Home.tsx` mantém estado `analyzerDraft` (`RadarJobDraft`, incluindo `workModel`), passado como `initialDraft` para `JobAnalyzer.tsx` junto com `onDraftConsumed` (consumo único no `useEffect`, limpando `analyzerDraft` após preencher o formulário e repassando `workModel` em `onGenerateResume`).

## Alternatives Considered

### Alternative A: Gemini com Google Search Grounding como fonte primária de coleta

* **Pros:** Descobre vagas diretamente em portais corporativos sem exigir cadastro em API externa de vagas.
* **Cons:** Cota gratuita restrita e instável para grounding; retorno frequente de páginas genéricas de agregadores ou vagas já encerradas; ausência de `external_id` estável para deduplicação determinística.
* **Reason for Rejection:** Rejected by author: cota gratuita instável para grounding e risco elevado de links expirados ou sem chave determinística de deduplicação, optando por API oficial gratuita (`Adzuna BR`) atrás de `JobSourceAdapter`.

### Alternative B: Múltiplos lotes encadeados ou paginação manual (`next_batch` / 24 vagas em 3 lotes)

* **Pros:** Permite classificar mais de 12 vagas por dia quando houver picos de publicação.
* **Cons:** Em chamada única estoura o wall-clock da Edge Function gratuita e trunca o JSON; em múltiplos lotes exige cursor persistido (`next_page`/`has_more`), trava condicional multi-modo, reconsulta de página para não descartar excedentes e tratamento complexo de falha parcial.
* **Reason for Rejection:** Rejected by author: simplificado no MVP (Via A) para 1 lote único de até 12 vagas novas/dia em 1 chamada ao Gemini, eliminando falha parcial entre lotes e risco de erro 429 na camada gratuita.

### Alternative C: Agendamento em segundo plano via `pg_cron` + `pg_net` no Supabase

* **Pros:** Abertura instantânea da aba `JobPortalsView` sem espera de atualização na primeira visita do dia.
* **Cons:** Consome cota de API externa e tokens do Gemini todos os dias mesmo quando o usuário não abre a aplicação; exige setup manual de Vault (cofre de segredos do Supabase) em SQL.
* **Reason for Rejection:** Rejected by author: o requisito é disparar a atualização 1x por dia apenas ao abrir a aba (`on-open`), preservando cota em dias inativos.

### Alternative D: Múltiplas APIs gratuitas (Adzuna BR + Jooble BR) já no MVP

* **Pros:** Maior cobertura de vagas de IA e Brasília-DF desde a primeira entrega, reduzindo dias com poucos resultados.
* **Cons:** Exige cadastro e manutenção de duas chaves externas nos Supabase Secrets, dobra as chamadas de rede e a latência da Edge Function e exige tratamento de falhas parciais entre fontes no MVP.
* **Reason for Rejection:** Rejected by author: iniciar com `AdzunaBrAdapter` isolado atrás de `JobSourceAdapter`, permitindo plugar Jooble BR ou outras fontes gratuitas em fase futura sem alterar schema ou UI.

### Alternative E: Sub-abas internas em `JobPortalsView` ou nova aba dedicada no `WorkspaceLayout`

* **Pros:** Separa visualmente descoberta diária de acompanhamento de portais sem aumentar a rolagem vertical.
* **Cons:** Sub-abas exigem um clique adicional para acessar links rápidos dos portais; uma nova aba aumenta os itens na navegação principal do workspace.
* **Reason for Rejection:** Rejected by author: preferência por página única em `JobPortalsView` com seção recolhível do Radar no topo acima dos portais existentes.

---

## Non-Functional Requirements

* **Security & Privacy:**
  * A Edge Function `daily-ai-jobs-radar` exige `Authorization: Bearer <jwt>`, valida o usuário via `supabase.auth.getUser()` e deriva `user_id` exclusivamente do token antes de realizar escritas administrativas via `SUPABASE_SERVICE_ROLE_KEY`.
  * Credenciais `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `GEMINI_API_KEY` e `SUPABASE_SERVICE_ROLE_KEY` residem exclusivamente nos Supabase Edge Secrets (nunca em `src/` ou em variáveis `VITE_`).
  * `daily_job_radar_runs` permite apenas `SELECT` pelo cliente sob RLS (`auth.uid() = user_id`); `daily_job_radar_items` permite `SELECT` e `UPDATE` sob RLS.
  * Links externos são validados para aceitar apenas protocolos `https:` ou `http:` tanto na Edge Function (`deterministicFilter.ts`) quanto em `openSideBrowser` (`src/shared/utils/popupLauncher.ts`), prevenindo XSS via `javascript:`.
* **Performance & Latency:**
  * Carregamento inicial não-bloqueante: os portais e o histórico salvo no Supabase renderizam imediatamente enquanto a atualização diária (`mode: 'auto'`) roda em segundo plano (~5–10s para 1 chamada única ao Gemini).
  * O pré-filtro determinístico (Estágio 1) elimina vagas fora de PT-BR, fora de remoto/Brasília-DF e duplicadas com custo zero de tokens antes de acionar o Gemini.
* **Rollout & Rollback:**
  * Migration `003_daily_job_radar.sql` é estritamente aditiva (não altera nem remove colunas das 15 tabelas existentes, elevando o schema para 17 tabelas).
  * `JobApplicationsRepository.createApplication` mantém `"curriculo_gerado"` como padrão no novo parâmetro opcional `status`, garantindo 100% de retrocompatibilidade com fluxos existentes.
  * Rollback imediato possível removendo `<DailyAiJobsRadar />` de `JobPortalsView.tsx` e desabilitando a Edge Function sem impactar o CRM ou o Perfil Mestre.

---

## Detailed Implementation Plan

### Target Files to Create/Modify

#### 1. `supabase/migrations/003_daily_job_radar.sql` (Create)
* **Type / Scope:** SQL Migration (PostgreSQL + RLS)
* **Proposed Changes:** Criar a função `public.set_updated_at()`, as tabelas `public.daily_job_radar_runs` (sem colunas `*_count`/`next_page`/`has_more`) e `public.daily_job_radar_items`, constraints `UNIQUE (user_id, run_date)` e `UNIQUE (user_id, fingerprint)`, índice `(user_id, triage_status, created_at desc)`, trigger de `updated_at` e políticas RLS (`SELECT` em `daily_job_radar_runs`; `SELECT` e `UPDATE` em `daily_job_radar_items`, todas com `auth.uid() = user_id`).

#### 2. `supabase/consolidated_schema.sql` (Modify)
* **Type / Scope:** SQL Schema Consolidado
* **Proposed Changes:** Espelhar `public.set_updated_at()`, `daily_job_radar_runs`, `daily_job_radar_items`, índices e políticas RLS da migration `003_daily_job_radar.sql`, e atualizar o comentário do cabeçalho de 15 para 17 tabelas.

#### 3. `supabase/functions/daily-ai-jobs-radar/adapters/JobSourceAdapter.ts` (Create)
* **Type / Scope:** Deno / TypeScript Adapter (Edge Function)
* **Proposed Changes:** Definir a interface `JobSourceAdapter` e o tipo `NormalizedCandidateJob`, além da implementação `AdzunaBrAdapter` consultando `https://api.adzuna.com/v1/api/jobs/br/search/1` com `what_or`, `sort_by=date`, `max_days_old=7`, `results_per_page=50`, timeout `8000ms` e credenciais `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` lidas de `Deno.env`.

#### 4. `supabase/functions/daily-ai-jobs-radar/filters/deterministicFilter.ts` (Create)
* **Type / Scope:** Deno / TypeScript Pure Domain Filter
* **Proposed Changes:** Implementar o Estágio 1 sem gasto de tokens: detecção de idioma PT-BR sobre `summary_snippet` + `title`, classificação de `work_model` com precedência `remoto > hibrido > presencial` e `is_brasilia_df` (descartando híbrido/presencial/indeterminado fora de Brasília-DF), validação de URL segura (`http:`/`https:`), geração do `fingerprint` SHA-256 normalizado e helper de derivação determinística de `fit_category` (`directFitScore >= 70 -> 'aderente'`, `adaptabilityScore >= 60 -> 'adaptavel'`, senão `'baixa_aderencia'`).

#### 5. `supabase/functions/daily-ai-jobs-radar/index.ts` (Create)
* **Type / Scope:** Supabase Edge Function (Deno)
* **Proposed Changes:** Implementar endpoint autenticado via `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` + `auth.getUser(token)` e escritas via `SUPABASE_SERVICE_ROLE_KEY`; contrato HTTP `{ mode: 'auto' | 'retry' } -> { status, run, items, error }`; guard para `master_facts` vazio retornando `missing_profile` sem travar o dia; `run_date` em `America/Sao_Paulo`; trava atômica (`INSERT ... ON CONFLICT DO NOTHING` em `auto`; `UPDATE ... WHERE status = 'failed' RETURNING id` em `retry` e recuperação de `running` órfão > 5 min); deduplicação em memória + contra `daily_job_radar_items` e `public.jobs` (`select('title, source_url, companies(name)')` por `normalizeUrl(source_url)` ou `normalize(title)|normalize(companies.name)`); classificação em 1 lote de até 12 vagas no Gemini (modelo com fallback + validação Zod + Base da Verdade) e insert com `ON CONFLICT (user_id, fingerprint) DO NOTHING`.

#### 6. `src/shared/types/database.types.ts` (Modify)
* **Type / Scope:** Shared Supabase Types
* **Proposed Changes:** Exportar os unions `DailyRadarRunStatus`, `RadarFitCategory` e `RadarTriageStatus` no topo do arquivo (padrão de `WorkModel` e `ApplicationStatus`) e adicionar as definições das tabelas `daily_job_radar_runs` e `daily_job_radar_items` em `Database["public"]["Tables"]`.

#### 7. `src/domain/entities/DailyJobRadar.ts` (Create)
* **Type / Scope:** Domain Entities (TypeScript)
* **Proposed Changes:** Declarar as interfaces TypeScript compartilhadas no frontend (`DailyRadarRun`, `DailyRadarItem`, `RadarJobDraft` com `workModel`) reutilizando os unions exportados de `src/shared/types/database.types.ts` (sem duplicar schemas Zod no frontend).

#### 8. `src/infrastructure/supabase/DailyJobRadarRepository.ts` (Create)
* **Type / Scope:** Supabase Infrastructure Repository
* **Proposed Changes:** Encapsular `listActiveItems(userId)` (`triage_status != 'descartada'`), `getTodayRun(userId)`, invocação autenticada da Edge Function `triggerDailyRadar(mode: 'auto' | 'retry')`, `updateTriageStatus(itemId, status)` e `linkApplication(itemId, applicationId)`.

#### 9. `src/infrastructure/supabase/JobApplicationsRepository.ts` (Modify)
* **Type / Scope:** Supabase Infrastructure Repository
* **Proposed Changes:** Adicionar parâmetro opcional `status?: ApplicationStatus` em `CreateApplicationParams`, preservando `"curriculo_gerado"` como valor padrão para manter retrocompatibilidade e permitindo `"rascunho"` quando originado do Radar.

#### 10. `src/shared/utils/popupLauncher.ts` (Modify)
* **Type / Scope:** Shared Utility (Security Hardening)
* **Proposed Changes:** Endurecer `openSideBrowser` com validação `isSafeHttpUrl` rejeitando qualquer URL cujo protocolo não seja `http:` ou `https:` antes de abrir a janela lateral.

#### 11. `src/presentation/components/DailyAiJobsRadar.tsx` (Create)
* **Type / Scope:** React Presentation Component (`styled-components` `*Stl`)
* **Proposed Changes:** Criar componente recolhível de UI com 100% de styled-components usando sufixo `Stl` e tokens de `src/theme/theme.ts` (zero CSS). Implementar leitura imediata do cache, disparo não-bloqueante `mode: 'auto'` em background, selo explícito de triagem preliminar, estado vazio (0 vagas novas), aviso para `missing_profile`, filtros (`Todas`, `Aderentes`, `Adaptáveis`, `Remoto`, `Brasília-DF`), ações de 1 clique (`Descartar`, `Salvar no Kanban` com `savingItemIds` + `linkApplication`, `Analisar no JobAnalyzer`) e botão `"Tentar novamente hoje"` quando `status = 'failed'`.

#### 12. `src/presentation/components/JobPortalsView.tsx` (Modify)
* **Type / Scope:** React Presentation Component
* **Proposed Changes:** Expandir `JobPortalsViewProps` com `userId`, `onSaveRadarToKanban` e `onSendRadarToAnalyzer`; renderizar `<DailyAiJobsRadar />` no topo acima do grid de portais existente (página única); atualizar os 5 `searchUrl` hardcoded de `PORTALS` para termos de IA / Desenvolvimento com IA (mantendo intactos os styled-components legados fora da área tocada).

#### 13. `src/presentation/components/JobAnalyzer.tsx` (Modify)
* **Type / Scope:** React Presentation Component
* **Proposed Changes:** Adicionar props opcionais `initialDraft?: RadarJobDraft | null` e `onDraftConsumed?: () => void`, pré-preenchendo `jobTitle`, `companyName`, `sourceUrl` e `jobDescription` (com aviso de resumo preliminar) em `useEffect` de consumo único e preservando `workModel` ao acionar `onGenerateResume`.

#### 14. `src/screens/Home.tsx` (Modify)
* **Type / Scope:** Main Workspace Screen
* **Proposed Changes:** Adicionar estado `analyzerDraft`, conectar `onSendRadarToAnalyzer` (grava `analyzerDraft` e alterna `currentTab` para `"analyze"`), conectar `onDraftConsumed` (limpa `analyzerDraft`) e implementar `onSaveRadarToKanban(item): Promise<string>` criando candidatura com `status: "rascunho"` e `workModel: item.work_model`, recarregando `listApplications(user.id)` para sincronizar o Kanban e retornando o `applicationId`.

#### 15. `.env.example` (Modify)
* **Type / Scope:** Environment Documentation
* **Proposed Changes:** Documentar as chaves server-side `ADZUNA_APP_ID` e `ADZUNA_APP_KEY` com aviso explícito de que pertencem exclusivamente aos Supabase Edge Secrets (nunca com prefixo `VITE_`).

#### 16. `tests/e2e/radar.spec.ts` (Create)
* **Type / Scope:** Playwright E2E Test
* **Proposed Changes:** Adicionar testes funcionais atravessando `ProtectedRoute` via mock de sessão (`page.addInitScript` no `localStorage` + `page.route('**/auth/v1/user', ...)` e `page.route('**/functions/v1/daily-ai-jobs-radar', ...)`) para validar renderização não-bloqueante do Radar, recolher/expandir, filtros, descarte, salvamento como `rascunho` no Kanban e pré-preenchimento consume-once no `JobAnalyzer`.

#### 17. `AGENTS.md` e `README.md` (Modify)
* **Type / Scope:** Governança e Documentação (Regra 1 e Regra 6 do `AGENTS.md`)
* **Proposed Changes:** Atualizar a árvore de pastas, tabela de variáveis de ambiente, modelo de dados e registrar a alteração na tabela de **Histórico de alterações** do `AGENTS.md`, documentar a nova funcionalidade e secrets em `README.md` e executar `npm run graphify` (atualização do grafo estrutural de dependências em `graphify-out/`).

### Verification Plan

* **Compilation/Build:** `npm run build` (`tsc -b && vite build`) sem erros de tipagem ou bundle.
* **Static Analysis & Linting:** `npm run lint` sem novos erros ou warnings nos arquivos criados/modificados; validação manual de zero imports `.css` em `src/` e sufixo `Stl` em 100% dos novos styled-components.
* **Security (SAST & Audit):** `npm audit` sem novas vulnerabilidades críticas, `npx semgrep scan --config auto` e verificação de que `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `GEMINI_API_KEY` e `SUPABASE_SERVICE_ROLE_KEY` não aparecem em `src/` nem no bundle `dist/`.
* **Graphify Sync:** `npm run graphify` executado após as mudanças estruturais.
* **E2E/Integration:** `npm run test:e2e` executando `tests/e2e/rotas.spec.ts` e `tests/e2e/radar.spec.ts` com 100% de aprovação.
* **Manual Smoke Check (Supabase):** Validar aplicação da migration `003_daily_job_radar.sql`, rejeição `401` na Edge Function sem JWT, retorno `missing_profile` com `master_facts` vazio, execução 1x/dia em `America/Sao_Paulo`, bloqueio de `DELETE` direto em `daily_job_radar_runs` pelo cliente e retry atômico em caso de `failed`.

---

*Drafted and resolved with EGM (Elephant-Goldfish Model)*
