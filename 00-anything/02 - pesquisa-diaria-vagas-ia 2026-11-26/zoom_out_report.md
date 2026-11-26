## Stage 5 — Zoom Out Review (`radar-diario-vagas-ia.md`)

**Veredito Geral:** Arquitetura de alto nível coerente e viável para camada gratuita, sem bloqueadores estruturais (**0 🔴 Blocker**), mas com **5 🟡 Major** e **3 🟢 Nit** de sobre-engenharia, violações de YAGNI e desalinhamento parcial com o problema declarado. Simplificar o MVP antes de implementar reduzirá ~35–40% do código de backend, schema e estados de UI sem perder nenhum dos 3 CUJs.

---

### 🔴 Blockers
Nenhum encontrado. O fluxo central (leitura imediata do cache no Supabase + disparo 1x/dia não-bloqueante via Edge Function autenticada + triagem em 2 dimensões + encaminhamento ao Kanban/`JobAnalyzer`) é sólido e respeita as restrições do projeto.

---

### 🟡 Major

#### 1. Paginação manual (`next_batch`, `next_page`, `has_more`) e processamento em 3 lotes (24 vagas) — YAGNI e complexidade prematura
* **Escopo afetado:** `Technical Plan` — Q1 (L73), `Modelo de Dados` (L115), `Edge Function` (L147–150, L159), `Integração no Frontend` (L167), `Target Files #5 e #10` (L245, L265).
* **Racional de simplicidade:** O recorte do Radar é altamente restrito (Adzuna BR + IA/LLM + PT-BR + Remoto ou Brasília-DF + deduplicado contra histórico). Não há evidência de que essa interseção retorne mais de ~10–15 vagas *novas* por dia. Mesmo assim, o design introduz um 3º modo de execução (`next_batch`), estado de cursor (`next_page`, `has_more`), orquestração de 3 chamadas sequenciais ao Gemini por invocação de Edge Function (aumentando risco de timeout e 429) e botão extra na UI ("Buscar próximo lote"). Além disso, um único inteiro `next_page` nem sequer casa limpo com buscas por múltiplos termos ("IA / Desenvolvedor IA / LLM / Agentes IA").
* **Alternativa mais simples:** Cortar paginação manual e `next_batch` do MVP. Classificar no máximo **10 a 12 vagas novas por dia em uma única chamada ao Gemini**. Isso elimina `next_page`, `has_more`, `mode: 'next_batch'`, o loop de lotes e o botão "Buscar próximo lote".

#### 2. Abstração especulativa `JobSourceAdapter` e fragmentação prematura da Edge Function — Violação de YAGNI
* **Escopo afetado:** `Technical Plan` — Q2 (L74), `Edge Function` (L151–153), `Alternative D` (L191–195), `Target Files #3, #4, #5` (L235–245).
* **Racional de simplicidade:** A própria `Alternative D` rejeita múltiplas APIs no MVP. Ainda assim, o plano cria um diretório `adapters/` com interface `JobSourceAdapter`, tipo `NormalizedCandidateJob` e classe/implementação `AdzunaBrAdapter` apenas para um futuro hipotético (Jooble BR), dividindo uma Edge Function pequena em 3 arquivos (`index.ts`, `adapters/JobSourceAdapter.ts`, `filters/deterministicFilter.ts`).
* **Alternativa mais simples:** Usar uma função direta `fetchAdzunaBrJobs(...)` retornando um array tipado (no próprio `index.ts` ou em um único módulo auxiliar se o arquivo crescer). Só extrair interface de adaptador quando uma segunda fonte real for priorizada.

#### 3. Schema superdimensionado e auditoria `ai_generations` fora do padrão do codebase
* **Escopo afetado:** `Modelo de Dados` (L108–142), `Edge Function` (L162), `Non-Functional Requirements` (L215), `Target Files #1 e #5` (L227–229, L245).
* **Racional de simplicidade:**
  1. **Colunas sem consumidor nos CUJs:** `daily_job_radar_runs` inclui `fetched_count`, `filtered_count`, `classified_count`, `source`, `next_page`, `has_more` — nenhum desses campos é exigido pelos CUJs 1–3 (bastam `id`, `user_id`, `run_date`, `status`, `error_message`, `started_at`, `finished_at`).
  2. **Dupla constraint `UNIQUE` prematura:** `daily_job_radar_items` declara simultaneamente `UNIQUE (user_id, source, external_id)` e `UNIQUE (user_id, fingerprint)`. Com apenas uma fonte no MVP, duas constraints únicas aumentam atrito em upserts no PostgreSQL (`ON CONFLICT` só aceita um alvo explícito por cláusula).
  3. **Campos derivados redundantes:** `fit_category` pode ser derivado deterministicamente de `direct_fit_score`/`adaptability_score` (ou mantido só se a IA decidir a categoria, evitando duplicidade), e `is_brasilia_df` é redundante com `location_raw` + `work_model`.
  4. **Inconsistência com `ai_generations`:** A Edge Function existente `supabase/functions/analyze-job/index.ts` (L1–249) **não grava** em `public.ai_generations`. Adicionar auditoria de tokens apenas no Radar é escopo extra não solicitado nos Goals/CUJs.
