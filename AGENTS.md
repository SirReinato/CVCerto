# AGENTS.md — CVCerto

> **🤖 LEIA ISTO PRIMEIRO.** Este arquivo é a fonte da verdade e o ponto de entrada obrigatório para qualquer modelo de IA ou agente autônomo (Cursor, Claude, Gemini, Copilot, Codex, ChatGPT etc.) que for analisar, criar ou modificar código neste projeto.
> Ele documenta a arquitetura, convenções, stack técnica, estrutura de pastas, regras operacionais, estratégia de testes, segurança e fluxo de tarefas do **CVCerto**. Leia-o **integralmente** antes de inspecionar ou alterar qualquer arquivo.

---

## ⚠️ REGRAS OBRIGATÓRIAS (ARQUIVO, GIT, GESTÃO & ESTRUTURAÇÃO)

### 1. Toda alteração estrutural DEVE atualizar este `AGENTS.md` no mesmo commit/tarefa

Considera-se "alteração estrutural" qualquer uma das seguintes ações (lista não exaustiva):

* Criar, renomear, mover ou remover arquivos e pastas em `src/`, `public/`, `supabase/`, `tests/` ou na raiz.
* Criar, modificar ou remover **páginas, rotas, componentes, contexts, hooks, services, repositórios, regras de domínio ou testes funcionais**.
* Adicionar, atualizar (major) ou remover **dependências** ou scripts no `package.json`.
* Adicionar ou alterar **variáveis de ambiente** (e espelhar no `.env.example`).
* Implementar ou alterar **regras de negócio**, modelos de dados, schemas de validação (`zod`) ou integrações com APIs/bancos (`Supabase`, `Gemini`, `Microsoft Graph`).
* Adotar novas convenções de arquitetura, padrões de estilo, bibliotecas, regras de segurança ou fluxos de deploy/CI/CD.

