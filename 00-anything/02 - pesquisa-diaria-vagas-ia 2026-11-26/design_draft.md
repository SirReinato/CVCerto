# Radar Diário de Vagas IA (`JobPortalsView`)

* **Author:** Renato França
* **Status:** Draft
* **Date:** 2026-11-26

---

## Overview

O Radar Diário de Vagas IA adiciona à aba de Portais (`JobPortalsView`) do CVCerto uma rotina de descoberta diária de oportunidades focadas em Inteligência Artificial e Desenvolvimento com IA. Na primeira abertura da aba em cada dia civil (fuso `America/Sao_Paulo`), o sistema busca novas vagas em português (Brasil) — priorizando trabalho remoto e aceitando formato híbrido ou presencial apenas em Brasília-DF — utilizando exclusivamente camadas gratuitas.

Cada vaga encontrada é deduplicada contra o histórico do usuário no Supabase e recebe uma triagem preliminar em duas dimensões ancoradas no Perfil Mestre ("Base da Verdade"): **Aderência Direta** e **Adaptabilidade**. A partir dessa triagem, o usuário decide em um clique se descarta a vaga, salva no Kanban como rascunho ou abre o `JobAnalyzer` pré-preenchido para gerar o currículo adaptado.

## The Problem

Hoje a aba `JobPortalsView.tsx` funciona apenas como um diretório estático de links externos (configurados originalmente para "Suporte TI N2/N3" e "Analista de Suporte") que abre janelas laterais manuais. Esse fluxo gera quatro atritos diários para a busca de vagas em IA e Desenvolvimento com IA:

1. **Busca manual repetitiva e dispersa:** O usuário precisa abrir múltiplos portais todos os dias, refazer filtros de idioma/localização (remoto ou Brasília-DF) e revisar novamente vagas que já viu ou descartou em dias anteriores.
2. **Desalinhamento com o foco atual:** Os atalhos fixos atuais não refletem o objetivo de carreira em IA / Desenvolvimento com IA e não cruzam as vagas encontradas com o Perfil Mestre do candidato.
3. **Custo cognitivo na triagem inicial:** Sem uma separação prévia entre vagas com aderência direta e vagas onde há espaço real de adaptação (sem inventar fatos fora da Base da Verdade), o usuário gasta tempo abrindo descrições irrelevantes antes de levar uma oportunidade ao `JobAnalyzer` ou ao Kanban.
4. **Restrições de SPA e camada gratuita:** O CVCerto é uma SPA sem orçamento para APIs pagas de scraping ou busca. Qualquer automação precisa operar dentro dos limites gratuitos de execução, manter credenciais fora do navegador e evitar links alucinados por LLM.

## Goals

* Executar no máximo 1 atualização automática por dia civil (`America/Sao_Paulo`) por usuário ao abrir `JobPortalsView`, sem bloquear a visualização imediata dos portais e do histórico já salvo.
* Operar 100% em camadas gratuitas (API gratuita de vagas + Google Gemini + Supabase Free Tier) com todas as chaves mantidas no servidor (Supabase Edge Function autenticada por JWT).
* Filtrar estritamente vagas de IA / Desenvolvimento com IA em português (Brasil), com prioridade para remoto e aceitando híbrido ou presencial exclusivamente em Brasília-DF.
* Persistir o histórico diário e o status de triagem de cada vaga (`nova`, `salva_kanban`, `enviada_analise`, `descartada`) no Supabase com RLS por usuário, impedindo que vagas já vistas, descartadas ou já cadastradas no CRM reapareçam nos dias seguintes.
* Classificar cada vaga em duas dimensões ancoradas exclusivamente nos fatos reais do Perfil Mestre: **Aderência Direta** e **Adaptabilidade**, deixando explícito que se trata de uma triagem preliminar sobre o resumo retornado pela API.
* Permitir ações diretas de 1 clique em cada vaga: descartar, salvar no Kanban (`ApplicationsKanban`) ou enviar pré-preenchida para análise profunda no `JobAnalyzer`.
* Isolar a interface do Radar em subcomponente dedicado sem inflar `JobPortalsView.tsx`, seguindo 100% das convenções do `AGENTS.md` (zero CSS em `src/`, styled-components com sufixo `Stl` e consumo de `theme.ts`).

## Non-Goals

