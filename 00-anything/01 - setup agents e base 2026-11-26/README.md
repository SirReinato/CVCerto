# 01 - Setup AGENTS.md e Adequação da Base (`2026-11-26`)

Subpasta de isolamento para registrar a adaptação do `AGENTS.md` (100% das regras do modelo base universal) e os ajustes estruturais aplicados na base do projeto **CVCerto**.

## Escopo Aplicado
- Criação de `AGENTS.md` adaptado à arquitetura e stack real do `CVCerto` (React 19, TypeScript, Vite, styled-components, Supabase, Gemini AI, `@react-pdf/renderer`, `recharts`, `zod`, `vite-plugin-pwa`).
- Criação dos arquivos ponteiros multi-IA (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`).
- Criação da estrutura `00-anything/` para isolamento de rascunhos, specs e relatórios.
- Configuração de `playwright.config.ts` e `tests/e2e/rotas.spec.ts` com reutilização do cache global (`PLAYWRIGHT_BROWSERS_PATH`).
- Padronização de `src/theme/theme.ts` (botões, tipografia, gradientes e `ConteinerGeralStl`) e injeção de `<ThemeProvider theme={theme}>` em `src/App.tsx`.
- Configuração de `graphify-out/` no `.gitignore` e script de apoio no `package.json`.