**Como atualizar este arquivo após uma alteração estrutural:**
1. Atualize a seção correspondente neste documento (árvore de pastas, tabela de rotas, stack, variáveis, etc.).
2. Registre uma nova entrada na tabela de [Histórico de alterações deste arquivo](#-histórico-de-alterações-deste-arquivo) contendo data (YYYY-MM-DD) e resumo conciso do que mudou.
3. Se a alteração afetar a experiência direta do usuário ou a configuração do projeto, atualize também o `README.md`.

> ⛔ **Atenção:** Se uma IA finalizar uma tarefa estrutural sem atualizar este arquivo e seu histórico, **a tarefa é considerada incompleta e inválida**.

---

### 2. Fluxo obrigatório de Git: Nova Feature/Fix Branch + Push ao GitHub

Para garantir rastreabilidade, isolamento de escopo e facilidade em code reviews e auditorias:

* **NUNCA desenvolva ou commite diretamente na branch `main` (ou `master`) no dia a dia**.
* Toda nova implementação, melhoria, refatoração ou correção DEVE ser desenvolvida em uma branch dedicada:
  ```bash
  git checkout -b feature/nome-da-funcionalidade   # Para novas funcionalidades
  git checkout -b fix/nome-da-correcao            # Para correção de bugs
  git checkout -b refactor/nome-do-ajuste         # Para refatorações estruturais
  git checkout -b chore/nome-da-manutencao        # Para governança, configs e dependências
  ```
* **Commits atômicos, granulares e semânticos (Conventional Commits)**:
  * Nunca crie commits genéricos ou vagos (como `"wip"`, `"update"`, `"ajustes"`, `"fix"`).
  * Use o padrão semântico: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`, `test:`, `sec:`.
  * Descreva com clareza o escopo da alteração no título e, sempre que aplicável, inclua no corpo o *o quê* e o *porquê* da mudança.
* **Push obrigatório ao repositório remoto ao concluir**:
  ```bash
  git push -u origin <nome-da-branch>
  ```
  Isso viabiliza a criação imediata de Pull Requests e acompanhamento de versão.

> 🚀 **Exceção Única de Inicialização (`Initial Commit` na `main`):**
> Em projetos iniciados do zero a partir do modelo base, o commit inaugural (`chore: initial project setup`) pode ser feito na `main`. Como o **CVCerto** já possui histórico ativo na `main`, a proibição de commits diretos na `main` é **100% rígida e irrevogável**.

---

### 3. Gestão e Decomposição de Demandas em Issues (Linear / MCP & Modo Copiável)

Sempre que uma nova atualização, funcionalidade ou refatoração for solicitada, o agente DEVE organizar o plano de execução em etapas antes ou durante o desenvolvimento:

1. **Decomposição em Etapas Lógicas e Funcionais**:
   * Divida a solicitação em issues granulares, sequenciais e independentes (ex: *Fase 1: Configuração do Serviço/API*, *Fase 2: Criação do Hook/Estado*, *Fase 3: Interface e Componentes*, *Fase 4: Rota e Validação Funcional E2E*).
   * Cada issue deve ser autossuficiente e conter:
     - **Título claro e semântico** (ex: `feat(auth): implementar useAuth e persistência de sessão`).
     - **Objetivo funcional**: o que essa etapa entrega e por que é necessária.
     - **Passo a passo técnico**: arquivos exatos a criar/alterar e bibliotecas envolvidas.
     - **Critérios de aceitação (DoD)**: como validar que a etapa foi concluída com sucesso.

2. **Criação de Issues com Linear MCP Ativo**:
   * Se o ambiente possuir a integração do **Linear via MCP** habilitada, o agente deve **criar e registrar automaticamente essas issues** no projeto/time correspondente do Linear, associando labels, prioridades e estimativas adequadas.

3. **Formato Copiável para Agentes Sem Linear MCP**:
   * Em todas as respostas ou documentações de planejamento, forneça também um bloco claro com o conteúdo exato da **atividade do momento** e das etapas seguintes.
   * Esse bloco deve ser estruturado de forma que o desenvolvedor possa simplesmente **copiar e colar o texto em outro agente ou modelo de IA que não tenha o Linear MCP ativo**, e esse agente entenda perfeitamente o contexto, as restrições e o código que deve produzir sem precisar de instruções adicionais.

4. **Replanejamento e Adaptação Dinâmica de Planos Futuros**:
   * Se durante o desenvolvimento de uma etapa surgirem novos requisitos, bloqueios técnicos ou o usuário alterar decisões arquiteturais, o agente DEVE **atualizar imediatamente as issues e etapas futuras** (seja atualizando os cards no Linear via MCP, seja reescrevendo o roteiro no plano).
   * Nunca prossiga com um plano defasado; o backlog e as próximas etapas devem sempre refletir a realidade mais recente.

---

### 4. Proibição de Arquivos Markdown, Relatórios EGM e Testes na Raiz (`00-anything/`)

* **PROIBIDO** gerar, salvar ou descarregar arquivos de rascunho, drafts, specs temporárias, testes avulsos, relatórios de auditoria/crítica/síntese de agentes EGM (`critic_report.md`, `goldfish_review_report.md`, `implementation_readiness_report.md`, `intermediate_zoom_out_report.md`, `concepts_brief.md`, `design_draft.md` etc.) ou anotações na raiz do repositório.
* A raiz do repositório deve conter **exclusivamente** os arquivos de governança e configuração estruturais (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`, `package.json`, `vite.config.ts`, `playwright.config.ts`, `tsconfig*.json`, `eslint.config.js`, `vercel.json` e dotfiles essenciais).
* **Diretório Obrigatório (`00-anything/`)**: Todos os arquivos de ideação, design, reviews de EGM, relatórios de subagentes, artefatos de testes ou documentações exploratórias DEVEM ser alocados dentro do diretório `00-anything/` na raiz do projeto.
* **Padrão Obrigatório de Subpastas por Implementação**:
  Sempre que iniciar uma sessão de EGM, brainstorm, refatoração estrutural, suíte de testes ou planejamento de uma nova feature/implementação, o agente DEVE criar uma nova subpasta dentro de `00-anything/` seguindo rigorosamente o formato:
  ```text
  00-anything/{sequencial_2_digitos} - {nome-da-implementacao} {data-yyyy-mm-dd}/
  ```
  * Exemplo: `00-anything/01 - setup agents e base 2026-11-26/`
* **Isolamento Total do Escopo**: Todos os arquivos que essa estruturação, teste ou execução for produzir devem ser salvos exclusivamente dentro dessa subpasta correspondente. É terminantemente proibido espalhar arquivos auxiliares fora dela.
* **Numeração Sequencial Contínua**: Verifique as subpastas já existentes em `00-anything/` e incremente o numeral sequencial de 2 dígitos (`01`, `02`, `03`...) em ordem cronológica crescente.

---

### 5. Regra de Inicialização Estrita: Criação Genérica e Literal (Anti-Alucinação / Zero Pré-Concepção)

* **PROIBIÇÃO DE INFERIR REQUISITOS NÃO SOLICITADOS**: O agente **NUNCA** deve inventar páginas, fluxos de negócio, integrações ou modelos de dados fictícios além do que já está documentado neste `AGENTS.md` ou foi explicitamente solicitado pelo usuário.
* Ao criar novos módulos ou rotas, mantenha a aderência literal aos requisitos formalizados pelo usuário e documentados nas seções de Modelo de Dados e Regras de Negócio.

---

### 6. Dependência Obrigatória: `graphify` (Sincronização Contínua com `AGENTS.md`)