* Scraping de portais protegidos contra automação (LinkedIn, Gupy, Glassdoor, Catho, InfoJobs).
* Candidatura automática (auto-apply) em portais externos.
* Geração automática de currículo PDF/ATS ou dossiê completo de entrevista para todas as vagas descobertas (continua sob demanda no `JobAnalyzer`).
* Agendamento em segundo plano com o app fechado (`pg_cron` ou cron externo) e notificações por e-mail ou push nesta fase.
* Vagas em inglês ou vagas presenciais/híbridas fora de Brasília-DF.

## Open Questions

Nenhuma questão aberta no momento. As decisões Q1–Q6 foram fechadas com o autor e incorporadas na seção **Technical Plan (Architecture)**.

## Critical User Journeys (CUJs)

### CUJ 1: Primeira abertura da aba no dia (atualização automática não-bloqueante)

* **Given**: O usuário está autenticado no CVCerto, possui Perfil Mestre salvo no Supabase e ainda não houve execução concluída do Radar na data civil atual (`America/Sao_Paulo`).
* **When**: O usuário acessa a aba `JobPortalsView`.
* **Then**: A aba renderiza imediatamente os portais e as vagas persistidas de dias anteriores (sem travar a tela), exibe um indicador discreto de busca em andamento, executa a coleta + filtragem + triagem preliminar via Edge Function autenticada e atualiza a lista com as novas vagas deduplicadas do dia.

### CUJ 2: Triagem de vaga e encaminhamento ao Kanban ou `JobAnalyzer`

* **Given**: Existem vagas novas listadas no Radar com indicação de modalidade (Remoto ou Híbrido/Presencial em Brasília-DF), selo de triagem preliminar e pontuações de **Aderência Direta** e **Adaptabilidade** com justificativas baseadas no Perfil Mestre.
* **When**: O usuário clica em "Descartar", "Salvar no Kanban" ou "Analisar no JobAnalyzer".
* **Then**:
  * Em **Descartar**, a vaga muda para `descartada`, sai da fila ativa e não reaparece em buscas futuras.
  * Em **Salvar no Kanban**, a vaga é registrada no CRM do usuário com o modelo de trabalho correspondente e marcada como `salva_kanban`.
  * Em **Analisar no JobAnalyzer**, o workspace alterna para a aba `analyze` com título, empresa, link e resumo pré-preenchidos para o usuário colar a descrição completa e gerar o currículo adaptado.

### CUJ 3: Reabertura no mesmo dia e recuperação de falha

* **Given**: O usuário já abriu a aba hoje (rodada concluída ou falhada por indisponibilidade temporária da API gratuita).
* **When**: O usuário reabre `JobPortalsView` no mesmo dia civil (`America/Sao_Paulo`) ou recarrega a página em duas abas simultâneas.
* **Then**: Se a rodada do dia já concluiu ou está em andamento, nenhuma nova chamada às APIs externas é disparada e a UI exibe diretamente os dados salvos no Supabase. Se a rodada falhou, a UI exibe aviso claro com ação manual para tentar novamente sem perder o histórico anterior.

## Technical Plan (Architecture)

### Decisões Arquiteturais Fechadas

* **Q1 (Volume e Cota):** Teto automático de até **24 vagas novas classificadas por rodada** (processadas em lotes de **8 vagas** por chamada ao Gemini), com cursor salvo e botão manual **"Buscar próximo lote"** quando houver excedente pré-filtrado.
* **Q2 (Fontes no MVP):** Apenas **Adzuna BR** ativa no MVP, isolada atrás de uma interface `JobSourceAdapter` na Edge Function para permitir plugar futuras APIs gratuitas (como Jooble BR) sem alterar banco, deduplicação ou UI.
* **Q3 (Layout em `JobPortalsView`):** Componente dedicado `DailyAiJobsRadar.tsx` renderizado como **seção no topo de `JobPortalsView.tsx`** acima dos portais existentes (página única rolável), com controle de recolher/expandir.
* **Q4 (Falhas e Edição do Perfil):** Botão manual **"Tentar novamente hoje"** liberado apenas quando a rodada do dia encerrar com `status = 'failed'`. Alterações no Perfil Mestre passam a valer a partir da rodada do dia seguinte para preservar a cota gratuita.
* **Q5 (Integração com Kanban e `JobAnalyzer`):** **"Salvar no Kanban"** cria a candidatura com `status = 'rascunho'` e `work_model` inferido; **"Analisar no JobAnalyzer"** apenas alterna para a aba `analyze` com os campos pré-preenchidos (sem criar card duplicado no Kanban).
* **Q6 (Transparência de Triagem):** Cada card do Radar exibe selo explícito informando que os scores são uma **triagem preliminar baseada no resumo retornado pela API**, orientando o usuário a colar a descrição completa no `JobAnalyzer`.

