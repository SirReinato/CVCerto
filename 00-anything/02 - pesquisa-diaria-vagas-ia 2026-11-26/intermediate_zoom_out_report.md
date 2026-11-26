# Relatório Stage 8 — Intermediate Zoom Out Review (`radar-diario-vagas-ia.md`)

**Escopo auditado:** `00-anything/02 - pesquisa-diaria-vagas-ia 2026-11-26/radar-diario-vagas-ia.md` (linhas 1–302), cruzado com `supabase/consolidated_schema.sql`, `supabase/functions/analyze-job/index.ts`, `src/screens/Home.tsx`, `src/presentation/components/JobPortalsView.tsx` e `src/infrastructure/supabase/JobApplicationsRepository.ts`.

---

## 1. Tensão Central (Stage 5 vs. Stage 7): O Diagnóstico

Metade dos bloqueios técnicos levantados pelo Critic (Stage 7) e pela Compreensão (Stage 6) **não são complexidades inerentes ao problema** — são consequência direta de decisões YAGNI ainda presentes no documento (Q1, Q2, dual `UNIQUE` e `ai_generations`). Endurecer ("hardening") código que não deveria existir no MVP é a definição de over-engineering.

A regra de reconciliação para o Stage 8 é direta: **cortar a complexidade na raiz primeiro; aplicar hardening apenas no que sobreviver.**

---

## 2. Achados e Reconciliação

### [Blocker] 1. Q1 (`next_batch` / 3 lotes de 8 / cursor) gera a maior parte do hardening do Stage 7 (B1) e Stage 6 (M2)
* **Escopo afetado:** `Technical Plan` (Q1, linhas 73, 115, 147–150, 159), `Detailed Implementation Plan` (itens 5 e 10).
* **Racional de simplicidade:** O Stage 7 (B1) está correto em apontar race condition em `next_batch`, perda de cursor e falha parcial entre 3 chamadas sequenciais ao Gemini; o Stage 6 (M2) está correto em apontar que `next_page` descarta excedentes pré-filtrados da página atual. Porém, implementar trava condicional multi-modo + persistência de cursor de página + rollback/retomada de lotes parciais para um MVP pessoal de 1 usuário/dia é **over-engineering severo**.
* **Reconciliação:**
  * **Recomendação forte (simplificar Q1):** Reduzir o MVP para **1 única chamada ao Gemini de 10–12 vagas novas/dia**, removendo `next_batch`, `next_page`, `has_more` e o botão "Buscar próximo lote". Com isso, falha parcial entre lotes, perda de cursor e concorrência de paginação **desaparecem por completo**. A trava fica trivial: `INSERT ... ON CONFLICT (user_id, run_date) DO NOTHING` para `auto`, e um único `UPDATE ... WHERE status = 'failed' RETURNING id` para `retry`.
  * **Se o autor mantiver Q1 inegociável:** Apenas nesse caso o hardening do Stage 7 (B1) e a correção de cursor do Stage 6 (M2) passam a ser obrigatórios — mas o custo em complexidade de estado dobra.

### [Blocker] 2. Deduplicação contra `public.jobs` (Stage 7 B2 / Stage 6 M3) — **ACEITAR (Minimalista)**
* **Escopo afetado:** `Edge Function — Estágio 1` (linha 157), `Detailed Implementation Plan` (item 5, linha 245).
* **Racional de simplicidade:** Verificado em `supabase/consolidated_schema.sql` (linhas 134–145): `public.jobs` não possui `company_name` nem `work_model` — possui `company_id` (FK para `public.companies`), `title` e `source_url`. O desenho atual falha em runtime.
* **Reconciliação (sem over-engineering):** **Não** tentar reconstruir o `fingerprint` completo com `work_model` (o que exigiria join triplo com `job_applications`). Fazer uma única query leve em `public.jobs` com `select('title, source_url, companies(name)')` e deduplicar por **(a) `source_url` normalizada OU (b) `normalize(title) | normalize(companies.name)`**.

### [Blocker] 3. Guard para `master_facts` vazio (Stage 7 B3 / Stage 5 M5) — **ACEITAR (Minimalista)**
* **Escopo afetado:** `Edge Function — Estágio 2` (linha 160), `CUJ 1` (linha 50).
* **Racional de simplicidade:** Em `Home.tsx` (linha 72), `MasterProfileRepository.getOrCreateProfile` roda assincronamente no mount. Se `master_facts` estiver vazio quando a Edge Function executar, o Gemini classifica sem "Base da Verdade" e marca o dia como `completed`.
* **Reconciliação (sem over-engineering):** Adicionar apenas um guard de 5 linhas na Edge Function: se `master_facts` retornar vazio, devolver `{ status: 'missing_profile' }` **sem** persistir `completed` em `daily_job_radar_runs` (evitando bloquear o dia) e exibir aviso na UI. **Não** duplicar lógica de seed do `MASTER_PROFILE` no backend.