* **Presença Obrigatória**: O projeto utiliza a CLI `graphify` (instalada no ambiente) para mapeamento estrutural e grafo de dependências do código.
* **Simbiose e Complementaridade**: O `AGENTS.md` e o `graphify` agem sempre juntos: o `AGENTS.md` fornece o contexto semântico, arquitetural e as regras operacionais para as IAs, enquanto o `graphify` mapeia visualmente as relações estruturais e o grafo de dependências do código em `graphify-out/`.
* **Regra de Atualização Simultânea**: Toda e qualquer alteração estrutural no projeto (criação de rotas, páginas, componentes, services, repositórios, contexts ou hooks) DEVE acionar a atualização do mapa do `graphify` no mesmo ciclo/commit em que o `AGENTS.md` for atualizado.
* **Configuração no Git e Scripts**:
  - Script no `package.json`: `"graphify": "graphify update ."`
  - A pasta gerada pelo graphify (`graphify-out/`) consta obrigatoriamente no `.gitignore` para evitar poluição do repositório, mas deve ser mantida atualizada localmente para consumo das IAs.

---

## 1. Visão geral

O **CVCerto** é uma Single Page Application (SPA) e Progressive Web App (PWA) desenvolvida em React + TypeScript com foco em gestão inteligente de carreira, geração e customização de currículos ATS-friendly sem alucinação de fatos ("Base da Verdade"), análise de vagas via IA (Google Gemini / Supabase Edge Functions), CRM Kanban de candidaturas, métricas de funil e preparação para entrevistas.

* **Objetivo do projeto:** Permitir que o usuário mantenha um Perfil Mestre validado ("Base da Verdade"), analise descrições de vagas com IA para gerar versões sob medida de currículo (PDF e texto limpo ATS), acompanhe candidaturas em um Kanban CRM, envie candidaturas por e-mail e pratique entrevistas com dossiês e simulações geradas por IA.
* **Público-alvo:** Profissionais em busca de recolocação ou transição de carreira que precisam adaptar currículos com precisão factual e gerenciar processos seletivos.
* **Status atual:** Aplicação funcional em produção com autenticação via Supabase Auth, persistência em PostgreSQL (Supabase), Edge Function `analyze-job`, exportação PDF (`@react-pdf/renderer`), gráficos (`recharts`), PWA (`vite-plugin-pwa`) e governança via `AGENTS.md` + Playwright E2E.

---

## 2. Stack técnica

| Camada | Tecnologia | Observações |
| ----- | ----- | ----- |
| **Build & Dev Tool** | **Vite** (`v8.x`) + `vite-plugin-pwa` | ESM nativo, code-splitting e suporte offline/PWA |
| **Linguagem** | **TypeScript** (`~6.0.2`) | Tipagem estrita (`tsconfig.app.json`) + validação runtime com `zod` |
| **UI Framework** | **React** (`19.x`) | Componentes funcionais, `Suspense`, `lazy` e hooks nativos |
| **Roteamento** | **react-router-dom** (`v7.x`) | `BrowserRouter`, `<Routes>`, `<Route>`, `<ProtectedRoute />` |
| **Estilização** | **styled-components** (`v6.x`) | **REGRA ESTRITA: ZERO CSS DENTRO DE `src/`**. Não utilize arquivos `.css`, `.scss` ou módulos CSS dentro de `src/`. Todo reset, tipografia, temas e estilizações locais vêm exclusivamente via `styled-components` (`createGlobalStyle`, `ThemeProvider` e componentes estilizados). |
| **Nomenclatura de Estilos** | **Sufixo `Stl` Obrigatório** | Todo styled-component novo ou refatorado DEVE terminar obrigatoriamente com o sufixo `Stl` (ex.: `ConteinerGeralStl`, `CardVagaStl`). *(Nota: componentes legados anteriores à adoção desta regra devem ser migrados progressivamente para o sufixo `Stl` sempre que forem alterados).* |
| **Backend & Auth** | **Supabase** (`@supabase/supabase-js`) | Auth, PostgreSQL (RLS), Storage e Edge Functions (`supabase/functions/analyze-job`) |
| **IA & Validação** | **Google Gemini API** + **Zod** | Análise de vagas, extração de habilidades e dossiê de entrevista com validação de schema |
| **PDF & Visualização** | **@react-pdf/renderer** + **recharts** + **lucide-react** | Geração de currículo PDF (templates `geometric` e ATS), gráficos de métricas e ícones |
| **Mapeamento de Arquitetura** | **graphify** | Dependência obrigatória para gerar o grafo estrutural do código (`graphify-out/`). |
| **Orquestração Dev** | **concurrently** *(se aplicável)* | Caso serviços locais adicionais (ex.: Supabase CLI local / emuladores) sejam usados junto ao Vite, unificar sob `npm run dev`. |
| **Testes Funcionais / E2E** | **Playwright** (`@playwright/test`) | Execução headless com reutilização dinâmica do Chromium global da máquina |
| **Segurança & SAST** | **Semgrep + npm audit** | Auditoria de dependências e análise estática contra XSS, injeções e vazamento de chaves |
| **Qualidade de código** | **ESLint** (`v10.x` + `typescript-eslint`) | Linting configurado em `eslint.config.js` (executar antes de concluir tarefas) |

> 🚫 **Regra de Estilização Zero-CSS em `src/`:**
> Qualquer import de arquivo `.css` (como `import './App.css'` ou `import './index.css'`) dentro de `src/` é **estritamente proibido**. Todas as propriedades visuais devem ser expressas como styled-components ou pelo `<GlobalStyle />`.

