# Radar Diário de Vagas IA (`JobPortalsView`)

* **Author:** Renato França
* **Date:** 2026-11-26

## Overview

Adicionar em `src/presentation/components/JobPortalsView.tsx` (isolado em um subcomponente dedicado) um radar diário de vagas relacionadas a IA e Desenvolvimento com IA. Ao abrir a aba pela primeira vez no dia civil (`America/Sao_Paulo`), o sistema dispara uma atualização única em segundo plano via Supabase Edge Function usando apenas camadas gratuitas (API gratuita de vagas como Adzuna BR + Google Gemini para triagem).

As vagas retornadas são filtradas para português (Brasil), priorizando trabalho remoto e aceitando híbrido ou presencial apenas em Brasília-DF. Cada vaga é deduplicada e persistida no Supabase (com RLS por usuário) e recebe uma triagem preliminar em duas dimensões ancoradas exclusivamente no Perfil Mestre ("Base da Verdade"): **Aderência Direta** e **Adaptabilidade**. A partir do card, o usuário pode descartar a vaga, salvá-la no Kanban como `rascunho` ou enviá-la pré-preenchida ao `JobAnalyzer`.

## Analysis

A revisão paralela com os 6 agentes Goldfish (`egm-design`, `egm-codebase-details`, `egm-zoom-out`, `egm-comprehension`, `egm-implementation-readiness`, `egm-structural`) levantou sete riscos principais que precisam de mitigação antes do design detalhado:

1. **Conflito entre camada gratuita e "sem limite rígido por dia":**
   * Supabase Edge Functions no plano gratuito têm limite curto de tempo de execução (~60–150s) e CPU; o Gemini gratuito tem limites rígidos de RPM/TPM/RPD; a Adzuna gratuita limita ~250 req/dia e 50 vagas/página.
   * Enviar dezenas de vagas em uma única chamada ao Gemini trunca o JSON de saída; enviar 1 vaga por chamada estoura RPM e timeout.
   * **Mitigação:** pipeline em 2 estágios na Edge Function — (1) pré-filtro determinístico (idioma PT-BR, remoto ou Brasília-DF, keywords de IA/Dev, exclusão de já vistas) e (2) classificação em lotes de 6–10 vagas no Gemini com teto operacional por execução automática (ex.: 20–25 vagas novas/dia) e botão manual opcional para carregar mais.

2. **Descrições truncadas da Adzuna vs. cálculo de aderência:**
   * A Adzuna retorna apenas um resumo truncado (~300–500 caracteres) e uma `redirect_url` de agregador, raramente a descrição completa.
   * Calcular percentual exato de requisitos sobre um trecho curto causa falsos negativos ou leva o LLM a inferir requisitos inexistentes (violando a regra "Base da Verdade").
   * **Mitigação:** exibir a pontuação do Radar explicitamente como **triagem preliminar baseada no resumo da API**, exigindo que justificativas citem apenas fatos reais do Perfil Mestre e orientando o usuário a colar a descrição completa ao abrir o `JobAnalyzer`.

3. **Cobertura limitada da Adzuna BR para IA e Brasília-DF:**
   * Boa parte das vagas de Engenharia de IA no Brasil está em LinkedIn, Gupy, GeekHunter, Programathor e ATS diretos. A Adzuna BR agrega feeds secundários e pode misturar vagas em inglês marcadas como "Brazil" ou omitir a flag de remoto.
   * **Mitigação:** isolar a coleta atrás de uma interface `JobSourceAdapter` na Edge Function para permitir plugar outras fontes gratuitas (ex.: Jooble BR ou feeds públicos) sem alterar banco, deduplicação ou UI.

4. **Autenticação da Edge Function, trava contra concorrência e fuso horário:**
   * A Edge Function atual `supabase/functions/analyze-job/index.ts` não valida JWT e usa `Access-Control-Allow-Origin: *`. Repetir isso na nova função exporia as chaves `ADZUNA_*` e `GEMINI_API_KEY` a chamadas anônimas.
   * Abrir o app em duas abas ou recarregar durante os 10–20s de busca causaria execuções duplicadas no mesmo dia. Controlar a data em UTC faria o dia virar às 21h em Brasília.
   * **Mitigação:** validar `auth.getUser()` via `Authorization` na Edge Function; criar tabela `daily_job_radar_runs` com `UNIQUE (user_id, run_date)` no fuso `America/Sao_Paulo` e `status ('running' | 'completed' | 'failed')` usando `INSERT ... ON CONFLICT DO NOTHING` como trava atômica (com recuperação se `running` ficar órfão > 5 min).

5. **Instabilidade da chave de deduplicação:**
   * `redirect_url` da Adzuna muda tokens entre consultas, e republicações alteram `external_id`.
   * **Mitigação:** deduplicação em 2 camadas — `UNIQUE (user_id, source, external_id)` + `fingerprint` determinístico (`normalize(title) | normalize(company) | work_model_ou_cidade`) com `UNIQUE (user_id, fingerprint)`, cruzando também com vagas já salvas em `public.jobs`.