### Arquitetura e Fluxo de Dados

```text
[JobPortalsView.tsx]
  └─ [DailyAiJobsRadar.tsx] (styled-components *Stl + theme.ts, recolhível)
        ├─ 1. Leitura imediata (cache): DailyJobRadarRepository -> Supabase (RLS)
        ├─ 2. Disparo em background (1x/dia): invoke("daily-ai-jobs-radar", { mode: "auto" })
        │       │
        │       ▼
        │  [Edge Function: supabase/functions/daily-ai-jobs-radar/index.ts]
        │    ├─ Valida JWT (supabase.auth.getUser) -> user_id confiável
        │    ├─ Calcula run_date em America/Sao_Paulo (YYYY-MM-DD)
        │    ├─ Trava atômica em daily_job_radar_runs (UNIQUE user_id, run_date)
        │    ├─ JobSourceAdapter -> AdzunaBrAdapter (ADZUNA_APP_ID / ADZUNA_APP_KEY)
        │    ├─ Estágio 1 (0 tokens): filtro PT-BR + (remoto | Brasília-DF) + dedup
        │    ├─ Estágio 2 (Gemini): até 24 vagas em lotes de 8 + Zod + Base da Verdade
        │    └─ Persiste daily_job_radar_items + atualiza run + audita ai_generations
        │
        └─ 3. Ações do usuário (1 clique):
             ├─ Descartar -> update triage_status = 'descartada'
             ├─ Salvar no Kanban -> JobApplicationsRepository (status: 'rascunho')
             └─ Analisar no JobAnalyzer -> Home.tsx (tab 'analyze' + initialDraft)
```

### Modelo de Dados (Supabase Migration `003_daily_job_radar.sql`)

Ambas as tabelas recebem RLS habilitado com políticas estritas `auth.uid() = user_id` para `SELECT`, `INSERT`, `UPDATE` e `DELETE`.

1. **`public.daily_job_radar_runs`** (controle diário e trava contra concorrência):
   * `id` (`uuid`, PK)
   * `user_id` (`uuid`, FK -> `public.profiles(id)` on delete cascade)
   * `run_date` (`date`, calculado no fuso `America/Sao_Paulo`)
   * `status` (`text`: `'running' | 'completed' | 'failed'`)
   * `source` (`text`, default `'adzuna_br'`)
   * `fetched_count` (`int`, default `0`), `filtered_count` (`int`, default `0`), `classified_count` (`int`, default `0`)
   * `next_page` (`int`, default `1`), `has_more` (`boolean`, default `false`)
   * `error_message` (`text`, nullable)
   * `started_at` (`timestamptz`), `finished_at` (`timestamptz`, nullable)
   * Constraint: `UNIQUE (user_id, run_date)`

2. **`public.daily_job_radar_items`** (vagas descobertas, triagem e deduplicação):
   * `id` (`uuid`, PK)
   * `user_id` (`uuid`, FK -> `public.profiles(id)` on delete cascade)
   * `run_id` (`uuid`, FK -> `public.daily_job_radar_runs(id)` on delete set null)
   * `source` (`text`, ex.: `'adzuna_br'`)
   * `external_id` (`text`, ID da vaga na API de origem)
   * `fingerprint` (`text`, hash SHA-256 de `normalize(title) | normalize(company) | work_model_ou_cidade`)
   * `title` (`text`), `company_name` (`text`), `location_raw` (`text`)
   * `work_model` (`work_model` enum existente: `'remoto' | 'hibrido' | 'presencial'`)
   * `is_brasilia_df` (`boolean`, default `false`)
   * `summary_snippet` (`text`, resumo retornado pela API)
   * `source_url` (`text`)
   * `published_at` (`timestamptz`, nullable)
   * `direct_fit_score` (`int`, 0–100)
   * `adaptability_score` (`int`, 0–100)
   * `fit_category` (`text`: `'aderente' | 'adaptavel' | 'baixa_aderencia'`)
   * `matched_facts` (`text[]`, fatos reais do Perfil Mestre citados pela IA)
   * `adaptability_notes` (`text`, justificativa curta sem alucinação)
   * `triage_status` (`text`: `'nova' | 'salva_kanban' | 'enviada_analise' | 'descartada'`, default `'nova'`)
   * `linked_application_id` (`uuid`, nullable, FK -> `public.job_applications(id)` on delete set null)
   * `created_at` (`timestamptz`), `updated_at` (`timestamptz`)
   * Constraints: `UNIQUE (user_id, source, external_id)` e `UNIQUE (user_id, fingerprint)`
   * Índices: `(user_id, triage_status, created_at desc)`