### 2.1 Procedimento Obrigatório de Inicialização do Vite (Expurgo de CSS de Fábrica)
Em novos projetos ou módulos baseados neste padrão:
1. Excluir `src/App.css` e `src/index.css` e remover quaisquer imports `.css` em `src/main.tsx` / `src/App.tsx`.
2. Manter `src/theme/GlobalStyle.ts` com `createGlobalStyle` e `src/theme/theme.ts` com os tokens globais (`colors`, `buttons`, `typography`, `gradients`, `spacing`, `breakpoints`).
3. Envolver a aplicação em `src/App.tsx` com `<ThemeProvider theme={theme}>` e `<GlobalStyle />`.

---

## 3. Comandos principais

| Comando | Descrição |
| ----- | ----- |
| `npm install` | Instala todas as dependências do projeto |
| `npm run dev` | Inicia o servidor de desenvolvimento Vite (e serviços locais acoplados, se configurados) |
| `npm run build` | Executa `tsc -b && vite build` gerando o bundle de produção em `dist/` |
| `npm run preview` | Executa um servidor local servindo a pasta de produção `dist/` |
| `npm run lint` | Executa a verificação estática do ESLint (`eslint .`) |
| `npm run graphify` | Atualiza o mapa de grafo estrutural do projeto em `graphify-out/` |
| `npm run test:e2e` | Executa a suíte de testes funcionais E2E com Playwright em modo headless |
| `npx playwright test --ui` | Executa os testes no modo interativo visual com timeline e DOM snapshot |
| `npm audit` | Varre dependências do `package.json` em busca de CVEs conhecidas |
| `npx semgrep scan --config auto` | Executa varredura SAST local para identificar vulnerabilidades no código fonte |

### 3.1 Orquestração de Inicialização Unificada de Serviços (`npm run dev`)
Caso o projeto passe a exigir serviços locais em paralelo ao Vite (ex.: `supabase start`, emuladores ou servidores mock):
* Todos os serviços necessários para rodar a aplicação DEVEM ser orquestrados para inicializar conjuntamente através do comando único `npm run dev` usando `concurrently`, evitando múltiplos terminais manuais.

---

## 4. Variáveis de ambiente

As variáveis de ambiente do client-side devem seguir o prefixo `VITE_` para ficarem disponíveis via `import.meta.env`.

* Arquivo local de desenvolvimento: `.env` / `.env.local` (nunca commitado, protegido pelo `.gitignore`).
* Arquivo de exemplo/documentação: `.env.example` (versionado no Git, sem valores sensíveis).

| Variável | Utilidade | Exemplo |
| ----- | ----- | ----- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave pública `anon` do Supabase (protegida por RLS) | `your-anon-key` |
| `VITE_GEMINI_API_KEY` | Chave Gemini client-side *(legado/fallback — migrar chamadas sensíveis para Edge Functions)* | `your-gemini-api-key` |
| `GEMINI_API_KEY` | Chave Gemini usada exclusivamente no servidor / Supabase Edge Function (`analyze-job`) | `your-gemini-api-key` |

> ⚠️ **Princípio de Zero Segredos:** Variáveis prefixadas com `VITE_` são expostas publicamente no bundle JS final do navegador. **NUNCA** coloque service role keys, credenciais administrativas ou tokens privados em variáveis `VITE_`. Priorize sempre o uso de Edge Functions (`supabase/functions/`) para chaves de APIs pagas/privadas como `GEMINI_API_KEY`.

---

## 5. Estrutura de pastas e arquivos

