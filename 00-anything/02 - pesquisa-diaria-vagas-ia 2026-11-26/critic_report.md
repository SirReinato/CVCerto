# Relatório de Critic Review (Stage 7)

**Alvo:** `00-anything/02 - pesquisa-diaria-vagas-ia 2026-11-26/radar-diario-vagas-ia.md` (`L1–L222`)
**Resumo de Severidade:** `3 🔴 Blocker` | `5 🟡 Major` | `2 🟢 Nit`

## Status dos Revisores

| Revisor | Padrão | Status |
| --- | --- | --- |
| `egm-design` | `feature-spec-standard` | `completed` |
| `egm-structural` | `feature-spec-standard` | `completed` |
| `egm-style` | `—` | `completed` |

---

## Achados Priorizados (Blockers → Major → Nits)

### 1. Concorrência sem trava atômica em `retry`/`next_batch` e perda silenciosa de vagas no cursor `next_page` — Severidade: 🔴 Blocker
* **Lente:** `egm-design`
* **Escopo Afetado:** `L73`, `L112–L118`, `L147–L150`, `L159–L162` (*Technical Plan — Q1, Modelo de Dados, Edge Function*)
* **Descrição da Discrepância:**
  1. **Trava incompleta:** O `INSERT ... ON CONFLICT DO NOTHING` em `daily_job_radar_runs` (`UNIQUE (user_id, run_date)`) protege apenas a primeira execução `mode: 'auto'`. Para `mode: 'retry'` e `mode: 'next_batch'`, a linha do dia já existe; sem um `UPDATE` atômico condicional (ex.: `WHERE status = 'failed'` ou `WHERE status = 'completed' AND has_more = true`) que mude `status` para `'running'` com `RETURNING *`, cliques duplos ou duas abas simultâneas disparam chamadas duplicadas à Adzuna e ao Gemini.
  2. **Perda de vagas no cursor:** `L73` e `L159` dizem que se houver excedente pré-filtrado além das 24 vagas, marca-se `has_more = true`. Porém `L150` afirma que `next_batch` *"incrementa `next_page` na linha de hoje"*. Se a página 1 retornou 40 vagas válidas e apenas 24 foram classificadas, pular para `next_page = 2` descarta permanentemente as 16 vagas restantes da página 1.
  3. **Falha parcial entre lotes:** Não há definição do que ocorre se o lote 1 ou 2 (8 vagas cada) tiver sucesso e o lote 3 falhar (429/timeout): se os lotes anteriores são persistidos, qual `status` a `run` recebe e de onde o `retry` retoma.
* **Justificativa e Recomendação:**
  * Especificar transição atômica condicional (`UPDATE ... SET status = 'running', started_at = now() WHERE user_id = $1 AND run_date = $2 AND <pré-condição> RETURNING *`) para `retry`, `next_batch` e recuperação de `running` órfão (> 5 min).
  * Corrigir o modelo de paginação/cursor: só incrementar `next_page` quando todos os candidatos válidos da página atual forem consumidos.
  * Definir semântica explícita para falha parcial.

---

### 2. Deduplicação contra `public.jobs` incompatível com o schema real do banco — Severidade: 🔴 Blocker
* **Lente:** `egm-design`
* **Escopo Afetado:** `L29`, `L126`, `L157` (*Goals, Modelo de Dados, Edge Function — Estágio 1*)
* **Descrição da Discrepância:** `L157` especifica gerar `fingerprint` (`SHA-256(normalize(title) | normalize(company) | work_model_ou_cidade)`) e remover candidatos que já existam em `public.jobs` do usuário. No schema real (`supabase/consolidated_schema.sql`, `L134–L145`), `public.jobs` **não** possui `fingerprint`, **não** possui `company_name` direto (apenas `company_id` FK para `public.companies`) e **não** possui `work_model` (que fica em `public.job_applications`).
* **Justificativa e Recomendação:** Definir explicitamente a estratégia de deduplicação contra o CRM existente: fazer `JOIN` de `jobs` com `companies` para comparar `(normalize(title), normalize(company_name))` e/ou `normalizeUrl(source_url)`.

---

### 3. Comportamento indefinido para `master_facts` vazio e risco de desperdício de cota / quebra da Base da Verdade — Severidade: 🔴 Blocker
* **Lente:** `egm-design`
* **Escopo Afetado:** `L50`, `L160–L161` (*CUJ 1, Edge Function — Estágio 2*)
* **Descrição da Discrepância:** A spec assume que o usuário já possui fatos em `public.master_facts` (`L50`, `L160`), mas contas novas ou que ainda não salvaram o perfil podem não ter linhas ativas em `public.master_facts`. O documento não define o que a Edge Function faz quando `master_facts` retorna 0 registros.
* **Justificativa e Recomendação:** Adicionar pré-verificação antes de chamar Adzuna/Gemini: se `master_facts` ativos estiver vazio, abortar sem marcar a rodada como `completed` (retornando `missing_profile`), exibindo CTA na UI para o usuário salvar o Perfil Mestre antes de ativar o Radar.

---