### Edge Function (`supabase/functions/daily-ai-jobs-radar/index.ts`)

* **Autenticação e CORS:** Exige header `Authorization: Bearer <jwt>`, valida o usuário via `supabase.auth.getUser()` e deriva `user_id` exclusivamente do token.
* **Trava atômica e modos de execução (`mode: 'auto' | 'retry' | 'next_batch'`):**
  * Em `auto`: tenta inserir em `daily_job_radar_runs` com `ON CONFLICT DO NOTHING`. Se já existir `completed` ou `running` há menos de 5 minutos, retorna imediatamente `{ status: 'already_ran', items }` sem consumir APIs externas. Se `running` estiver órfão (> 5 min), reassume a trava.
  * Em `retry`: só permite reexecução se a linha de hoje estiver com `status = 'failed'`.
  * Em `next_batch`: incrementa `next_page` na linha de hoje e processa até mais 24 vagas novas.
* **Camada de Coleta (`JobSourceAdapter`):**
  * Interface comum `fetchJobs({ keywords, page, resultsPerPage }) => NormalizedCandidateJob[]`.
  * `AdzunaBrAdapter` consulta o endpoint oficial `https://api.adzuna.com/v1/api/jobs/br/search/{page}` usando `ADZUNA_APP_ID` e `ADZUNA_APP_KEY` dos Supabase Secrets com termos focados em IA / Desenvolvedor IA / LLM / Agentes IA.
* **Estágio 1 — Pré-filtro Determinístico (0 tokens):**
  1. Filtra idioma português (heurística lexical PT-BR + descarte de títulos/resumos majoritariamente em inglês).
  2. Classifica `work_model` (`remoto`, `hibrido`, `presencial`) e `is_brasilia_df` via inspeção de `location` + `title` + `summary_snippet`. Descarta vagas híbridas/presenciais fora de Brasília-DF.
  3. Gera `fingerprint` normalizado e remove candidatos que já existam em `daily_job_radar_items` ou em `public.jobs` do mesmo usuário.
* **Estágio 2 — Classificação em Lotes no Gemini:**
  1. Seleciona até **24 candidatos novos** (marcando `has_more = true` se houver excedente) e divide em lotes de **8 vagas** (máximo 3 chamadas).
  2. Carrega os fatos ativos do usuário em `public.master_facts` como contexto da **Base da Verdade**.
  3. Solicita saída JSON estruturada validada com **Zod** (`directFitScore`, `adaptabilityScore`, `fitCategory`, `matchedFacts`, `adaptabilityNotes`), instruindo explicitamente a nunca inventar experiências e basear-se apenas no resumo fornecido.
  4. Persiste os resultados em `daily_job_radar_items`, registra uso de tokens em `public.ai_generations` (`kind = 'daily_radar_triage'`) e finaliza `daily_job_radar_runs` com `status = 'completed'`.

### Integração no Frontend

* **`DailyJobRadarRepository.ts` (`src/infrastructure/supabase/`):** Encapsula leitura dos itens salvos, invocação da Edge Function `daily-ai-jobs-radar` e atualização de `triage_status` / `linked_application_id`.
* **`DailyAiJobsRadar.tsx` (`src/presentation/components/`):** Subcomponente isolado no topo de `JobPortalsView.tsx` (recolhível, 100% styled-components com sufixo `Stl` consumindo `theme.ts`). Renderiza cache imediatamente, dispara `mode: 'auto'` em background, exibe selo de triagem preliminar, filtros rápidos (`Todas`, `Aderentes`, `Adaptáveis`, `Remoto`, `Brasília-DF`), botão "Buscar próximo lote" quando `has_more = true` e "Tentar novamente" quando `status = 'failed'`.
* **`JobApplicationsRepository.ts`:** Adiciona `status?: ApplicationStatus` em `CreateApplicationParams` (mantendo `"curriculo_gerado"` como padrão para chamadas existentes e usando `"rascunho"` para vagas vindas do Radar).
* **`Home.tsx` e `JobAnalyzer.tsx`:** `Home.tsx` mantém estado `analyzerDraft` passado como prop opcional `initialDraft` para `JobAnalyzer.tsx` e callback `onSendToAnalyzer` para `JobPortalsView.tsx`, permitindo pré-preencher título, empresa, link e resumo ao alternar para a aba `analyze`.