* **Alternativa mais simples:** Enxugar `daily_job_radar_runs` para o mínimo da trava diária + erro, manter uma única chave de deduplicação (`UNIQUE (user_id, fingerprint)` ou `UNIQUE (user_id, source, external_id)`) e remover gravação em `ai_generations` do MVP (ou tratar auditoria de IA transversalmente em outra demanda).

#### 4. Lacuna na raiz do Problema #2 (`JobPortalsView.tsx` mantém atalhos hardcoded de "Suporte TI")
* **Escopo afetado:** `The Problem` (L17, L20) vs. `Target Files #11` (L267–269).
* **Racional de simplicidade:** O documento cita explicitamente como Problema #2 que os atalhos fixos atuais em `JobPortalsView.tsx` (verificado nas L46, L59, L72, L98, L111 do arquivo real) apontam para `"Suporte TI N2/N3"` e `"Analista de Suporte"`. Porém, o plano apenas empilha `<DailyAiJobsRadar />` no topo da página e **não atualiza os links de `PORTALS`**, deixando metade do problema declarado sem solução — quando ajustar/parametrizar esses 6 links custaria ~10 linhas de código.
* **Alternativa mais simples:** Incluir no escopo de `JobPortalsView.tsx` a atualização dos `searchUrl` dos portais para o foco em IA (ou parametrizá-los a partir de `masterProfile.personalInfo.targetRole`), resolvendo o Problema #2 de fato.

#### 5. Risco silencioso na leitura direta de `public.master_facts` pela Edge Function
* **Escopo afetado:** `Edge Function` (L160), `Target Files #5` (L245).
* **Racional de simplicidade:** Verificando `src/infrastructure/supabase/MasterProfileRepository.ts` (L27–46 e L111–113), `master_facts` é semeado de forma preguiçosa no client (`Home.tsx`) e atualizado via `DELETE` + `INSERT` não-transacional. Se o usuário abrir `JobPortalsView` antes do seed concluir ou após uma falha de sincronização local, a Edge Function lerá `master_facts` vazio e classificará todas as vagas do dia com base vazia (queimando a execução diária sem aviso).
* **Alternativa mais simples:** Documentar na arquitetura o comportamento obrigatório para `master_facts` vazio (retornar erro/aviso sem marcar a rodada como `completed`), ou reutilizar o padrão já adotado em `analyze-job/index.ts` (receber o resumo compactado do perfil ou validar presença de fatos antes de travar a rodada como concluída).

---

### 🟢 Nit

#### 1. Schemas Zod redundantes no frontend (`src/domain/entities/DailyJobRadar.ts`)
* **Escopo afetado:** `Target Files #6` (L247–249).
* **Racional de simplicidade:** O JSON não confiável da API externa e do Gemini já é validado com Zod dentro da Edge Function antes de persistir no PostgreSQL. No frontend, os dados já vêm tipados via `database.types.ts`, seguindo o padrão simples de interfaces usado em `src/infrastructure/supabase/JobApplicationsRepository.ts` (`ApplicationItem`). Manter Zod apenas na fronteira externa (Edge Function) e usar tipos TS simples no frontend evita duplicação de schemas.

#### 2. Reuso e endurecimento de `openSideBrowser` para validação de URL
* **Escopo afetado:** `Non-Functional Requirements` (L211), `Target Files #4` (L241).
* **Racional de simplicidade:** `src/shared/utils/popupLauncher.ts` (L12–18) já centraliza a abertura de links externos (`openSideBrowser`), mas hoje apenas prefixa `https://` se não começar com `http(s)://` (o que transformaria `javascript:alert(1)` em `https://javascript:alert(1)`). Em vez de duplicar validação de protocolo no componente do Radar, basta rejeitar protocolos não-`http(s)` diretamente em `openSideBrowser` (reutilizando o utilitário existente) além do filtro na ingestão.

#### 3. Nível de detalhe prematuro em micro-decisões de UI no doc de arquitetura
* **Escopo afetado:** `Integração no Frontend` (L167), `Target Files #10` (L265).
* **Racional de simplicidade:** Especificar 5 filtros rápidos fixos (`Todas`, `Aderentes`, `Adaptáveis`, `Remoto`, `Brasília-DF`) e controle de recolher/expandir na fase de arquitetura de alto nível adiciona peso de especificação sem impacto arquitetural. Para o MVP, 2–3 filtros simples (ex.: `Todas`, `Aderentes`, `Adaptáveis`) ou deixar os detalhes de chips para implementação mantém o documento focado em contratos e fluxo de dados.