### [Major] 4. Dual `UNIQUE` em `daily_job_radar_items` (Stage 5 M3 + Stage 7 M4) — **RESOLVER SIMPLIFICANDO**
* **Escopo afetado:** `Modelo de Dados` (linha 141), `Detailed Implementation Plan` (item 1, linha 229).
* **Racional de simplicidade:** Stage 7 (M4) confirma que duas constraints `UNIQUE` (`(user_id, source, external_id)` e `(user_id, fingerprint)`) quebram `INSERT ... ON CONFLICT` em lote no Postgres. Em vez de criar fallback de insert linha-a-linha, a solução é a do Stage 5: **manter apenas 1 constraint `UNIQUE (user_id, fingerprint)`** (com `ON CONFLICT (user_id, fingerprint) DO NOTHING`), que já cobre deduplicação intra-fonte e cross-source.

### [Major] 5. `ai_generations` e colunas de telemetria vs. RLS em `daily_job_radar_runs` (Stage 5 M3 + Stage 7 M5)
* **Escopo afetado:** `Modelo de Dados` (linhas 106, 114), `Edge Function` (linha 162), `NFRs` (linha 215).
* **Racional de simplicidade:**
  * **`ai_generations` (Cortar — YAGNI):** Verificado em `supabase/functions/analyze-job/index.ts`: nenhuma Edge Function ou tela do CVCerto grava ou lê `public.ai_generations`. Adicionar escrita nessa tabela (que exige `model` e `prompt_version` `NOT NULL`) só para o Radar cria acoplamento morto e risco de falha de insert. **Remover do MVP** (ou, se mantido por exigência do autor, declarar explicitamente `model` e `prompt_version`).
  * **Colunas `fetched_count`, `filtered_count`, `classified_count` (Cortar — YAGNI):** Nenhum CUJ ou componente de UI consome esses contadores. Remover da tabela `daily_job_radar_runs`.
  * **RLS restrita em `daily_job_radar_runs` (Aceitar Stage 7 M5):** Em vez de liberar `SELECT/INSERT/UPDATE/DELETE` para o client (linha 106), criar apenas política `SELECT` em `daily_job_radar_runs` (escrita exclusiva da Edge Function) e `SELECT/UPDATE` em `daily_job_radar_items`. É **menos SQL** e mais seguro.

### [Major] 6. Abstração especulativa `JobSourceAdapter` (Stage 5 M2)
* **Escopo afetado:** `Technical Plan` (Q2, linhas 74, 151–153), `Detailed Implementation Plan` (item 3, linhas 235–237).
* **Racional de simplicidade:** Criar interface genérica `JobSourceAdapter` e diretório `adapters/` para uma única fonte (`Adzuna BR`) viola YAGNI (Rule of Three). Uma função direta `fetchAdzunaBrJobs(...)` retornando `NormalizedCandidateJob[]` entrega o mesmo isolamento de schema/UI sem cerimônia; extrair interface quando houver uma 2ª fonte real custa 5 minutos.

### [Major] 7. Máquina de estados de `triage_status` (`enviada_analise`) e sincronização do `Home.tsx` (Stage 6 M4 + Stage 7 M6 e M8)
* **Escopo afetado:** `Goals` (linha 29), `Modelo de Dados` (linha 138), `Integração no Frontend` (linhas 166–169), `Detailed Implementation Plan` (itens 8, 12, 13).
* **Racional de simplicidade:**
  * **Stage 7 M6 (`Home.tsx` + `analyzerDraft`) — ACEITAR:** Verificado em `JobApplicationsRepository.ts` (linhas 96–114): `createApplication` retorna apenas a linha crua de `job_applications` sem o join `jobs`/`companies` exigido por `ApplicationItem`. `Home.tsx` deve recarregar `listApplications(user.id)` após criar (mesmo padrão do `useEffect` na linha 76) e limpar `analyzerDraft` via `onDraftConsumed` após uso. Correção trivial e necessária.
  * **Stage 6 M4 / Stage 7 M8 (`enviada_analise`) — SIMPLIFICAR:** Como Q5 define que "Analisar no JobAnalyzer" apenas navega com rascunho sem criar candidatura, persistir `enviada_analise` cria um estado zumbi caso o usuário desista na aba `analyze`. **Simplificação:** reduzir `triage_status` para 3 estados (`nova | salva_kanban | descartada`), deixando "Analisar no JobAnalyzer" como ação pura de navegação (ou, se mantido `enviada_analise`, deixar explícito que `listActiveItems` inclui `nova` e `enviada_analise`). Não criar um CUJ separado para empty state — uma frase no CUJ 1 basta.