## Alternatives Considered

### Alternative A: Gemini com Google Search Grounding como fonte primária de coleta

* **Pros:** Descobre vagas diretamente em portais corporativos sem exigir cadastro em API externa de vagas.
* **Cons:** Cota gratuita restrita e instável para grounding; retorno frequente de páginas genéricas de agregadores ou vagas já encerradas; ausência de `external_id` estável para deduplicação determinística.
* **Reason for Rejection:** Rejected by author: cota gratuita instável para grounding e risco elevado de links expirados ou sem chave determinística de deduplicação, optando por API oficial gratuita (`Adzuna BR`) atrás de `JobSourceAdapter`.

### Alternative B: Processamento sem limite rígido (chamada única ou lotes encadeados automaticamente)

* **Pros:** Classifica todas as vagas do dia sem exigir interação manual para buscar excedentes.
* **Cons:** Em chamada única, estoura o wall-clock da Supabase Edge Function gratuita e trunca o JSON de saída do Gemini; em lotes encadeados automaticamente, pode atingir erro 429 (cota gratuita diária/por minuto do Gemini) em dias de pico e manter o loading ativo por mais de 1 minuto.
* **Reason for Rejection:** Rejected by author: substituída por teto automático de até 24 vagas novas por rodada (em lotes de 8) com botão manual "Buscar próximo lote" quando houver excedente.

### Alternative C: Agendamento em segundo plano via `pg_cron` + `pg_net` no Supabase

* **Pros:** Abertura instantânea da aba `JobPortalsView` sem espera de atualização na primeira visita do dia.
* **Cons:** Consome cota de API externa e tokens do Gemini todos os dias mesmo quando o usuário não abre a aplicação; exige setup manual de Vault e secrets em SQL.
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
  * A Edge Function `daily-ai-jobs-radar` exige `Authorization: Bearer <jwt>` e valida o usuário via `supabase.auth.getUser()`, derivando `user_id` exclusivamente do token.
  * Credenciais `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` e `GEMINI_API_KEY` residem exclusivamente nos Supabase Edge Secrets (nunca em `src/` ou em variáveis `VITE_`).
  * As tabelas `daily_job_radar_runs` e `daily_job_radar_items` operam com RLS estrito (`auth.uid() = user_id`).
  * Links externos recebidos da API são validados para aceitar apenas protocolos `https://` ou `http://` antes de renderizar ou abrir em `openSideBrowser`, prevenindo XSS via `javascript:`.
* **Performance & Latency:**
  * Carregamento inicial não-bloqueante: os portais e o histórico salvo no Supabase renderizam imediatamente enquanto a atualização diária (`mode: 'auto'`) roda em segundo plano (~8–15s).
  * O pré-filtro determinístico (Estágio 1) elimina vagas fora de PT-BR, fora de remoto/Brasília-DF e duplicadas com custo zero de tokens antes de acionar o Gemini.
  * Consumo de tokens do Gemini é registrado em `public.ai_generations` (`kind = 'daily_radar_triage'`).
* **Rollout & Rollback:**
  * Migration `003_daily_job_radar.sql` é estritamente aditiva (não altera nem remove colunas das 15 tabelas existentes).
  * `JobApplicationsRepository.createApplication` mantém `"curriculo_gerado"` como padrão no novo parâmetro opcional `status`, garantindo 100% de retrocompatibilidade com fluxos existentes.
  * Rollback imediato possível removendo `<DailyAiJobsRadar />` de `JobPortalsView.tsx` e desabilitando a Edge Function sem impactar o CRM ou o Perfil Mestre.

---

## Detailed Implementation Plan

### Target Files to Create/Modify

