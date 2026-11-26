# Relatório Consolidado de Revisão EGM — Radar Diário de Vagas IA

* **Target:** `./radar-diario-vagas-ia.md`
* **Date:** 2026-11-26
* **Estágios Executados:** Stage 5 (`zoom_out_report.md`), Stage 6 (`comprehension_report.md`), Stage 7 (`critic_report.md`), Stage 8 (`intermediate_zoom_out_report.md`), Stage 9 (`implementation_readiness_report.md`)
* **Veredito Geral:** **Não pronto para implementação antes de resolver os Blockers**

---

## Resumo Executivo por Severidade

* **🔴 Blockers:** 5 consolidados (ação obrigatória antes de implementar)
* **🟡 Majors:** 7 consolidados (recomendado resolver antes de implementar)
* **🟢 Nits:** 3 consolidados

---

## 🔴 Blockers (Ação Obrigatória Antes de Implementar)

### C-B1 — Deduplicação contra `public.jobs` incompatível com o schema real + função `set_updated_at()` inexistente
* **Descrição:** `public.jobs` em `supabase/consolidated_schema.sql` (`L134–145`) não possui `fingerprint`, `company_name` nem `work_model` (usa `company_id` FK para `public.companies`, `title` e `source_url`). Além disso, `consolidated_schema.sql` não possui nenhuma função `set_updated_at()` para os triggers de `updated_at` previstos na migration `003_daily_job_radar.sql`.
* **Correção necessária:** Declarar criação da função `public.set_updated_at()` em `003_daily_job_radar.sql` e `consolidated_schema.sql`. Deduplicar contra `public.jobs` via query leve `select('title, source_url, companies(name)')` comparando `normalizeUrl(source_url)` OU `normalize(title) | normalize(companies.name)`.

### C-B2 — Contrato incompleto da Edge Function (`daily-ai-jobs-radar`): cliente Supabase, HTTP schema, falha parcial e `ai_generations`
* **Descrição:** O documento omite como o client Supabase é instanciado na Edge Function (`SUPABASE_ANON_KEY` + header `Authorization` sob RLS vs. `SUPABASE_SERVICE_ROLE_KEY`), o contrato HTTP exato (`{ mode }` -> `{ status, run, items, error }`), o tratamento de falha parcial e os campos `NOT NULL` de `public.ai_generations` (`model`, `prompt_version`). Além disso, nenhuma outra Edge Function ou tela do CVCerto grava em `ai_generations`.
* **Correção necessária:** Especificar cliente Supabase e schema HTTP na Edge Function; decidir entre **cortar escrita em `ai_generations` do MVP (recomendação Stage 5/8)** ou preencher explicitamente `model` e `prompt_version`.

### C-B3 — Ausência de guard para `master_facts` vazio
* **Descrição:** Contas novas ou que ainda não salvaram o Perfil Mestre podem ter 0 linhas ativas em `public.master_facts`. Sem pré-verificação, a Edge Function gasta cota da Adzuna/Gemini sem Base da Verdade e marca a rodada do dia como `completed`.
* **Correção necessária:** Antes de chamar APIs externas, verificar `master_facts`; se vazio, retornar `{ status: 'missing_profile' }` sem gravar `completed` em `daily_job_radar_runs` e exibir aviso com CTA na UI.

### C-B4 — Concorrência em `retry`/`next_batch` e perda de vagas no cursor `next_page` (Tensão Q1)
* **Descrição:** `INSERT ... ON CONFLICT DO NOTHING` só protege `mode: 'auto'`. Para `retry` e `next_batch`, a linha do dia já existe; sem `UPDATE` atômico condicional, requisições simultâneas duplicam chamadas. Além disso, incrementar `next_page` no `next_batch` descarta excedentes pré-filtrados da página atual.
* **Correção necessária (escolher uma via):**
  * **Via A — Simplificação Stage 5/8 (recomendada):** Remover `next_batch`, `next_page`, `has_more` e o loop de 3 lotes do MVP, processando 1 lote de **10–12 vagas novas/dia** em 1 chamada ao Gemini. Trava fica reduzida a `INSERT ... ON CONFLICT DO NOTHING` (`auto`) e `UPDATE ... WHERE status = 'failed' RETURNING id` (`retry`).
  * **Via B — Manter Q1 com hardening Stage 7/9:** Especificar `UPDATE ... SET status = 'running' WHERE ... RETURNING *` atômico, regra de falha parcial por lote e reconsulta de `next_page` antes de incrementar.

### C-B5 — Fluxo "Salvar no Kanban" incompleto (`ApplicationItem`, `linkApplication` e sincronização em `Home.tsx`)
* **Descrição:** `JobApplicationsRepository.createApplication` retorna apenas a linha crua de `job_applications` sem o join `jobs` / `companies` exigido por `ApplicationItem`. Falta definir quem chama `linkApplication(itemId, createdAppId)`, como `Home.tsx` atualiza `applications` sem recarregar a página e como prevenir clique duplo por card.
* **Correção necessária:** Definir assinatura completa de `onSaveRadarToKanban` em `Home.tsx` recarregando `listApplications(user.id)` (ou retornando join completo), vinculando `linked_application_id` via `DailyJobRadarRepository.linkApplication` e travando botão por card (`savingItemIds`).

---

## 🟡 Majors (Recomendado Resolver Antes de Implementar)