### [Major] 8. Desalinhamento com o Problema Raiz: links hardcoded de "Suporte TI" em `JobPortalsView.tsx` (Stage 5 M4)
* **Escopo afetado:** `The Problem` (item 2, linha 20) vs. `Detailed Implementation Plan` (item 11, linhas 267–269).
* **Racional de simplicidade:** Verificado em `JobPortalsView.tsx` (linhas 46, 59, 72, 98, 111): os 5 `searchUrl` ainda apontam para "Suporte TI / Analista de Suporte". O documento declara isso como um dos 4 problemas centrais (linha 20), mas o plano de implementação não toca nesses links. **Decisão binária:** ou atualizar os 5 links para termos de IA no mesmo item 11, ou remover o item 2 de `The Problem` (declarando-o fora de escopo).

### [Major] 9. Thresholds de `fit_category` e parâmetros da Adzuna — Separar contrato de alto nível de "Weeds" (Stage 6 M1, M5 + Stage 7 M7)
* **Escopo afetado:** `Edge Function` (linhas 153–161).
* **Racional de simplicidade:**
  * **Aceitar (alto nível, 2 linhas):** (a) Calcular `fit_category` **deterministicamente no código** a partir dos scores (`direct_fit_score >= 70 -> 'aderente'`; senão `adaptability_score >= 60 -> 'adaptavel'`; senão `'baixa_aderencia'`) em vez de pedir ao Gemini para classificar uma 3ª coluna livremente — reduz inconsistência e simplifica o prompt/Zod; (b) Especificar na chamada Adzuna o uso de `what_or`, `sort_by=date` e `max_days_old=7` para evitar reprocessar vagas antigas; (c) Definir precedência simples de `work_model` (`remoto > hibrido > presencial`).
  * **Rejeitar como "Weeds" (não inflar o doc):** Não especificar tabelas de stopwords, regexes lexicais PT-BR ou heurísticas detalhadas de parsing de string no design doc — isso pertence à implementação de `deterministicFilter.ts`.

### [Nit] 10. Termos do repositório sem referência curta (Stage 6 M6)
* **Escopo afetado:** `NFRs` (linha 211: `openSideBrowser`) e `Detailed Implementation Plan` (item 16: `graphify`).
* **Racional de simplicidade:** Ambos existem no projeto (`src/shared/utils/popupLauncher.ts` e `AGENTS.md`). Apenas adicionar o caminho/contexto entre parênteses na primeira menção — sem criar seção de glossário.

---

## 3. Tabela-Resumo de Decisões (Stage 8)

| Origem | Item | Veredicto Stage 8 | Ação no Design Doc |
| :--- | :--- | :--- | :--- |
| S5 M1 + S6 M2 + S7 B1 | `next_batch` / 3 lotes de 8 / trava multi-modo / cursor | **Cortar na raiz (YAGNI)** | Simplificar Q1 para 1 lote (10–12 vagas/dia) sem `next_batch`/`next_page`/`has_more`. Se Q1 for mantida pelo autor, aplicar B1 + M2 integralmente. |
| S6 M3 + S7 B2 | Dedup contra `public.jobs` (schema real) | **Aceitar (Blocker real)** | Usar `select('title, source_url, companies(name)')` com match por `source_url` ou `title\|company`. |
| S5 M5 + S7 B3 | Guard `master_facts` vazio | **Aceitar (Blocker real)** | Retornar `missing_profile` sem gravar `completed` (sem duplicar seed no backend). |
| S5 M3 + S7 M4 | Dual `UNIQUE` em `daily_job_radar_items` | **Simplificar** | Manter apenas `UNIQUE (user_id, fingerprint)` + `ON CONFLICT DO NOTHING`. |
| S5 M3 + S7 M5 | `ai_generations`, contadores e RLS | **Cortar `ai_generations`/contadores; Aceitar RLS restrita** | Remover escrita em `ai_generations` e contadores `*_count`; restringir `daily_job_radar_runs` a `SELECT` para o client. |
| S5 M2 | `JobSourceAdapter` | **Cortar (YAGNI)** | Trocar interface/pasta `adapters/` por função direta `fetchAdzunaBrJobs`. |
| S7 M6 | `Home.tsx` sync `applications` + `analyzerDraft` | **Aceitar (Bug real)** | Recarregar `listApplications(user.id)` após criar e consumir `analyzerDraft` uma única vez. |
| S6 M4 + S7 M8 | `enviada_analise` + empty state CUJ | **Simplificar** | Reduzir `triage_status` para 3 valores (`nova \| salva_kanban \| descartada`) ou explicitar `listActiveItems` sem criar CUJ extra. |
| S6 M1, M5 + S7 M7 | Thresholds `fit_category` + params Adzuna + `work_model` | **Aceitar contrato; Rejeitar weeds** | `fit_category` calculado deterministicamente; Adzuna com `what_or`/`sort_by=date`/`max_days_old=7`; sem regexes/stopwords no doc. |
| S5 M4 | Links "Suporte TI" em `JobPortalsView.tsx` | **Alinhar escopo** | Atualizar os 5 `searchUrl` ou remover item 2 de `The Problem`. |
| S6 M6 | `openSideBrowser` / `graphify` | **Nit** | Citar caminho/origem entre parênteses; sem glossário. |