#### 1. `supabase/migrations/003_daily_job_radar.sql` (Create)
* **Type / Scope:** SQL Migration (PostgreSQL + RLS)
* **Proposed Changes:** Criar as tabelas `public.daily_job_radar_runs` e `public.daily_job_radar_items`, constraints `UNIQUE (user_id, run_date)`, `UNIQUE (user_id, source, external_id)` e `UNIQUE (user_id, fingerprint)`, índices por `(user_id, triage_status, created_at desc)`, trigger de `updated_at` e políticas RLS estritas (`auth.uid() = user_id`) para todas as operações.

#### 2. `supabase/consolidated_schema.sql` (Modify)
* **Type / Scope:** SQL Schema Consolidado
* **Proposed Changes:** Espelhar a definição de `daily_job_radar_runs`, `daily_job_radar_items`, índices e políticas RLS da migration `003_daily_job_radar.sql` para manter o schema consolidado sincronizado.

#### 3. `supabase/functions/daily-ai-jobs-radar/adapters/JobSourceAdapter.ts` (Create)
* **Type / Scope:** Deno / TypeScript Adapter (Edge Function)
* **Proposed Changes:** Definir a interface `JobSourceAdapter` e o tipo `NormalizedCandidateJob`, além da implementação `AdzunaBrAdapter` consultando `https://api.adzuna.com/v1/api/jobs/br/search/{page}` com `ADZUNA_APP_ID` e `ADZUNA_APP_KEY` lidos de `Deno.env`, paginação e timeout defensivo.

#### 4. `supabase/functions/daily-ai-jobs-radar/filters/deterministicFilter.ts` (Create)
* **Type / Scope:** Deno / TypeScript Pure Domain Filter
* **Proposed Changes:** Implementar o Estágio 1 sem gasto de tokens: detecção lexical de idioma PT-BR, classificação de `work_model` (`remoto` | `hibrido` | `presencial`) e `is_brasilia_df`, descarte de híbrido/presencial fora de Brasília-DF, validação de URL segura (`https://`/`http://`) e geração do `fingerprint` SHA-256 normalizado (`title|company|work_model_or_city`).

#### 5. `supabase/functions/daily-ai-jobs-radar/index.ts` (Create)
* **Type / Scope:** Supabase Edge Function (Deno)
* **Proposed Changes:** Implementar o endpoint autenticado por JWT (`supabase.auth.getUser()`), cálculo de `run_date` em `America/Sao_Paulo`, trava atômica em `daily_job_radar_runs` (`mode: 'auto' | 'retry' | 'next_batch'`, recuperação de `running` órfão > 5 min), deduplicação contra `daily_job_radar_items` e `public.jobs`, classificação em lotes de 8 vagas (até 24/rodada) via Gemini com validação Zod e regra Base da Verdade sobre `master_facts`, gravação de itens e auditoria de tokens em `public.ai_generations`.

#### 6. `src/domain/entities/DailyJobRadar.ts` (Create)
* **Type / Scope:** Domain Entities & Zod Schemas
* **Proposed Changes:** Declarar schemas Zod e tipos TypeScript compartilhados no frontend (`DailyRadarRun`, `DailyRadarItem`, `RadarFitCategory`, `RadarTriageStatus`, `RadarJobDraft`).

#### 7. `src/shared/types/database.types.ts` (Modify)
* **Type / Scope:** Shared Supabase Types
* **Proposed Changes:** Adicionar as tipagens das tabelas `daily_job_radar_runs` e `daily_job_radar_items` na interface `Database["public"]["Tables"]`.

#### 8. `src/infrastructure/supabase/DailyJobRadarRepository.ts` (Create)
* **Type / Scope:** Supabase Infrastructure Repository
* **Proposed Changes:** Encapsular consultas de cache (`listActiveItems`, `getTodayRun`), invocação autenticada da Edge Function (`triggerDailyRadar(mode)`), atualização de triagem (`updateTriageStatus`) e vínculo com candidatura (`linkApplication`).

#### 9. `src/infrastructure/supabase/JobApplicationsRepository.ts` (Modify)
* **Type / Scope:** Supabase Infrastructure Repository
* **Proposed Changes:** Adicionar parâmetro opcional `status?: ApplicationStatus` em `CreateApplicationParams`, preservando `"curriculo_gerado"` como valor padrão para manter retrocompatibilidade e permitindo `"rascunho"` quando originado do Radar.

