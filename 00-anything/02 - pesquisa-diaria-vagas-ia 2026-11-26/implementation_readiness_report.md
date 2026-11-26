# Stage 9 — Implementation Readiness Report (`DetailedRange`: L223–302)

**Target:** `00-anything/02 - pesquisa-diaria-vagas-ia 2026-11-26/radar-diario-vagas-ia.md` (linhas 223–302)
**Status dos Reviewers:** `egm-implementation-readiness` (completed) | `egm-codebase-details` (completed) | `egm-style` (completed)
**Resumo de Severidade:** 3 🔴 Blockers | 5 🟡 Majors | 1 🟢 Nit
**Veredito:** **Não pronto para implementação direta** — os 3 Blockers abaixo forçariam o implementador a inventar contratos de Edge Function/SQL/estado do React ou gerariam bugs silenciosos de tipagem e perda de vagas.

---

## 🔴 Blockers

### 1. Edge Function sem contrato de cliente Supabase, payload/response, falha parcial e colunas `NOT NULL` de `ai_generations`
* **Lenses:** `egm-implementation-readiness`, `egm-codebase-details`
* **Escopo:** Item 5 (L243–245) vs. `supabase/functions/analyze-job/index.ts` e `supabase/consolidated_schema.sql` (L234–247)
* **Discrepância:** A única Edge Function existente (`analyze-job/index.ts`) não usa `@supabase/supabase-js`, não valida JWT e não grava em banco — não há padrão local para copiar. O Item 5 omite:
  1. Como o client Supabase será instanciado na Edge Function (client autenticado com `Authorization` do request + `SUPABASE_ANON_KEY` sob RLS vs. `SUPABASE_SERVICE_ROLE_KEY`).
  2. O contrato exato de entrada/saída HTTP (ex.: `{ mode }` -> `{ status, run, items, error }`, códigos `401/409/429/500`) e o tratamento de **falha parcial** (ex.: lote 1 de 8 persiste e lote 2 retorna 429 — a run fecha `failed` ou `completed`?).
  3. Em `public.ai_generations` (`consolidated_schema.sql` L238–240), `kind`, `model` e `prompt_version` são `NOT NULL`. O plano define apenas `kind = 'daily_radar_triage'` (L162), omitindo `model` e `prompt_version`.
* **Recomendação:** Especificar no Item 5: (a) uso de `createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization } } })` respeitando RLS (ou justificar service role), (b) schema do payload/response e regra de falha parcial, (c) `model` (com fallback, como em `analyze-job/index.ts` L190) e `prompt_version` para `ai_generations`.

### 2. Trigger `updated_at` inexistente no banco e estratégia de deduplicação contra `public.jobs` indefinida
* **Lenses:** `egm-codebase-details`, `egm-implementation-readiness`
* **Escopo:** Itens 1, 2 e 5 (L227–233, L245) vs. `supabase/consolidated_schema.sql` (L134–145, L271–331)
* **Discrepância:**
  1. O Item 1 (L229) menciona *"trigger de `updated_at`"*, mas `consolidated_schema.sql` **não possui** nenhuma função `set_updated_at()` / `update_updated_at_column()`. Sem criar explicitamente a função na migration `003_daily_job_radar.sql`, o SQL falhará.
  2. O Item 5 (L245) exige deduplicação contra `public.jobs`, mas `public.jobs` (`consolidated_schema.sql` L134–145) **não tem** `fingerprint`, `company_name` nem `work_model` — tem apenas `title`, `source_url`, `company_id` (FK para `companies`) e `raw_description`. O plano não define qual chave cruza `NormalizedCandidateJob` com `public.jobs`.
* **Recomendação:** (a) Declarar criação da função `public.set_updated_at()` na `003_daily_job_radar.sql` e no `consolidated_schema.sql`; (b) definir explicitamente a regra de dedup contra `public.jobs` (ex.: `normalizeUrl(source_url)` OU `normalize(title) + '|' + normalize(companies.name)` via `select("title, source_url, companies(name)")`).

### 3. Fluxo "Salvar no Kanban" incompleto: retorno cru de `createApplication` quebra `ApplicationItem` e falta dono da atualização de `linked_application_id`
* **Lenses:** `egm-implementation-readiness`, `egm-codebase-details`
* **Escopo:** Itens 8, 9, 10, 11 e 13 (L255–278) vs. `src/infrastructure/supabase/JobApplicationsRepository.ts` (L96–114) e `src/screens/Home.tsx` (L163–220)
* **Discrepância:** `JobApplicationsRepository.createApplication` retorna apenas a linha crua de `job_applications` (`.select().single()`), **sem** o objeto aninhado `jobs: { title, raw_description, source_url, companies: { name } }` exigido por `ApplicationItem`. Além disso, o plano não especifica:
  * Qual camada chama `DailyJobRadarRepository.linkApplication(itemId, createdAppId)` e muda `triage_status` para `'salva_kanban'` (`Home.tsx` ou `DailyAiJobsRadar.tsx`?).
  * Como evitar clique duplo ou estado órfão se `createApplication` criar a vaga e `linkApplication` falhar.
* **Recomendação:** Definir a assinatura exata de `onSaveRadarToKanban(item: DailyRadarItem): Promise<string>` em `Home.tsx` recarregando `listApplications(user.id)` (ou retornando join completo), retornando o `applicationId` criado para `DailyAiJobsRadar` vincular via `linkApplication`, com estado de loading por card (`savingItemIds`).