```text
CVCerto/
├── 00-anything/               # Diretório OBRIGATÓRIO para drafts, specs, relatórios EGM e notas
│   └── 01 - setup agents e base 2026-11-26/ # Subpasta de isolamento da adequação inicial
├── .github/
│   └── copilot-instructions.md # Arquivo ponteiro apontando para AGENTS.md (GitHub Copilot)
├── AGENTS.md                  # Ponto de entrada e guia vivo para IAs e agentes (este arquivo)
├── CLAUDE.md                  # Arquivo ponteiro apontando para AGENTS.md (Claude Code)
├── GEMINI.md                  # Arquivo ponteiro apontando para AGENTS.md (Gemini CLI)
├── README.md                  # Apresentação do projeto e instruções de uso humano
├── package.json               # Dependências, scripts e metadados
├── vite.config.ts             # Configuração do Vite + PWA
├── playwright.config.ts       # Configuração do Playwright (baseURL, Chromium headless, webServer)
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js           # Regras do ESLint
├── vercel.json                # Rewrites SPA e headers PWA para deploy na Vercel
├── .gitignore                 # Arquivos ignorados (node_modules, .env*, dist, dev-dist, graphify-out)
├── .env.example               # Template público de variáveis de ambiente
├── index.html                 # Ponto de entrada HTML do Vite
├── public/                    # Assets estáticos públicos (ícones PWA, manifest, etc.)
├── supabase/                  # Migrações SQL, schema consolidado, seed e Edge Functions
│   ├── consolidated_schema.sql
│   ├── seed.sql
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_storage_setup.sql
│   └── functions/
│       └── analyze-job/
│           └── index.ts
├── tests/                     # Testes funcionais e fluxos E2E com Playwright
│   └── e2e/
│       └── rotas.spec.ts      # Validação funcional das rotas públicas/protegidas e renderização
└── src/
    ├── main.tsx               # Bootstrap da aplicação + registro do Service Worker (PWA)
    ├── App.tsx                # ErrorBoundary + AuthProvider + ToastProvider + ThemeProvider + GlobalStyle + AppRoutes
    ├── assets/                # Imagens e SVGs estáticos
    ├── components/            # Componentes utilitários globais (ex.: InstallAppButton.tsx)
    ├── context/               # Contextos React globais (AuthContext.tsx, ToastContext.tsx)
    ├── domain/                # Camada de Domínio (Clean Architecture)
    │   ├── entities/          # Schemas Zod e tipos (Resume.ts, JobAnalysis.ts)
    │   ├── rules/             # Regras puras (FactAntiHallucinationValidator.ts, ResumeTailoringEngine.ts)
    │   └── services/          # Serviços de domínio (AtsTextFormatter.ts)
    ├── infrastructure/        # Camada de Infraestrutura (integrações externas)
    │   ├── ai/                # AiJobAnalysisService.ts, AiSkillAnalysisService.ts
    │   ├── mail/              # OutlookGraphMailService.ts
    │   └── supabase/          # client.ts e repositórios (MasterProfile, ResumeVersions, JobApplications)
    ├── presentation/          # Camada de Apresentação
    │   ├── components/        # WorkspaceLayout, ProfileEditor, JobAnalyzer, ApplicationsKanban, DashboardMetrics, ResumeCanvas, etc.
    │   └── templates/         # ResumePDFTemplate.tsx (@react-pdf/renderer)
    ├── rotas/                 # Roteamento declarativo
    │   ├── AppRoutes.tsx      # BrowserRouter com /login, / (protegida) e fallback *
    │   └── ProtectedRoute.tsx # Guarda de autenticação via Supabase Auth
    ├── screens/               # Telas principais (Home.tsx, Login.tsx)
    ├── shared/                # Constantes, tipos de banco e utilitários compartilhados
    │   ├── constants/masterProfile.ts
    │   ├── types/database.types.ts
    │   └── utils/popupLauncher.ts
    └── theme/                 # Design system e estilos globais
        ├── GlobalStyle.ts     # Reset CSS completo via createGlobalStyle
        └── theme.ts           # Objeto de tema (colors, buttons, typography, gradients, spacing, breakpoints) + styled-components base
```

### 5.1 Arquivos Ponteiro Multi-IA (Zero Duplicação de Regras)
A raiz do projeto mantém arquivos ponteiros leves redirecionando para este `AGENTS.md`:
* **`CLAUDE.md`** → `[AGENTS.md](./AGENTS.md)`
* **`GEMINI.md`** → `[AGENTS.md](./AGENTS.md)`
* **`.github/copilot-instructions.md`** → `[AGENTS.md](../../AGENTS.md)`

### 5.2 Estrutura Padronizada do `src/theme/theme.ts`
O arquivo `src/theme/theme.ts` fornece o objeto `theme` via `<ThemeProvider theme={theme}>` contendo:
* `colors`: paleta do projeto (`marromEscuro`, `marromMedio`, `verdeClaro`, `creme`, `textos`, `background`, além de tokens semânticos `primary`, `secondary`, `danger`, `surface`, `border`).
* `buttons`: 3 variantes padrão (`primary`, `secondary`, `outline`).
* `typography`: hierarquia padrão (`title`, `subtitle`, `body`, `caption`).
* `gradients`: 2 gradientes reutilizáveis (`primary`, `surface`).
* `spacing`, `borderRadius` e `breakpoints`.
* Componentes base exportados com sufixo `Stl`: `TitulosPrincipaisStl`, `TitulosSecundariosStl`, `ParagrafosStl`, `ConteinerGeralStl`, `BotaoStl`.

---

## 6. Arquitetura e fluxo de dados

O **CVCerto** segue uma arquitetura em camadas inspirada em Clean Architecture combinada com React Contexts:

```text
main.tsx (PWA registerSW)
  └─ App.tsx
       └─ ErrorBoundary
            └─ AuthProvider (Supabase Auth)
                 └─ ToastProvider
                      └─ ThemeProvider (theme.ts)
                           └─ GlobalStyle (reset via styled-components)
                                └─ AppRoutes (BrowserRouter)
                                     ├─ /login -> Login.tsx
                                     ├─ ProtectedRoute -> / -> Home.tsx (WorkspaceLayout + abas lazy)
                                     └─ * -> Navigate to "/"
```