#### 10. `src/presentation/components/DailyAiJobsRadar.tsx` (Create)
* **Type / Scope:** React Presentation Component (`styled-components` `*Stl`)
* **Proposed Changes:** Criar componente recolhível de UI com 100% de styled-components usando sufixo `Stl` e tokens de `src/theme/theme.ts` (zero CSS). Implementar leitura imediata do cache, disparo não-bloqueante `mode: 'auto'` em background, selo explícito de triagem preliminar, filtros (`Todas`, `Aderentes`, `Adaptáveis`, `Remoto`, `Brasília-DF`), ações de 1 clique (`Descartar`, `Salvar no Kanban`, `Analisar no JobAnalyzer`), botão `"Buscar próximo lote"` quando `has_more = true` e `"Tentar novamente hoje"` quando `status = 'failed'`.

#### 11. `src/presentation/components/JobPortalsView.tsx` (Modify)
* **Type / Scope:** React Presentation Component
* **Proposed Changes:** Expandir `JobPortalsViewProps` com `userId`, `onSaveRadarToKanban` e `onSendRadarToAnalyzer`, e renderizar `<DailyAiJobsRadar />` no topo da visão acima do grid de portais existente (página única).

#### 12. `src/presentation/components/JobAnalyzer.tsx` (Modify)
* **Type / Scope:** React Presentation Component
* **Proposed Changes:** Adicionar props opcionais `initialDraft?: RadarJobDraft | null` e `onDraftConsumed?: () => void`, sincronizando o estado inicial do formulário (`jobTitle`, `companyName`, `sourceUrl`, `jobDescription`) quando o usuário vier do Radar sem criar candidatura duplicada.

#### 13. `src/screens/Home.tsx` (Modify)
* **Type / Scope:** Main Workspace Screen
* **Proposed Changes:** Adicionar estado `analyzerDraft`, conectar `onSendRadarToAnalyzer` (armazena o draft e alterna `currentTab` para `"analyze"`) e `onSaveRadarToKanban` (cria candidatura com `status: "rascunho"` e `workModel` inferido via `JobApplicationsRepository` e atualiza o estado `applications`).

#### 14. `.env.example` (Modify)
* **Type / Scope:** Environment Documentation
* **Proposed Changes:** Documentar as chaves server-side `ADZUNA_APP_ID` e `ADZUNA_APP_KEY` com aviso explícito de que pertencem exclusivamente aos Supabase Edge Secrets (nunca com prefixo `VITE_`).

#### 15. `tests/e2e/radar.spec.ts` (Create)
* **Type / Scope:** Playwright E2E Test
* **Proposed Changes:** Adicionar testes funcionais mockando chamadas do Supabase/Edge Function para validar renderização não-bloqueante do Radar em `JobPortalsView`, recolher/expandir, filtros, descarte, salvamento como rascunho no Kanban e pré-preenchimento no `JobAnalyzer`.

#### 16. `AGENTS.md` e `README.md` (Modify)
* **Type / Scope:** Governança e Documentação (Regra 1 e Regra 6 do `AGENTS.md`)
* **Proposed Changes:** Atualizar a árvore de pastas, tabela de variáveis de ambiente, modelo de dados e histórico em `AGENTS.md`, documentar a nova funcionalidade e secrets em `README.md` e executar `npm run graphify`.

### Verification Plan

* **Compilation/Build:** `npm run build` (`tsc -b && vite build`) sem erros de tipagem ou bundle.
* **Static Analysis & Linting:** `npm run lint` sem novos erros ou warnings nos arquivos criados/modificados; validação manual de zero imports `.css` em `src/` e sufixo `Stl` em 100% dos novos styled-components.
* **Security:** `npm audit` sem novas vulnerabilidades críticas; verificação de que `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` e `GEMINI_API_KEY` não aparecem em `src/` nem no bundle `dist/`.
* **Graphify Sync:** `npm run graphify` executado após as mudanças estruturais.
* **E2E/Integration:** `npm run test:e2e` executando `tests/e2e/rotas.spec.ts` e `tests/e2e/radar.spec.ts` com 100% de aprovação.
* **Manual Smoke Check (Supabase):** Validar aplicação da migration `003_daily_job_radar.sql`, rejeição `401` na Edge Function sem JWT, execução 1x/dia em `America/Sao_Paulo`, comportamento de `next_batch` e registro em `public.ai_generations`.

---

*Drafted with EGM*
