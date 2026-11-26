# Goldfish Annotated Review Report

**Target:** `00-anything/02 - pesquisa-diaria-vagas-ia 2026-11-26/radar-diario-vagas-ia.md` (`L1–L302`)
**Status:** resolved (Auto accept + Issue 4 Via A)

## Prioritized Findings & AI Suggestions

### [Issue 1] [`egm-design` / `egm-codebase-details`] - Severity: Blocker
* **Affected Scope:** [Lines 126, 157, 227–233, 245](./radar-diario-vagas-ia.md#L126-L157) (`Modelo de Dados`, `Edge Function`, `Itens 1, 2 e 5`)
* **Discrepancy Description:** `public.jobs` em `supabase/consolidated_schema.sql` (`L134–145`) não possui `fingerprint`, `company_name` nem `work_model` (possui `company_id`, `title`, `source_url`). Além disso, `consolidated_schema.sql` não define função `set_updated_at()` para os triggers de `updated_at`.
* **Rationale:** O SQL da migration falharia sem `public.set_updated_at()` e a deduplicação contra `public.jobs` falharia em runtime.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Verificado diretamente em `supabase/consolidated_schema.sql`. A correção é objetiva e aditiva.
* ***Proposed Edit:***
  * Location: `Modelo de Dados` (`L104–143`), `Edge Function — Estágio 1` (`L157`), `Itens 1, 2 e 5` (`L227–245`)
  * Change: Declarar a criação da função `public.set_updated_at()` na migration `003_daily_job_radar.sql` e em `consolidated_schema.sql`. Definir deduplicação contra `public.jobs` via query `select('title, source_url, companies(name)')` comparando `normalizeUrl(source_url)` OU `normalize(title) | normalize(companies.name)`.

### [Issue 2] [`egm-implementation-readiness` / `egm-codebase-details` / `egm-zoom-out`] - Severity: Blocker
* **Affected Scope:** [Lines 146, 162, 215, 243–245](./radar-diario-vagas-ia.md#L146-L162) (`Edge Function`, `NFRs`, `Item 5`)
* **Discrepancy Description:** Faltam o contrato de instanciação do cliente Supabase na Edge Function, o schema HTTP de entrada/saída (`{ mode } -> { status, run, items, error }`), a política de falha parcial e os campos `NOT NULL` (`model`, `prompt_version`) de `public.ai_generations`. Nenhuma outra Edge Function do projeto grava em `ai_generations`.
* **Rationale:** Sem contrato de cliente/HTTP, o implementador precisaria adivinhar se escreve sob RLS ou `service_role`; gravar em `ai_generations` sem `model`/`prompt_version` falha no banco e foge do padrão do repositório.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Definir o cliente e o contrato HTTP elimina ambiguidade de implementação, e remover a escrita em `ai_generations` no MVP evita acoplamento morto (alinhado com `analyze-job/index.ts`).
* ***Proposed Edit:***
  * Location: `Edge Function` (`L144–162`), `NFRs` (`L215`), `Item 5` (`L243–245`)
  * Change: Especificar que a Edge Function valida o JWT com `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` via `auth.getUser(token)` e realiza escritas administrativas em `daily_job_radar_runs`/`daily_job_radar_items` usando `SUPABASE_SERVICE_ROLE_KEY` com `user_id` derivado exclusivamente do token. Documentar contrato HTTP (`{ mode }` -> `{ status, run, items, error }`, códigos `200/401/409/429/500`), modelo Gemini com fallback e remover a gravação em `public.ai_generations` do MVP.

### [Issue 3] [`egm-design` / `egm-zoom-out`] - Severity: Blocker
* **Affected Scope:** [Lines 50, 160–161, 245](./radar-diario-vagas-ia.md#L50-L161) (`CUJ 1`, `Edge Function — Estágio 2`, `Item 5`)
* **Discrepancy Description:** Contas novas ou ainda não sincronizadas podem ter 0 registros ativos em `public.master_facts`. Sem pré-verificação, a Edge Function gasta cota externa sem Base da Verdade e marca a rodada como `completed`.
* **Rationale:** Viola a regra "Base da Verdade" e desperdiça a única execução diária do usuário.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Guard simples antes de chamar Adzuna/Gemini evita o problema sem duplicar lógica de seed no backend.
* ***Proposed Edit:***
  * Location: `CUJ 1` (`L50–52`), `Edge Function` (`L160`), `Item 5` (`L245`)
  * Change: Adicionar pré-checagem de `master_facts` ativos antes de consultar Adzuna/Gemini; se vazio, retornar `{ status: 'missing_profile' }` sem gravar `completed` em `daily_job_radar_runs` e exibir aviso na UI direcionando o usuário a salvar o Perfil Mestre.

### [Issue 4] [`egm-design` / `egm-zoom-out` / `egm-comprehension` / `egm-implementation-readiness`] - Severity: Blocker
* **Affected Scope:** [Lines 73, 115, 147–150, 159, 245, 265](./radar-diario-vagas-ia.md#L73-L159) (`Q1`, `Modelo de Dados`, `Edge Function`, `Itens 5 e 10`)
* **Discrepancy Description:** `INSERT ... ON CONFLICT DO NOTHING` só trava `mode: 'auto'`, deixando `retry` e `next_batch` sem trava atômica; além disso, incrementar `next_page` no `next_batch` descarta excedentes pré-filtrados da página atual. Em contrapartida, Stage 5 e Stage 8 recomendam cortar `next_batch`/`next_page`/`has_more` no MVP para 1 único lote de 10–12 vagas/dia no Gemini.
* **Rationale:** Há uma decisão arquitetural aberta entre simplificar Q1 (eliminando o problema na raiz) ou manter Q1 com endurecimento completo de trava condicional + reconsulta de página + política de falha parcial.
* ***AI Suggestion:*** ESCALATE
* ***Justification:*** O autor escolheu explicitamente **Q1 = Opção A** (até 24 vagas em lotes de 8 + botão "Buscar próximo lote") durante o `/egm-draft`. Somente o autor pode decidir se prefere (a) simplificar o MVP para 1 lote diário de 10–12 vagas sem `next_batch` ou (b) manter `next_batch` aplicando o hardening completo (`UPDATE ... WHERE ... RETURNING *` + reconsulta de `next_page` antes de incrementar).
* ***Proposed Edit:***
  * Location: `Q1` (`L73`), `Modelo de Dados` (`L115`), `Edge Function` (`L147–159`), `Itens 5 e 10` (`L245`, `L265`)
  * Change: Aguardando decisão do autor entre Via A (simplificar para 1 lote de 10–12 vagas/dia) ou Via B (manter `next_batch` com `UPDATE` atômico condicional, reconsulta de `next_page` e semântica de falha parcial).

### [Issue 5] [`egm-implementation-readiness` / `egm-codebase-details`] - Severity: Blocker
* **Affected Scope:** [Lines 100, 168–169, 255–278](./radar-diario-vagas-ia.md#L255-L278) (`Fluxo de Dados`, `Itens 8, 9, 10, 11 e 13`)
* **Discrepancy Description:** `JobApplicationsRepository.createApplication` retorna linha crua de `job_applications` sem o join `jobs`/`companies` exigido por `ApplicationItem`. Falta definir quem chama `linkApplication(itemId, createdAppId)`, como `Home.tsx` sincroniza `applications` sem reload e como evitar clique duplo por card.
* **Rationale:** Sem sincronizar `applications` em `Home.tsx`, a vaga salva no Kanban não aparece ao trocar de aba sem recarregar a página.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Verificado em `src/infrastructure/supabase/JobApplicationsRepository.ts` (`L96–114`) e `src/screens/Home.tsx` (`L76–78`).
* ***Proposed Edit:***
  * Location: `Integração no Frontend` (`L168–169`), `Itens 8, 10 e 13` (`L255–278`)
  * Change: Definir `onSaveRadarToKanban(item: DailyRadarItem): Promise<string>` em `Home.tsx` criando a candidatura com `status: "rascunho"`, recarregando `listApplications(user.id)` para atualizar `applications` e retornando o `applicationId` criado; `DailyAiJobsRadar.tsx` mantém estado `savingItemIds` para bloquear clique duplo e chama `DailyJobRadarRepository.linkApplication(item.id, applicationId)`.

### [Issue 6] [`egm-design` / `egm-zoom-out`] - Severity: Major
* **Affected Scope:** [Lines 126, 141, 229](./radar-diario-vagas-ia.md#L126-L141) (`Modelo de Dados`, `Item 1`)
* **Discrepancy Description:** Duas constraints `UNIQUE` independentes (`(user_id, source, external_id)` e `(user_id, fingerprint)`) quebram `INSERT ... ON CONFLICT (cols)` em lote no PostgreSQL.
* **Rationale:** Uma única constraint `UNIQUE (user_id, fingerprint)` somada à deduplicação em memória antes do Estágio 2 cobre intra-fonte e cross-source sem conflitos de upsert.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Simplifica o schema e elimina erro de insert em lote.
* ***Proposed Edit:***
  * Location: `Modelo de Dados` (`L141`), `Item 1` (`L229`)
  * Change: Manter apenas `UNIQUE (user_id, fingerprint)` em `daily_job_radar_items`, realizar deduplicação em memória na resposta da API antes do Estágio 2 e inserir com `ON CONFLICT (user_id, fingerprint) DO NOTHING`.

### [Issue 7] [`egm-design` / `egm-zoom-out`] - Severity: Major
* **Affected Scope:** [Lines 106, 114, 210, 229](./radar-diario-vagas-ia.md#L106-L114) (`Modelo de Dados`, `NFRs`, `Item 1`)
* **Discrepancy Description:** RLS liberando `DELETE`/`UPDATE` direto do cliente em `daily_job_radar_runs` permite resetar a trava diária pelo navegador; colunas `fetched_count`, `filtered_count` e `classified_count` não têm consumidor nos CUJs.
* **Rationale:** Restringir escrita de `daily_job_radar_runs` à Edge Function aumenta segurança com menos SQL; cortar colunas sem consumidor reduz ruído de schema.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Alinhado ao uso de `service_role` pela Edge Function após `auth.getUser()` e à regra de minimalismo.
* ***Proposed Edit:***
  * Location: `Modelo de Dados` (`L106`, `L114`), `Item 1` (`L229`)
  * Change: Configurar RLS de `daily_job_radar_runs` apenas com política `SELECT` (`auth.uid() = user_id`), deixando escrita exclusiva para a Edge Function; em `daily_job_radar_items`, permitir `SELECT` e `UPDATE` no cliente. Remover `fetched_count`, `filtered_count` e `classified_count` da tabela de runs.

### [Issue 8] [`egm-design` / `egm-comprehension` / `egm-zoom-out`] - Severity: Major
* **Affected Scope:** [Lines 133–135, 152–156, 161, 237, 241](./radar-diario-vagas-ia.md#L133-L161) (`Modelo de Dados`, `Edge Function`, `Itens 3 e 4`)
* **Discrepancy Description:** Parâmetros de busca da Adzuna BR (`what_or`, `sort_by=date`, `max_days_old`) e regras de precedência de `work_model` / cálculo de `fit_category` não estão definidos.
* **Rationale:** Enviar múltiplos termos em `what` na Adzuna aplica lógica AND (retornando quase zero vagas); deixar o LLM escolher `fit_category` livremente pode divergir dos scores numéricos.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Definir o contrato de alto nível (sem poluir o doc com regexes) evita bugs imediatos na integração Adzuna e na UI.
* ***Proposed Edit:***
  * Location: `Edge Function` (`L153–161`), `Itens 3 e 4` (`L237`, `L241`)
  * Change: Especificar chamada Adzuna BR com `what_or`, `sort_by=date`, `max_days_old=7`, `results_per_page=50` e timeout `8000ms`; definir precedência `remoto > hibrido > presencial` (descartando se indeterminado fora de Brasília-DF); derivar `fit_category` deterministicamente no código (`direct_fit_score >= 70 -> 'aderente'`; senão `adaptability_score >= 60 -> 'adaptavel'`; senão `'baixa_aderencia'`).

### [Issue 9] [`egm-comprehension` / `egm-structural` / `egm-codebase-details`] - Severity: Major
* **Affected Scope:** [Lines 29, 61, 138, 169, 257, 271–278](./radar-diario-vagas-ia.md#L138-L169) (`Goals`, `CUJ 2`, `Modelo de Dados`, `Itens 8, 12 e 13`)
* **Discrepancy Description:** Falta definir o ciclo de vida de `triage_status = 'enviada_analise'` e o escopo de `listActiveItems`, o consumo único de `analyzerDraft`, e a preservação de `work_model` ao gerar currículo no `JobAnalyzer`.
* **Rationale:** `enviada_analise` sem transição definida vira estado zumbi; `analyzerDraft` sem `onDraftConsumed` sobrescreve futuras visitas manuais à aba `analyze`; `Home.tsx` fixa `work_model: "hibrido"`.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Simplificar `triage_status` para 3 estados (`nova | salva_kanban | descartada`), explicitar que `listActiveItems` retorna `triage_status != 'descartada'`, consumir `analyzerDraft` uma única vez e preservar `workModel` fecha todas as lacunas.
* ***Proposed Edit:***
  * Location: `Goals` (`L29`), `CUJ 1` (`L52`), `Modelo de Dados` (`L138`), `Itens 8, 12 e 13` (`L257`, `L271–278`)
  * Change: Reduzir `triage_status` para `'nova' | 'salva_kanban' | 'descartada'` (deixando "Analisar no JobAnalyzer" como navegação pura com `initialDraft` consumido via `onDraftConsumed`), definir `listActiveItems` como `triage_status != 'descartada'`, adicionar `workModel` em `RadarJobDraft` para repasse em `onGenerateResume`, e mencionar na CUJ 1 o estado vazio de 0 vagas novas.

### [Issue 10] [`egm-implementation-readiness` / `egm-codebase-details`] - Severity: Major
* **Affected Scope:** [Lines 283–285](./radar-diario-vagas-ia.md#L283-L285) (`Item 15 — tests/e2e/radar.spec.ts`)
* **Discrepancy Description:** `JobPortalsView` fica atrás de `ProtectedRoute` (`AuthContext`), mas o Item 15 não especifica como autenticar/mockar a sessão no Playwright.
* **Rationale:** Sem mock explícito de sessão, o teste é redirecionado para `/login` antes de alcançar `JobPortalsView`.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Verificado em `src/rotas/ProtectedRoute.tsx` e `src/context/AuthContext.tsx`.
* ***Proposed Edit:***
  * Location: `Item 15` (`L283–285`)
  * Change: Especificar uso de `page.addInitScript` populando sessão fake no `localStorage` + `page.route('**/auth/v1/user', ...)` e `page.route('**/functions/v1/daily-ai-jobs-radar', ...)`.

### [Issue 11] [`egm-zoom-out` / `egm-codebase-details`] - Severity: Major
* **Affected Scope:** [Lines 20, 74, 211, 235–237, 267–270](./radar-diario-vagas-ia.md#L235-L270) (`The Problem`, `Q2`, `NFRs`, `Itens 3 e 11`)
* **Discrepancy Description:** (a) `The Problem` #2 reclama dos links fixos de "Suporte TI" em `JobPortalsView.tsx`, mas o Item 11 não os atualiza; (b) `openSideBrowser` (`popupLauncher.ts`) não rejeita protocolos inseguros; (c) Stage 5/8 questionam `JobSourceAdapter` como YAGNI para 1 fonte.
* **Rationale:** Atualizar os 5 `searchUrl` resolve o Problema #2 diretamente e endurecer `openSideBrowser` evita duplicar lógica de URL; já `JobSourceAdapter` foi decisão explícita do autor em Q2 (`L74`).
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Aplicar os ajustes objetivos nos links de `JobPortalsView.tsx` e em `src/shared/utils/popupLauncher.ts`, mantendo `JobSourceAdapter` conforme Q2 (`L74`, decisão registrada do autor) e registrando explicitamente no Item 11 que os estilos legados não tocados de `JobPortalsView.tsx` permanecem intactos fora do escopo.
* ***Proposed Edit:***
  * Location: `NFRs` (`L211`), `Item 11` (`L267–270`) + novo subitem em `Target Files` para `src/shared/utils/popupLauncher.ts`
  * Change: Incluir atualização dos 5 `searchUrl` de `PORTALS` em `JobPortalsView.tsx` para foco em IA (explicitando que estilos legados fora da área tocada não serão reescritos) e endurecer `openSideBrowser` em `src/shared/utils/popupLauncher.ts` rejeitando protocolos diferentes de `http:`/`https:`.

### [Issue 12] [`egm-codebase-details` / `egm-zoom-out`] - Severity: Major
* **Affected Scope:** [Lines 247–253](./radar-diario-vagas-ia.md#L247-L253) (`Itens 6 e 7`)
* **Discrepancy Description:** `DailyJobRadar.ts` e `database.types.ts` duplicam union types (`RadarFitCategory`, `RadarTriageStatus`) e schemas Zod no frontend que já são validados na fronteira da Edge Function.
* **Rationale:** Em `src/shared/types/database.types.ts`, todos os unions de banco (`WorkModel`, `ApplicationStatus`) ficam centralizados no topo do arquivo.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Mantém consistência com `src/shared/types/database.types.ts` e elimina duplicação.
* ***Proposed Edit:***
  * Location: `Itens 6 e 7` (`L247–253`)
  * Change: Exportar `DailyRadarRunStatus`, `RadarFitCategory` e `RadarTriageStatus` em `src/shared/types/database.types.ts` e reutilizá-los nas interfaces TypeScript de `src/domain/entities/DailyJobRadar.ts` (mantendo validação Zod estritamente na Edge Function).

### [Issue 13] [`egm-comprehension` / `egm-zoom-out`] - Severity: Nit
* **Affected Scope:** [Lines 38, 211, 289, 296, 302](./radar-diario-vagas-ia.md#L211-L296) (`Non-Goals`, `NFRs`, `Item 16`, `Verification Plan`)
* **Discrepancy Description:** `openSideBrowser`, `graphify` e siglas (`ATS`, `EGM`) aparecem sem referência inline de caminho ou expansão.
* **Rationale:** Adicionar o caminho entre parênteses melhora a legibilidade para novos leitores sem inflar o documento.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Ajuste de 1 linha sem custo estrutural.
* ***Proposed Edit:***
  * Location: `Non-Goals` (`L38`), `NFRs` (`L211`), `Item 16` (`L289`)
  * Change: Referenciar `openSideBrowser` (`src/shared/utils/popupLauncher.ts`), `graphify` (grafo de dependências do código, `AGENTS.md`), e expandir `ATS (Applicant Tracking System)` na primeira menção.

### [Issue 14] [`egm-style`] - Severity: Nit
* **Affected Scope:** [Lines 27, 29, 90, 106, 128, 146, 208–211](./radar-diario-vagas-ia.md#L27-L211) (`Goals`, `Technical Plan`, `NFRs`)
* **Discrepancy Description:** Repetição de requisitos de JWT/RLS entre *Goals*, *Technical Plan* e *NFRs*, e ordem documental do enum `work_model`.
* **Rationale:** Cosmético; não gera ambiguidade funcional.
* ***AI Suggestion:*** DECLINE
* ***Justification:*** Nit cosmético sem impacto na implementabilidade ou clareza técnica.

### [Issue 15] [`egm-style` / `egm-codebase-details`] - Severity: Nit
* **Affected Scope:** [Lines 217, 233, 287–289, 295](./radar-diario-vagas-ia.md#L287-L299) (`Item 2`, `Item 16`, `Verification Plan`)
* **Discrepancy Description:** O `Verification Plan` omite `npx semgrep scan --config auto`, o comentário de `consolidated_schema.sql` cita "15 tabelas" (passará a 17) e o Item 16 não cita explicitamente o histórico de alterações do `AGENTS.md`.
* **Rationale:** Alinha 100% com as regras do `AGENTS.md`.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Correção pontual que garante conformidade com a Regra 1 e a Seção 11 do `AGENTS.md`.
* ***Proposed Edit:***
  * Location: `Item 2` (`L233`), `Item 16` (`L287–289`), `Verification Plan` (`L295`)
  * Change: Incluir atualização do comentário para 17 tabelas em `consolidated_schema.sql`, registro na tabela de histórico do `AGENTS.md` e `npx semgrep scan --config auto` no `Verification Plan`.
