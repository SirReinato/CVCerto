# Plano de Execução em Issues — Radar Diário de Vagas IA (`CVCerto`)

* **Projeto Linear:** [CVCerto (`P-SIR-8`)](https://linear.app/sirreinato/project/cvcerto-907f33be3623)
* **Time:** `SirReinato` (`SIR`)
* **Design Doc:** [radar-diario-vagas-ia.md](./radar-diario-vagas-ia.md)
* **Branch obrigatória (`AGENTS.md` Regra 2):** `feature/radar-diario-vagas-ia`

---

## Mapa de Issues no Linear

| Fase | Issue | Título | Estimativa | Depende de | Link |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Fase 1** | `SIR-175` | `feat(db): criar migration 003_daily_job_radar com RLS e atualizar schema consolidado` | 2 pts | — | [SIR-175](https://linear.app/sirreinato/issue/SIR-175/featdb-criar-migration-003-daily-job-radar-com-rls-e-atualizar-schema) |
| **Fase 2** | `SIR-176` | `feat(edge): implementar adaptador Adzuna BR e filtro determinístico PT-BR / Remoto / Brasília-DF` | 3 pts | `SIR-175` | [SIR-176](https://linear.app/sirreinato/issue/SIR-176/featedge-implementar-adaptador-adzuna-br-e-filtro-deterministico-pt-br) |
| **Fase 3** | `SIR-178` | `feat(edge): implementar Edge Function daily-ai-jobs-radar com JWT, trava atômica e triagem Gemini` | 5 pts | `SIR-176` | [SIR-178](https://linear.app/sirreinato/issue/SIR-178/featedge-implementar-edge-function-daily-ai-jobs-radar-com-jwt-trava) |
| **Fase 4** | `SIR-177` | `feat(data): tipar Radar Diário, criar DailyJobRadarRepository e endurecer popupLauncher` | 2 pts | `SIR-175` | [SIR-177](https://linear.app/sirreinato/issue/SIR-177/featdata-tipar-radar-diario-criar-dailyjobradarrepository-e-endurecer) |
| **Fase 5** | `SIR-179` | `feat(ui): implementar DailyAiJobsRadar (*Stl) e integrar em JobPortalsView, JobAnalyzer e Home` | 5 pts | `SIR-177`, `SIR-178` | [SIR-179](https://linear.app/sirreinato/issue/SIR-179/featui-implementar-dailyaijobsradar-stl-e-integrar-em-jobportalsview) |
| **Fase 6** | `SIR-180` | `test(e2e): adicionar testes Playwright do Radar IA e sincronizar AGENTS.md, README e graphify` | 3 pts | `SIR-179` | [SIR-180](https://linear.app/sirreinato/issue/SIR-180/teste2e-adicionar-testes-playwright-do-radar-ia-e-sincronizar-agentsmd) |

---

## Blocos Copiáveis para Agentes Sem Linear MCP (`AGENTS.md` Regra 3.3)

### Fase 1 (`SIR-175`) — Atividade do Momento
```text
Contexto: Projeto CVCerto (React 19 + TypeScript + Supabase). Leia AGENTS.md e o design aprovado em 00-anything/02 - pesquisa-diaria-vagas-ia 2026-11-26/radar-diario-vagas-ia.md.
Branch: Crie/use a branch feature/radar-diario-vagas-ia (nunca commite na main).

Tarefa (Fase 1 — SIR-175): feat(db): criar migration 003_daily_job_radar com RLS e atualizar schema consolidado
Objetivo funcional: Criar a base de persistência e controle de concorrência diária do Radar de Vagas IA no PostgreSQL/Supabase com RLS por usuário, além de documentar as credenciais server-side da Adzuna BR.

Passo a passo técnico:
1. Criar supabase/migrations/003_daily_job_radar.sql:
   - Função public.set_updated_at() (returns trigger, atualizando new.updated_at = now()).
   - Tabela public.daily_job_radar_runs (id, user_id, run_date, status 'running'|'completed'|'failed', source default 'adzuna_br', error_message, started_at, finished_at, UNIQUE (user_id, run_date)).
   - Tabela public.daily_job_radar_items (id, user_id, run_id, source, external_id, fingerprint, title, company_name, location_raw, work_model, is_brasilia_df, summary_snippet, source_url, published_at, direct_fit_score, adaptability_score, fit_category, matched_facts, adaptability_notes, triage_status 'nova'|'salva_kanban'|'descartada', linked_application_id, created_at, updated_at, UNIQUE (user_id, fingerprint), índice (user_id, triage_status, created_at desc), trigger set_updated_at).
   - Políticas RLS: daily_job_radar_runs apenas SELECT (auth.uid() = user_id); daily_job_radar_items SELECT e UPDATE (auth.uid() = user_id).
2. Espelhar função, tabelas, índices e RLS em supabase/consolidated_schema.sql e atualizar comentário do cabeçalho de 15 para 17 tabelas.
3. Atualizar .env.example documentando ADZUNA_APP_ID e ADZUNA_APP_KEY como Supabase Edge Secrets (nunca prefixo VITE_).

Critérios de aceitação (DoD):
- SQL válido e estritamente aditivo em 003_daily_job_radar.sql e consolidated_schema.sql.
- Cliente não consegue fazer DELETE/UPDATE direto em daily_job_radar_runs.
- .env.example documenta ADZUNA_APP_ID e ADZUNA_APP_KEY sem prefixo VITE_.
```

### Fase 2 (`SIR-176`)
```text
Contexto: Projeto CVCerto, branch feature/radar-diario-vagas-ia. Design em 00-anything/02 - pesquisa-diaria-vagas-ia 2026-11-26/radar-diario-vagas-ia.md. Pré-requisito: Fase 1 concluída.

Tarefa (Fase 2 — SIR-176): feat(edge): implementar adaptador Adzuna BR e filtro determinístico PT-BR / Remoto / Brasília-DF
Passo a passo técnico:
1. Criar supabase/functions/daily-ai-jobs-radar/adapters/JobSourceAdapter.ts com interface JobSourceAdapter, NormalizedCandidateJob e AdzunaBrAdapter consultando https://api.adzuna.com/v1/api/jobs/br/search/1 (what_or, sort_by=date, max_days_old=7, results_per_page=50, timeout 8000ms, ADZUNA_APP_ID e ADZUNA_APP_KEY via Deno.env).
2. Criar supabase/functions/daily-ai-jobs-radar/filters/deterministicFilter.ts com: detecção PT-BR (summary_snippet + title), work_model com precedência remoto > hibrido > presencial e is_brasilia_df (descartando híbrido/presencial/indeterminado fora de Brasília-DF), validação http:/https:, fingerprint SHA-256 normalizado e cálculo determinístico de fit_category (directFitScore >= 70 -> 'aderente', adaptabilityScore >= 60 -> 'adaptavel', senão 'baixa_aderencia').

DoD: AdzunaBrAdapter com what_or/sort_by/max_days_old/timeout; descarte pré-Gemini de vagas fora de PT-BR, remoto/Brasília-DF ou URL insegura; fit_category determinístico.
```

### Fase 3 (`SIR-178`)
```text
Contexto: Projeto CVCerto, branch feature/radar-diario-vagas-ia. Design em 00-anything/02 - pesquisa-diaria-vagas-ia 2026-11-26/radar-diario-vagas-ia.md. Pré-requisito: Fase 2 concluída.

Tarefa (Fase 3 — SIR-178): feat(edge): implementar Edge Function daily-ai-jobs-radar com JWT, trava atômica e triagem Gemini
Passo a passo técnico:
1. Criar supabase/functions/daily-ai-jobs-radar/index.ts (Deno):
   - Validar JWT via createClient(SUPABASE_URL, SUPABASE_ANON_KEY) + auth.getUser(token) (401 se inválido) e usar SUPABASE_SERVICE_ROLE_KEY filtrando sempre pelo user_id do token.
   - Contrato POST { mode: "auto" | "retry" } -> { status, run, items, error }.
   - Guard de master_facts vazio retornando { status: "missing_profile", run: null, items: [] } sem travar o dia.
   - run_date em America/Sao_Paulo e trava atômica (auto: INSERT ... ON CONFLICT DO NOTHING + recuperação de running órfão > 5 min; retry: UPDATE ... WHERE status = 'failed' RETURNING id retornando 409 se não elegível).
   - Deduplicar em memória + contra daily_job_radar_items e public.jobs (select('title, source_url, companies(name)') por normalizeUrl(source_url) ou normalize(title)|normalize(companies.name)).
   - Classificar até 12 candidatos novos em 1 chamada Gemini (fallback de modelo como analyze-job/index.ts) + Zod + Base da Verdade, derivar fit_category, inserir com ON CONFLICT (user_id, fingerprint) DO NOTHING e finalizar run completed. Não gravar em ai_generations.

DoD: 401 sem JWT, missing_profile sem travar o dia, cache no mesmo dia em auto, sem gravação em ai_generations.
```

### Fase 4 (`SIR-177`)
```text
Contexto: Projeto CVCerto, branch feature/radar-diario-vagas-ia. Design em 00-anything/02 - pesquisa-diaria-vagas-ia 2026-11-26/radar-diario-vagas-ia.md. Pré-requisito: Fase 1 concluída.

Tarefa (Fase 4 — SIR-177): feat(data): tipar Radar Diário, criar DailyJobRadarRepository e endurecer popupLauncher
Passo a passo técnico:
1. Atualizar src/shared/types/database.types.ts exportando DailyRadarRunStatus, RadarFitCategory, RadarTriageStatus e tabelas daily_job_radar_runs e daily_job_radar_items.
2. Criar src/domain/entities/DailyJobRadar.ts com interfaces TS (DailyRadarRun, DailyRadarItem, RadarJobDraft com workModel) reutilizando os unions de database.types.ts.
3. Criar src/infrastructure/supabase/DailyJobRadarRepository.ts (listActiveItems com triage_status != 'descartada', getTodayRun, triggerDailyRadar, updateTriageStatus, linkApplication).
4. Atualizar src/infrastructure/supabase/JobApplicationsRepository.ts adicionando status?: ApplicationStatus em CreateApplicationParams (padrão "curriculo_gerado").
5. Atualizar src/shared/utils/popupLauncher.ts adicionando isSafeHttpUrl rejeitando protocolos diferentes de http:/https: em openSideBrowser.

DoD: npm run build sem erros; createApplication 100% retrocompatível; openSideBrowser bloqueando URLs não-HTTP(S).
```

### Fase 5 (`SIR-179`)
```text
Contexto: Projeto CVCerto, branch feature/radar-diario-vagas-ia. Design em 00-anything/02 - pesquisa-diaria-vagas-ia 2026-11-26/radar-diario-vagas-ia.md. Pré-requisitos: Fases 3 e 4 concluídas.

Tarefa (Fase 5 — SIR-179): feat(ui): implementar DailyAiJobsRadar (*Stl) e integrar em JobPortalsView, JobAnalyzer e Home
Restrições AGENTS.md: ZERO arquivos/imports .css em src/; 100% dos novos styled-components com sufixo Stl consumindo src/theme/theme.ts.

Passo a passo técnico:
1. Criar src/presentation/components/DailyAiJobsRadar.tsx (recolhível): leitura imediata do cache, disparo mode: 'auto' não-bloqueante, selo de triagem preliminar, estado vazio (0 vagas novas), CTA missing_profile, filtros (Todas, Aderentes, Adaptáveis, Remoto, Brasília-DF), ações 1-clique (Descartar, Salvar no Kanban com savingItemIds + linkApplication, Analisar no JobAnalyzer) e botão "Tentar novamente hoje" quando status = 'failed'.
2. Atualizar src/presentation/components/JobPortalsView.tsx montando <DailyAiJobsRadar /> no topo e atualizando os 5 searchUrl de PORTALS para IA / Desenvolvimento com IA (sem reescrever estilos legados fora do escopo).
3. Atualizar src/presentation/components/JobAnalyzer.tsx aceitando initialDraft?: RadarJobDraft | null e onDraftConsumed?: () => void (consumo único no useEffect e preservação de workModel em onGenerateResume).
4. Atualizar src/screens/Home.tsx com estado analyzerDraft, onSendRadarToAnalyzer, onDraftConsumed e onSaveRadarToKanban(item): Promise<string> criando candidatura rascunho + recarregando listApplications(user.id).

DoD: Zero CSS em src/, sufixo Stl em 100% dos novos componentes, Kanban sincroniza sem reload, JobAnalyzer consome draft uma única vez.
```

### Fase 6 (`SIR-180`)
```text
Contexto: Projeto CVCerto, branch feature/radar-diario-vagas-ia. Design em 00-anything/02 - pesquisa-diaria-vagas-ia 2026-11-26/radar-diario-vagas-ia.md. Pré-requisito: Fase 5 concluída.

Tarefa (Fase 6 — SIR-180): test(e2e): adicionar testes Playwright do Radar IA e sincronizar AGENTS.md, README e graphify
Passo a passo técnico:
1. Criar tests/e2e/radar.spec.ts atravessando ProtectedRoute via page.addInitScript + page.route('**/auth/v1/user', ...) e page.route('**/functions/v1/daily-ai-jobs-radar', ...), validando render não-bloqueante, recolher/expandir, filtros, descarte, salvar como rascunho no Kanban e pré-preenchimento consume-once no JobAnalyzer.
2. Atualizar AGENTS.md (árvore de pastas, variáveis de ambiente, modelo de dados e Histórico de alterações) e README.md.
3. Executar npm run graphify, npm run build, npm run lint, npm audit, npx semgrep scan --config auto e npm run test:e2e.
4. Commitar na branch feature/radar-diario-vagas-ia e executar git push -u origin feature/radar-diario-vagas-ia.

DoD: npm run test:e2e 100% verde (rotas.spec.ts + radar.spec.ts); build e graphify sem erros; AGENTS.md e README.md sincronizados.
```