### 4. Duas constraints `UNIQUE` em `daily_job_radar_items` podem quebrar o `INSERT` em lote — Severidade: 🟡 Major
* **Lente:** `egm-design`
* **Escopo Afetado:** `L126`, `L141`, `L162` (*Modelo de Dados, Edge Function*)
* **Descrição da Discrepância:** `daily_job_radar_items` possui duas constraints únicas independentes: `UNIQUE (user_id, source, external_id)` e `UNIQUE (user_id, fingerprint)`. No PostgreSQL, `ON CONFLICT (cols)` só trata uma constraint por vez.
* **Justificativa e Recomendação:** Explicitar deduplicação em memória antes do Estágio 2 e `INSERT ... ON CONFLICT DO NOTHING` sem alvo único (ou manter apenas `UNIQUE (user_id, fingerprint)`).

---

### 5. Desalinhamento de contrato com `public.ai_generations` e superfície de RLS em `daily_job_radar_runs` — Severidade: 🟡 Major
* **Lente:** `egm-design`
* **Escopo Afetado:** `L106`, `L146`, `L162`, `L208–L210`, `L215` (*Modelo de Dados, Edge Function, NFRs*)
* **Descrição da Discrepância:**
  1. Em `supabase/consolidated_schema.sql` (`L234–L247`), `public.ai_generations` exige `model text not null` e `prompt_version text not null`. A spec só menciona `kind = 'daily_radar_triage'`.
  2. `L106` libera `INSERT`, `UPDATE` e `DELETE` via RLS (`auth.uid() = user_id`) em **ambas** as tabelas, permitindo que o cliente apague a linha do dia em `daily_job_radar_runs` e contorne o limite de 1x/dia.
* **Justificativa e Recomendação:** Documentar `model` e `prompt_version` obrigatórios (ou cortar `ai_generations`) e restringir políticas RLS de `daily_job_radar_runs` para `SELECT` apenas no cliente.

---

### 6. Falta sincronização do estado `applications` em `Home.tsx` e ciclo de vida do `analyzerDraft` — Severidade: 🟡 Major
* **Lente:** `egm-design`, `egm-structural`
* **Escopo Afetado:** `L60–L61`, `L100–L101`, `L168–L169` (*CUJ 2, Fluxo de Dados, Integração no Frontend*)
* **Descrição da Discrepância:** `Home.tsx` carrega `applications` uma única vez no mount. Sem callback (`onApplicationCreated`) ou recarga de `listApplications(user.id)`, a vaga salva no Kanban não aparece ao trocar de aba sem recarregar. Além disso, `analyzerDraft` não tem regra de limpeza após consumo.
* **Justificativa e Recomendação:** Adicionar callback/recarga para atualizar `applications` em `Home.tsx` e definir ciclo de vida *consume-once* para `analyzerDraft`.

---

### 7. Parâmetros de busca da Adzuna BR e regras de desempate do pré-filtro determinístico subespecificados — Severidade: 🟡 Major
* **Lente:** `egm-design`
* **Escopo Afetado:** `L152–L156` (*Edge Function — Coleta e Estágio 1*)
* **Descrição da Discrepância:** Na Adzuna, `what` usa lógica AND; falta especificar `what_or`, `sort_by=date` e `max_days_old`, além de regra para título em inglês com descrição PT-BR e modalidade indeterminada.
* **Justificativa e Recomendação:** Definir `what_or`, `sort_by=date`, `max_days_old` e regras explícitas de desempate.

---

### 8. Transição de `triage_status = 'enviada_analise'` e estados vazios não cobertos nas CUJs — Severidade: 🟡 Major
* **Lente:** `egm-structural`
* **Escopo Afetado:** `L29`, `L48–L67`, `L77`, `L98–L101`, `L138` (*Goals, CUJs 1–3, Q5, Fluxo de Dados, Modelo de Dados*)
* **Descrição da Discrepância:** `'enviada_analise'` é declarado nos Goals e no schema, mas CUJ 2, Q5 e o diagrama não especificam quando muda nem como aparece na fila ativa. Também falta o caso de 0 vagas novas no dia.
* **Justificativa e Recomendação:** Explicitar máquina de estados de `triage_status` e cenário de 0 vagas novas na CUJ 1.

---

### 9. Critérios objetivos para `fit_category` vs. scores numéricos não especificados — Severidade: 🟢 Nit
* **Lente:** `egm-style`, `egm-structural`
* **Escopo Afetado:** `L133–L135`, `L161`, `L167`
* **Descrição da Discrepância:** Faltam faixas de corte ou precedência entre `direct_fit_score`, `adaptability_score` e `fit_category`.
* **Justificativa e Recomendação:** Derivar `fit_category` deterministicamente a partir dos scores após a validação Zod.

---

### 10. Redundância de requisitos de segurança entre seções e detalhe menor de enum/validação de URL — Severidade: 🟢 Nit
* **Lente:** `egm-style`
* **Escopo Afetado:** `L27`, `L29`, `L90`, `L106`, `L128`, `L146`, `L208–L211`
* **Descrição da Discrepância:** Repetição de detalhes de JWT/RLS em *Goals*, *Technical Plan* e *NFRs*; ordem documental de `work_model` diferente de `consolidated_schema.sql`; validação de URL no frontend não explicitada junto a `openSideBrowser`.
* **Justificativa e Recomendação:** Enxugar mecanismos em *Goals* e explicitar validação `https://`/`http://` nas duas pontas.