* **C-M1 — Dual `UNIQUE` em `daily_job_radar_items`:** Manter apenas `UNIQUE (user_id, fingerprint)` + deduplicação em memória + `ON CONFLICT (user_id, fingerprint) DO NOTHING` para evitar falhas de insert em lote no Postgres.
* **C-M2 — RLS restrita em `daily_job_radar_runs` e colunas `*_count`:** Restringir `daily_job_radar_runs` a `SELECT` apenas no cliente (escrita exclusiva pela Edge Function) para impedir reset manual do limite diário; cortar colunas `*_count` sem consumidor nos CUJs.
* **C-M3 — Parâmetros Adzuna BR, `fit_category` determinístico e `work_model`:** Especificar `what_or`, `sort_by=date` e `max_days_old=7`; calcular `fit_category` deterministicamente no código a partir dos scores (`direct_fit_score >= 70 -> 'aderente'`, `adaptability_score >= 60 -> 'adaptavel'`, senão `'baixa_aderencia'`); definir precedência `remoto > hibrido > presencial`.
* **C-M4 — Ciclo de vida de `triage_status`, `analyzerDraft` e `work_model` no `JobAnalyzer`:** Simplificar `triage_status` para `nova | salva_kanban | descartada` (ou explicitar `enviada_analise` em `listActiveItems`), consumir `analyzerDraft` uma única vez (`onDraftConsumed`) e preservar `workModel` ao gerar currículo.
* **C-M5 — Mock de autenticação Playwright em `tests/e2e/radar.spec.ts`:** Documentar o padrão de mock de sessão (`page.addInitScript` + `page.route('**/auth/v1/user')` e `**/functions/v1/daily-ai-jobs-radar`) para atravessar `ProtectedRoute`.
* **C-M6 — Alinhamento de escopo (`JobSourceAdapter`, links de "Suporte TI" e validação de URL):** Avaliar trocar `JobSourceAdapter` por `fetchAdzunaBrJobs` (YAGNI); atualizar os 5 `searchUrl` hardcoded de "Suporte TI" em `JobPortalsView.tsx` (ou removê-los de `The Problem`); adicionar `isSafeHttpUrl` em `popupLauncher.ts` (`openSideBrowser`).
* **C-M7 — Evitar duplicação de union types:** Exportar `DailyRadarRunStatus`, `RadarFitCategory` e `RadarTriageStatus` em `src/shared/types/database.types.ts` e reutilizá-los em `DailyJobRadar.ts` (evitando duplicar schemas Zod no frontend).

---

## 🟢 Nits

* **C-N1:** Referenciar caminhos inline de `openSideBrowser` (`src/shared/utils/popupLauncher.ts`) e `graphify` (`AGENTS.md`), e expandir siglas (`ATS`, `EGM`).
* **C-N2:** Enxugar repetição de detalhes de segurança entre `Goals`, `Technical Plan` e `NFRs`, e alinhar ordem documental do enum `work_model` com `consolidated_schema.sql`.
* **C-N3:** Incluir `npx semgrep scan --config auto` no `Verification Plan`, atualizar comentário de "15 tabelas" para "17 tabelas" em `consolidated_schema.sql` e citar explicitamente o histórico de alterações no Item 16 (`AGENTS.md`).

---

## Matriz de Rastreabilidade (Traceability Matrix)

| Consolidado | Origens Brutas | Tema |
| :--- | :--- | :--- |
| **C-B1** | S6-M3, S7-B2, S8-2, S9-B2 | Schema `public.jobs` para dedup + função `set_updated_at()` |
| **C-B2** | S5-M3, S6-M6, S7-M5, S8-5, S9-B1 | Contrato HTTP/Supabase da Edge Function + `ai_generations` |
| **C-B3** | S5-M5, S7-B3, S8-3 | Guard para `master_facts` vazio |
| **C-B4** | S5-M1, S6-M2, S7-B1, S8-1, S9-M4 | Concorrência `retry`/`next_batch`, cursor `next_page` e simplificação Q1 |
| **C-B5** | S7-M6, S8-7, S9-B3 | Fluxo "Salvar no Kanban", `ApplicationItem` e `Home.tsx` |
| **C-M1** | S5-M3, S7-M4, S8-4 | Dual `UNIQUE` em `daily_job_radar_items` |
| **C-M2** | S5-M3, S7-M5, S8-5 | RLS restrita em `daily_job_radar_runs` e remoção de `*_count` |
| **C-M3** | S6-M1, S6-M5, S7-M7, S7-N9, S8-9 | Parâmetros Adzuna BR, `fit_category` determinístico e `work_model` |
| **C-M4** | S6-M4, S7-M6, S7-M8, S8-7, S9-M6 | `triage_status`, `analyzerDraft` consume-once e `workModel` |
| **C-M5** | S9-M5 | Mock de sessão no Playwright (`radar.spec.ts`) |
| **C-M6** | S5-M2, S5-M4, S5-N2, S8-6, S8-8, S9-M7 | `JobSourceAdapter` (YAGNI), links "Suporte TI" e `isSafeHttpUrl` |
| **C-M7** | S5-N1, S9-M8 | Centralização de types em `database.types.ts` |
| **C-N1** | S6-M6, S6-N7, S8-10 | Referências inline (`openSideBrowser`, `graphify`) e siglas |
| **C-N2** | S7-N10 | Redundância de segurança entre seções e ordem do enum `work_model` |
| **C-N3** | S9-N9 | `semgrep` no Verification Plan, comentário 17 tabelas e histórico `AGENTS.md` |