---

## 🟡 Majors

### 4. `next_batch` pula vagas pré-filtradas excedentes da mesma página
* **Lenses:** `egm-implementation-readiness`
* **Escopo:** Itens 3 e 5 (L235–237, L245; também L150 e L159)
* **Discrepância:** Se a página 1 do Adzuna BR retornar 40 vagas válidas após o Estágio 1, o teto de 24 classifica apenas as 24 primeiras e marca `has_more = true`. Porém, o plano diz que `next_batch` *"incrementa `next_page`"* (L150), descartando silenciosamente as 16 vagas restantes da página 1. Além disso, o Item 3 não define a query exata do Adzuna BR (`what_or` vs. N chamadas), `results_per_page`, `max_days_old` e timeout.
* **Recomendação:** Definir que `next_batch` **reconsulta `next_page`** e só incrementa `next_page` quando a página atual esgotar; especificar parâmetros do Adzuna BR (`what_or`, `results_per_page=50`, `max_days_old`, timeout `8000ms`).

### 5. `tests/e2e/radar.spec.ts` não especifica como contornar o `ProtectedRoute` + `AuthContext`
* **Lenses:** `egm-implementation-readiness`, `egm-codebase-details`
* **Escopo:** Item 15 (L283–285) vs. `tests/e2e/rotas.spec.ts` e `src/context/AuthContext.tsx` (L30–54)
* **Discrepância:** `JobPortalsView` está atrás do `ProtectedRoute` (exige `session` ativa em `supabase.auth.getSession()`). O Item 15 fala apenas em *"mockando chamadas do Supabase/Edge Function"*, sem indicar como autenticar a sessão no Playwright.
* **Recomendação:** Especificar no Item 15 o padrão de mock de sessão no Playwright (`page.addInitScript` + `page.route('**/auth/v1/user', ...)` e `page.route('**/functions/v1/daily-ai-jobs-radar', ...)`).

### 6. `JobAnalyzer.tsx` e `Home.tsx`: desmontagem condicional, marcação de `enviada_analise` e `work_model` perdido
* **Lenses:** `egm-codebase-details`, `egm-implementation-readiness`
* **Escopo:** Itens 12 e 13 (L271–278) vs. `src/screens/Home.tsx` (L171, L305–351) e `src/presentation/components/JobAnalyzer.tsx` (L242–247)
* **Discrepância:** Em `Home.tsx` L327–331, `<JobAnalyzer />` é desmontado/montado a cada troca de aba; não está definido se `summary_snippet` entra puro ou com aviso preliminar, quando `triage_status` muda para `'enviada_analise'`, nem como preservar `work_model` (`remoto`/`presencial`) ao gerar currículo.
* **Recomendação:** Incluir `workModel` em `RadarJobDraft`, repassá-lo em `onGenerateResume` se presente, definir transição para `'enviada_analise'` e limpar `analyzerDraft` após consumo.

### 7. Validação de URL no frontend e ambiguidade da regra `Stl` em `JobPortalsView.tsx`
* **Lenses:** `egm-codebase-details`
* **Escopo:** Itens 10 e 11 (L263–270) vs. `src/shared/utils/popupLauncher.ts` (L16–18), `src/presentation/components/JobPortalsView.tsx` e `AGENTS.md` (Seção 2)
* **Discrepância:** `openSideBrowser` (`popupLauncher.ts` L16–18) apenas prefixa `https://` se não começar com `http(s)://`. Além disso, `JobPortalsView.tsx` tem styled-components legados sem sufixo `Stl` e o Item 11 não explicita o escopo de migração.
* **Recomendação:** Adicionar `isSafeHttpUrl(url)` no frontend (`popupLauncher.ts` / `DailyAiJobsRadar.tsx`) e explicitar no Item 11 o escopo de alteração em `JobPortalsView.tsx`.

### 8. Duplicação de union types entre `database.types.ts` e `DailyJobRadar.ts`
* **Lenses:** `egm-codebase-details`, `egm-style`
* **Escopo:** Itens 6 e 7 (L247–253) vs. `src/shared/types/database.types.ts` (L9–31)
* **Discrepância:** Em `database.types.ts`, todos os enums/unions de banco são exportados no topo do arquivo. O Item 6 declara `RadarFitCategory` e `RadarTriageStatus` em `DailyJobRadar.ts` separadamente.
* **Recomendação:** Exportar `DailyRadarRunStatus`, `RadarFitCategory` e `RadarTriageStatus` em `src/shared/types/database.types.ts` e reutilizá-los em `DailyJobRadar.ts`.

---

## 🟢 Nits

### 9. Lacunas menores de governança no Item 16 e no Verification Plan
* **Lenses:** `egm-style`, `egm-codebase-details`
* **Escopo:** Item 2 (L233), Item 16 (L287–289) e Verification Plan (L291–299) vs. `AGENTS.md` e `consolidated_schema.sql` (L3)
* **Discrepância:** O Verification Plan (L295) omite `npx semgrep scan --config auto`; o comentário de `consolidated_schema.sql` cita *"15 tabelas"* (atualizar para 17); e o Item 16 deve citar explicitamente o registro na tabela de **Histórico de alterações** do `AGENTS.md` (Regra 1).