### Princípios de Responsabilidade:
1. **Presentation (`screens/`, `presentation/`)**: Renderização visual, abas lazy-loaded no workspace (`preview`, `edit`, `analyze`, `kanban`, `metrics`, `email`, `portals`, `skill`) e captura de eventos.
2. **Domain (`domain/`)**: Schemas Zod (`ResumeDataSchema`, `JobAnalysisSchema`), validação anti-alucinação (`FactAntiHallucinationValidator`), motor de adaptação (`ResumeTailoringEngine`) e formatação ATS (`AtsTextFormatter`) sem dependência de UI.
3. **Infrastructure (`infrastructure/`)**: Comunicação com Supabase (`MasterProfileRepository`, `ResumeVersionsRepository`, `JobApplicationsRepository`), Gemini AI (`AiJobAnalysisService`, `AiSkillAnalysisService`) e Microsoft Graph (`OutlookGraphMailService`).
4. **Context (`context/`)**: Estado global de sessão (`AuthContext`) e notificações (`ToastContext`).

---

## 7. Modelo de dados e estado

### Entidades principais:
| Entidade | Schema / Tipo | Onde é persistida / consumida |
| ----- | ----- | ----- |
| **ResumeData** | `ResumeDataSchema` (`src/domain/entities/Resume.ts`) | `MasterProfileRepository` (Supabase) / `MASTER_PROFILE` fallback / `Home.tsx` |
| **JobAnalysis & Dossiê** | `JobAnalysisSchema`, `FullInterviewDossierSchema` (`src/domain/entities/JobAnalysis.ts`) | `AiJobAnalysisService` + Edge Function `analyze-job` / `JobAnalyzer.tsx` / `InterviewPrepModal.tsx` |
| **ApplicationItem** | `ApplicationStatus` (`src/shared/types/database.types.ts`) | `JobApplicationsRepository` (Supabase) / `ApplicationsKanban.tsx` / `DashboardMetrics.tsx` |
| **ResumeVersion** | Versões adaptadas por vaga | `ResumeVersionsRepository` (Supabase) / `ResumeDiffModal.tsx` |

---

## 8. Regras de negócio

1. **Base da Verdade (Anti-Alucinação)**: Toda adaptação de currículo gerada pela IA deve ser validada contra os fatos reais cadastrados no Perfil Mestre (`FactAntiHallucinationValidator.ts`), proibindo invenção de experiências, cargos ou certificações.
2. **Autenticação e Isolamento por Usuário**: Todas as rotas do workspace (`/`) exigem sessão válida via `ProtectedRoute.tsx` (Supabase Auth) e respeitam políticas RLS no PostgreSQL.
3. **Estilização uniforme**: Novos componentes devem consumir `props.theme` via `ThemeProvider` e seguir estritamente o sufixo `Stl` sem imports de `.css` em `src/`.
4. **Exportação Dupla (Visual + ATS)**: O sistema deve suportar visualização/exportação em PDF estilizado (`ResumePDFTemplate.tsx`) e texto limpo otimizado para leitores ATS (`AtsTextFormatter.ts`).

---

## 9. Convenções de código e boas práticas

* **Nomenclatura Obrigatória de Styled-Components (Sufixo `Stl`)**:
  * **REGRA ESTRITA:** Todo e qualquer novo componente criado (ou refatorado) com styled-components DEVE obrigatoriamente terminar com o sufixo `Stl`.
  * **Exemplos válidos:**
    ```typescript
    export const ConteinerGeralStl = styled.div`...`;
    export const BannerHomeStl = styled.section`...`;
    export const BotaoAcaoStl = styled.button`...`;
    ```
  * **Proibido:** Declarar novos componentes estilizados sem o sufixo `Stl`.
* **Nomenclatura Geral**:
  * Componentes e Telas: **PascalCase** (`WorkspaceLayout.tsx`, `Home.tsx`).
  * Hooks: **camelCase** iniciando com `use` (ex.: `useAuth`, `useToast`).
  * Contexts: **PascalCase** com sufixo `Context` (ex.: `AuthContext.tsx`).
  * Funções e variáveis: **camelCase** descritivo.
* **Styled-components**:
  * Utilize propriedades transitórias prefixadas com `$` (ex.: `$active`, `$escuro`, `$variant`) para evitar vazamento de props para o DOM HTML.
* **Git e Commits**:
  * Padrão **Conventional Commits**: `feat(escopo): ...`, `fix(escopo): ...`, `refactor(escopo): ...`, `test(escopo): ...`, `sec(escopo): ...`, `chore(escopo): ...`.
  * Push compulsório da branch dedicada no GitHub ao finalizar a tarefa.

---

## 10. Estratégia de Testes Funcionais & E2E (Playwright Inteligente)

Para garantir qualidade e confiabilidade sem burocracia excessiva ou lentidão no desenvolvimento, o projeto adota **testes funcionais pontuais e inteligentes** com Playwright.

### 1. Protocolo de Verificação Dinâmica e Descoberta no Primeiro Acesso
Como este projeto pode ser executado em diferentes computadores, sistemas operacionais (Windows, macOS, Linux/WSL) ou ambientes CI/CD, o agente deve seguir o fluxo de descoberta no **primeiro acesso**:

