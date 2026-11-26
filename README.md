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

## Scripts Disponíveis

- `npm run dev` — Inicia o servidor Vite em modo desenvolvimento
- `npm run build` — Executa `tsc -b && vite build` para produção
- `npm run preview` — Visualiza a build de produção localmente
- `npm run lint` — Executa verificação estática com ESLint
- `npm run test:e2e` — Executa os testes funcionais E2E com Playwright
- `npm run graphify` — Atualiza o grafo estrutural do código em `graphify-out/`

## Documentação para Agentes de IA

Consulte [AGENTS.md](./AGENTS.md) para regras obrigatórias de arquitetura, Git, testes, segurança e convenções do projeto.