6. **Acoplamento em `JobPortalsView.tsx` e lacunas de integração no código atual:**
   * `JobPortalsView.tsx` já possui 731 linhas e styled-components legados sem sufixo `Stl`. Incluir a lógica do radar diretamente nesse arquivo criaria um componente monolítico difícil de manter.
   * `JobAnalyzer.tsx` hoje não aceita props de pré-preenchimento (campos iniciam sempre vazios); será necessário passar um draft via `Home.tsx`.
   * `JobApplicationsRepository.ts` fixa `status: "curriculo_gerado"` e `work_model: "hibrido"`; salvar direto do Radar exige aceitar `status: "rascunho"` (já presente no enum `application_status`) e `work_model` inferido.
   * O carregamento on-open não deve bloquear a aba: exibir imediatamente os portais e o cache do último dia enquanto a atualização roda em segundo plano.

7. **Reuso da Edge Function `analyze-job` e observabilidade:**
   * Não reutilizar `analyze-job` no loop do Radar (ela gera dossiê de entrevista em 8 seções por vaga). Criar uma nova Edge Function (`daily-ai-jobs-radar`), compartilhando utilitários via `supabase/functions/_shared/`.
   * Validar a saída do Gemini com Zod e registrar uso de tokens na tabela `public.ai_generations` já existente no schema.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * Atualização automática 1x por dia civil (`America/Sao_Paulo`) ao abrir `JobPortalsView`, sem bloquear a renderização da aba.
  * Execução 100% em camada gratuita via Supabase Edge Function autenticada por JWT (chaves fora do client-side).
  * Filtro estrito para vagas de IA / Desenvolvimento com IA em português (Brasil), priorizando remoto e aceitando híbrido/presencial apenas em Brasília-DF.
  * Persistência no Supabase com RLS por usuário e deduplicação entre dias (`nova`, `salva_kanban`, `enviada_analise`, `descartada`).
  * Triagem preliminar em duas dimensões (**Aderência Direta** e **Adaptabilidade**) baseada exclusivamente no Perfil Mestre.
  * Ações diretas de 1 clique: descartar, salvar no Kanban (`rascunho`) ou pré-preencher no `JobAnalyzer`.
  * Isolamento da UI do radar em componente dedicado usando exclusivamente styled-components com sufixo `Stl` e `theme.ts`.

* **Out-of-Scope Non-Goals:**
  * Scraping de portais protegidos (LinkedIn, Gupy, Glassdoor, Catho, InfoJobs).
  * Candidatura automática (auto-apply).
  * Geração automática de currículo ou dossiê completo de entrevista para todas as vagas do radar.
  * Agendador em background (`pg_cron` ou serviço externo pago) e notificações por e-mail/push nesta fase.
  * Vagas em inglês ou presenciais/híbridas fora de Brasília-DF.

## Alternatives Weighed

* **Gemini com Google Search Grounding como fonte primária:** Descartada por cota gratuita restrita/instável para grounding, links frequentemente expirados ou genéricos e dificuldade de deduplicação determinística.
* **Execução sem limite rígido em chamada única:** Descartada por risco direto de timeout da Edge Function gratuita, erro 429 no Gemini Free Tier e truncamento de JSON em dias de maior volume.
* **`pg_cron` + `pg_net` diário no Supabase:** Adiada para evolução futura; exige configuração de Vault/secrets no SQL e consome cota mesmo em dias em que o usuário não abre o app.
* **Múltiplas APIs gratuitas (Adzuna BR + Jooble BR) já no MVP:** Mantida como extensão plugável via `JobSourceAdapter`, evitando dobrar latência e chaves na primeira entrega (sujeita à confirmação do autor).
* **Nova aba separada no `WorkspaceLayout`:** Alternativa válida para isolar responsabilidades, mas o escopo atual prioriza integrar um subcomponente dentro de `JobPortalsView` conforme solicitado.

## Key Decisions & Staging for Next Steps

Decisões que precisam ser fechadas antes de iniciar o `/egm-draft`:

1. **Teto operacional por execução automática:** Definir teto seguro por rodada (ex.: 20–25 vagas novas classificadas por dia em lotes de 8 no Gemini) com botão manual "Buscar próximo lote", ou outra estratégia para evitar timeout/estouro de cota gratuita.
2. **Fontes no MVP:** Começar apenas com **Adzuna BR** atrás de `JobSourceAdapter` ou incluir uma segunda API gratuita (ex.: Jooble BR) desde o MVP.
3. **Política de erro e re-execução no mesmo dia:** Permitir botão manual "Tentar novamente" quando o status do dia for `failed`; definir se editar o Perfil Mestre no mesmo dia reclassifica ou aguarda o dia seguinte.
4. **Integração com Kanban e `JobAnalyzer`:** Confirmar criação como `rascunho` ao salvar direto no Kanban e apenas pré-preenchimento (sem criar card automático) ao abrir no `JobAnalyzer`.
5. **Layout dentro de `JobPortalsView`:** Escolher entre sub-abas internas (`Radar Diário IA` | `Portais & Acompanhamento`) ou seção do Radar no topo acima dos portais existentes.
6. **Selo de triagem preliminar:** Confirmar exibição explícita de que o score inicial é baseado no resumo da API (devido ao truncamento da Adzuna).