1. **Checagem da Variável de Ambiente `PLAYWRIGHT_BROWSERS_PATH`**:
   * Inspecione se `PLAYWRIGHT_BROWSERS_PATH` já está configurada no ambiente do usuário para reutilizar o cache global sem baixar navegadores duplicados.
2. **Detecção dos Caminhos Padrão por Sistema Operacional**:
   * **Windows**: `%LOCALAPPDATA%\ms-playwright`
   * **Linux / WSL**: `~/.cache/ms-playwright/`
   * **macOS**: `~/Library/Caches/ms-playwright/`
3. **Verificação de Instalação Existente**:
   * Execute `npx playwright --version`. Caso não haja navegador instalado na máquina, instale apenas o Chromium headless: `npx playwright install chromium`.
4. **Atualização Automática dos Dados Deste AGENTS.md**:

| Parâmetro | Detecção da Máquina Atual (Atualizado Dinamicamente) |
| :--- | :--- |
| **Sistema Operacional Detectado** | Windows 10/11 (PowerShell) |
| **Variável `PLAYWRIGHT_BROWSERS_PATH`** | `C:\Users\renato.lima\AppData\Local\ms-playwright` |
| **Componentes Validados no Ambiente** | `chromium-1248`, `chromium-1254`, `chromium-1255` (v159.0.8154.6), `chromium_headless_shell-1255`, `ffmpeg-1013`, `winldd-1007` |
| **Reutilização Global Ativa** | Sim (não requer downloads adicionais no `node_modules`) |

### 2. Configuração (`playwright.config.ts`)
O projeto utiliza `playwright.config.ts` apontando para `./tests/e2e`, `baseURL: 'http://localhost:5173'`, `headless: true` e `webServer` com `npm run dev`.

### 3. Aplicação Inteligente: Quando (e Quando Não) Escrever Testes Funcionais
* ❌ **NÃO criar testes funcionais para:** ajustes cosméticos de styled-components, textos estáticos ou funções utilitárias puras simples.
* ✅ **É OBRIGATÓRIO criar ou executar testes funcionais quando:**
  1. **Navegação & Casca Mestre / Proteção de Rotas**: alteração em `AppRoutes.tsx`, `ProtectedRoute.tsx` ou telas principais (`/login`, `/`).
  2. **Fluxos Críticos de Entrada (Forms/Modais)**: criação ou alteração de formulários essenciais (`ProfileEditor`, `JobAnalyzer`, `EmailSenderModal`).
  3. **Autenticação & Permissões**: fluxos de login, logout e redirecionamento de rotas protegidas.
  4. **Persistência de Dados Críticos**: gravação e leitura em repositórios Supabase / Kanban.

---

## 11. Estratégia de Segurança (SAST, Auditoria de Dependências & Proteção de Contexto)

### 1. Ferramental Padrão de Verificação

| Camada | Ferramenta / Comando | Objetivo | Quando Executar |
| :--- | :--- | :--- | :--- |
| **Vulnerabilidades em Dependências** | `npm audit` | Identificar CVEs conhecidas nas dependências de produção | Antes de builds e ao instalar novas libs |
| **Análise Estática de Código (SAST)** | **Semgrep** (`npx semgrep scan --config auto`) | Identificar padrões inseguros (XSS, injeções, tokens expostos) | Ao criar novos formulários, rotas ou integrações |
| **Higiene de Segredos** | Verificação de `.env` | Garantir que chaves privadas não vazem no bundle client-side | Em qualquer criação/edição de serviços e variáveis |
| **Segurança de IA / Red Teaming** | **Promptfoo** (`npx promptfoo redteam run`) | Testar prompts contra injeção e vazamento de instruções | Ao alterar prompts em `AiJobAnalysisService` / `analyze-job` |

### 2. Regras Estritas de Segurança para o Agente (O que NUNCA fazer)
1. **Zero Segredos no Client-Side**: Nunca insira chaves privadas ou service roles em `src/` ou em variáveis `VITE_`.
2. **Prevenção de XSS**: Proibido `dangerouslySetInnerHTML` sem sanitização explícita e proibido URLs `javascript:...`.
3. **Validação Estrita de Entrada**: Valide entradas e respostas de IA com schemas `zod` antes de persistir ou renderizar.
4. **Comunicação Segura**: Respeite RLS no Supabase e trate falhas 401/403 limpando sessões expiradas.

### 3. Matriz de Decisão: Quando Rodar Auditoria de Segurança
* ❌ **NÃO rodar auditorias pesadas para:** ajustes visuais ou textos estáticos.
* ✅ **É OBRIGATÓRIO rodar `npm audit` e verificação estática quando:** instalar/atualizar pacotes, alterar autenticação/integrações de API ou adicionar variáveis no `.env.example`.

---

## 12. Cuidados e armadilhas comuns

