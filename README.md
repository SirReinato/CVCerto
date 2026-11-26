# CVCerto

Aplicação web (SPA/PWA) para gestão de currículo mestre ("Base da Verdade"), análise inteligente de vagas com IA (Google Gemini / Supabase Edge Functions), geração de currículos sob medida sem alucinação de fatos (PDF e texto limpo ATS), CRM Kanban de candidaturas, métricas de funil e preparação para entrevistas.

## Stack Principal

- **Frontend:** React 19, TypeScript, Vite, `styled-components`, `react-router-dom`
- **Backend / Dados:** Supabase (Auth, PostgreSQL com RLS, Storage e Edge Functions)
- **IA & Validação:** Google Gemini API + `zod`
- **PDF & Gráficos:** `@react-pdf/renderer`, `recharts`, `lucide-react`
- **Qualidade & Governança:** `AGENTS.md`, ESLint, Playwright E2E, `graphify`

## Como Executar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o arquivo `.env` a partir do `.env.example` com suas credenciais do Supabase e Gemini.
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Radar Diário de Vagas IA

A aba **Portais de Vagas** inclui o módulo **Radar Diário de Vagas IA**, que consulta oportunidades recentes via Edge Function (`daily-ai-jobs-radar`), aplica filtro determinístico em PT-BR (Remoto Brasil e Presencial/Híbrido em Brasília-DF) e realiza triagem preliminar em lote único via Gemini contra a Base da Verdade do usuário, permitindo enviar a vaga para o **JobAnalyzer** ou salvá-la como **Rascunho** no **CRM Candidaturas**.

> **Segurança (Edge Secrets):** As credenciais `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` e `GEMINI_API_KEY` devem ser configuradas **exclusivamente** nos Secrets das Edge Functions do Supabase (nunca com prefixo `VITE_`).

## Scripts Disponíveis

- `npm run dev` — Inicia o servidor Vite em modo desenvolvimento
- `npm run build` — Executa `tsc -b && vite build` para produção
- `npm run preview` — Visualiza a build de produção localmente
- `npm run lint` — Executa verificação estática com ESLint
- `npm run test:e2e` — Executa os testes funcionais E2E com Playwright
- `npm run graphify` — Atualiza o grafo estrutural do código em `graphify-out/`

## Documentação para Agentes de IA

Consulte [AGENTS.md](./AGENTS.md) para regras obrigatórias de arquitetura, Git, testes, segurança e convenções do projeto.