1. **Arquivos soltos na raiz**: Nunca salve drafts, specs, notas ou relatórios de subagentes/EGM na raiz. Use sempre `00-anything/{sequencial} - {nome} {data}/`.
2. **Alucinação de requisitos ou dados**: Nunca invente funcionalidades fora do escopo solicitado ou fatos fora da Base da Verdade do candidato.
3. **Esquecer o sufixo `Stl`**: Todo novo styled-component deve terminar com `Stl` (ex: `ConteinerGeralStl`, `CardVagaStl`).
4. **Vazamento de CSS externo**: Nunca importe arquivos `.css` crus em `src/`. Use exclusivamente `GlobalStyle.ts` e `styled-components`.
5. **Commits na `main`**: Nunca faça commits diretamente na `main`. Crie sempre uma branch dedicada.
6. **Esquecer de atualizar o AGENTS.md e o graphify**: Finalizar uma tarefa estrutural sem atualizar este arquivo e o `graphify-out/` invalida a entrega.
7. **Trabalhar sem decomposição de etapas**: Quebre demandas médias/grandes em issues claras e sequenciais.
8. **Caminhos fixos de navegador**: Nunca assuma um caminho absoluto de usuário como imutável; valide `PLAYWRIGHT_BROWSERS_PATH` e atualize a Seção 10.
9. **Downloads duplicados do Chromium**: Nunca force reinstalação sem checar `PLAYWRIGHT_BROWSERS_PATH` ou cache global do SO.
10. **Segredos no bundle client-side**: Toda variável `VITE_` é pública no navegador; mantenha chaves sensíveis no servidor/Edge Functions.
11. **Múltiplos terminais para desenvolvimento**: Sempre que houver serviços locais acoplados, unifique a inicialização sob `npm run dev` com `concurrently`.

---

## 13. Checklist para agentes ao finalizar uma tarefa

Antes de considerar qualquer tarefa ou resposta como concluída, o agente DEVE verificar e marcar os itens abaixo:

* [ ] **Isolamento de artefatos na raiz**: Nenhum rascunho, spec, teste temporário ou relatório EGM solto na raiz do repositório (todos salvos dentro de `00-anything/{sequencial} - {nome} {data}/`).
* [ ] **Aderência literal aos requisitos**: Nenhuma funcionalidade ou dado fictício inventado fora do escopo solicitado.
* [ ] **Sufixo `Stl` em 100% dos styled-components criados/alterados**: Todos os styled-components novos ou modificados terminam com `Stl`.
* [ ] **Padrão de tema configurado**: `src/theme/theme.ts` fornece cores, 3 variantes de botões (`primary`, `secondary`, `outline`), tipografia e 2 gradientes via `<ThemeProvider theme={theme}>`.
* [ ] **Governança multi-IA limpa**: Arquivos ponteiros (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`) mantidos e zero imports `.css` dentro de `src/`.
* [ ] **Sincronização com o graphify realizada**: O mapa de grafo do `graphify` (`graphify-out/`) foi atualizado em paridade com as alterações estruturais do projeto.
* [ ] **Orquestração de comandos verificada**: `npm run dev` inicia o ecossistema de desenvolvimento de forma unificada.
* [ ] `src/rotas/AppRoutes.tsx` e as telas existentes continuam íntegros e funcionando.
* [ ] `npm run lint` e `npm run build` executados sem novos erros.
* [ ] **Ambiente de testes verificado**: Caminhos de browser e SO validados na Seção 10.
* [ ] **Testes funcionais Playwright executados com sucesso** (`npm run test:e2e`) caso a tarefa tenha criado ou modificado fluxos críticos.
* [ ] **Auditoria de segurança e dependências verificada**: `npm audit` sem vulnerabilidades críticas ao instalar libs, e zero segredos privados em `src/` ou variáveis `VITE_`.
* [ ] Variáveis de ambiente novas (se houver) documentadas em `.env.example` e na tabela da Seção 4.
* [ ] A árvore de pastas da Seção 5 reflete com precisão os arquivos criados/modificados.
* [ ] Este arquivo `AGENTS.md` foi atualizado com todas as mudanças estruturais aplicadas e registrado na tabela de **Histórico de alterações deste arquivo**.
* [ ] Uma branch dedicada (`feature/...`, `fix/...`, `refactor/...`, `chore/...`) foi criada, recebeu commits semânticos e foi enviada ao GitHub (`git push -u origin <branch>`).

---

## 📜 Histórico de alterações deste arquivo

| Data | Responsável | Alteração Realizada |
| ----- | ----- | ----- |
| 2026-11-26 | Agente IA | Adaptação integral do `AGENTS.md` para o projeto **CVCerto** preservando 100% das regras obrigatórias do modelo base (governança, Git flow, Linear/copiável, `00-anything/`, zero-CSS em `src/`, sufixo `Stl`, `graphify`, Playwright inteligente e SAST/segurança) e adequação da base (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `playwright.config.ts`, `tests/e2e/rotas.spec.ts`, `ThemeProvider` em `App.tsx`, tokens padrão em `theme.ts` e `.gitignore`). |
