import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

function resolveSupabaseStorageKey(): string {
  let supabaseUrl = process.env.VITE_SUPABASE_URL || "";

  if (!supabaseUrl) {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^VITE_SUPABASE_URL\s*=\s*(.+)$/m);
      if (match?.[1]) {
        supabaseUrl = match[1].trim().replace(/^["']|["']$/g, "");
      }
    }
  }

  try {
    if (supabaseUrl) {
      const hostname = new URL(supabaseUrl).hostname;
      const projectRef = hostname.split(".")[0] || "placeholder";
      return `sb-${projectRef}-auth-token`;
    }
  } catch {
    // Fallback para placeholder quando URL não estiver configurada
  }

  return "sb-placeholder-auth-token";
}

interface RadarMockState {
  patchedPayloads: Array<{ id: string; body: Record<string, unknown> }>;
  createdApplications: Array<Record<string, unknown>>;
}

async function setupAuthenticatedRadarMocks(page: Page): Promise<RadarMockState> {
  const storageKey = resolveSupabaseStorageKey();
  const todaySaoPaulo = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  const mockUser = {
    id: "test-user-1",
    aud: "authenticated",
    role: "authenticated",
    email: "teste@cvcerto.local",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { name: "Usuário Teste" },
    created_at: "2026-11-26T10:00:00.000Z",
  };
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const mockSession = {
    access_token: "mock-access-token-e2e",
    refresh_token: "mock-refresh-token-e2e",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: expiresAt,
    user: mockUser,
  };

  await page.addInitScript(
    ({ key, session }) => {
      window.localStorage.setItem(key, JSON.stringify(session));
    },
    { key: storageKey, session: mockSession }
  );

  const mockRun = {
    id: "run-1",
    user_id: "test-user-1",
    run_date: todaySaoPaulo,
    status: "completed",
    source: "adzuna_br",
    error_message: null,
    started_at: "2026-11-26T11:00:00.000Z",
    finished_at: "2026-11-26T11:00:10.000Z",
  };

  const radarItems: Array<Record<string, unknown>> = [
    {
      id: "item-1",
      user_id: "test-user-1",
      run_id: "run-1",
      source: "adzuna_br",
      external_id: "adz-1",
      fingerprint: "fp-1",
      title: "Engenheiro de IA Sênior",
      company_name: "TechIA Brasil",
      location_raw: "Remoto - Brasil",
      work_model: "remoto",
      is_brasilia_df: false,
      summary_snippet: "Atuação com LLMs, RAG e TypeScript.",
      source_url: "https://example.com/vaga-ia-remoto",
      published_at: "2026-11-26T09:00:00.000Z",
      direct_fit_score: 88,
      adaptability_score: 82,
      fit_category: "aderente",
      matched_facts: ["Experiência com LLMs", "TypeScript e RAG"],
      adaptability_notes: "Alinhamento forte com experiência em IA aplicada.",
      triage_status: "nova",
      linked_application_id: null,
      created_at: "2026-11-26T11:00:00.000Z",
      updated_at: "2026-11-26T11:00:00.000Z",
    },
    {
      id: "item-2",
      user_id: "test-user-1",
      run_id: "run-1",
      source: "adzuna_br",
      external_id: "adz-2",
      fingerprint: "fp-2",
      title: "Especialista em Automação e Agentes IA",
      company_name: "GovTech BSB",
      location_raw: "Brasília - DF",
      work_model: "hibrido",
      is_brasilia_df: true,
      summary_snippet: "Automação de processos em Brasília-DF.",
      source_url: "https://example.com/vaga-ia-bsb",
      published_at: "2026-11-26T08:00:00.000Z",
      direct_fit_score: 64,
      adaptability_score: 76,
      fit_category: "adaptavel",
      matched_facts: ["Automação de fluxos com agentes IA"],
      adaptability_notes: "Requer adaptação de contexto.",
      triage_status: "nova",
      linked_application_id: null,
      created_at: "2026-11-26T11:00:00.000Z",
      updated_at: "2026-11-26T11:00:00.000Z",
    },
  ];

  const applications: Array<Record<string, unknown>> = [];
  const companies: Array<Record<string, unknown>> = [];
  const jobs: Array<Record<string, unknown>> = [];
  const state: RadarMockState = {
    patchedPayloads: [],
    createdApplications: [],
  };

  await page.route("**/auth/v1/user*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockUser),
    });
  });

  await page.route("**/auth/v1/token*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockSession),
    });
  });

  await page.route("**/rest/v1/master_facts*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/rest/v1/resume_versions*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/rest/v1/companies*", async (route) => {
    const req = route.request();
    const isSingle = (req.headers()["accept"] || "").includes("vnd.pgrst.object+json");
    if (req.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(isSingle ? companies[0] ?? null : companies),
      });
      return;
    }

    const body = req.postDataJSON() as Record<string, unknown>;
    const created = {
      id: `comp-${companies.length + 1}`,
      name: body.name ?? "Empresa",
      created_at: "2026-11-26T11:10:00.000Z",
    };
    companies.push(created);
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(isSingle ? created : [created]),
    });
  });

  await page.route("**/rest/v1/jobs*", async (route) => {
    const req = route.request();
    const isSingle = (req.headers()["accept"] || "").includes("vnd.pgrst.object+json");
    if (req.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(isSingle ? jobs[0] ?? null : jobs),
      });
      return;
    }

    const body = req.postDataJSON() as Record<string, unknown>;
    const created = {
      id: `job-${jobs.length + 1}`,
      ...body,
      created_at: "2026-11-26T11:10:00.000Z",
    };
    jobs.push(created);
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(isSingle ? created : [created]),
    });
  });

  await page.route("**/rest/v1/job_applications*", async (route) => {
    const req = route.request();
    const isSingle = (req.headers()["accept"] || "").includes("vnd.pgrst.object+json");
    if (req.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(applications),
      });
      return;
    }

    if (req.method() === "POST") {
      const body = req.postDataJSON() as Record<string, unknown>;
      state.createdApplications.push(body);
      const jobRecord = jobs.find((j) => j.id === body.job_id) ?? null;
      const companyRecord = jobRecord
        ? companies.find((c) => c.id === jobRecord.company_id) ?? null
        : null;
      const created = {
        id: `app-${applications.length + 1}`,
        user_id: "test-user-1",
        job_id: body.job_id,
        status: body.status ?? "curriculo_gerado",
        notes: body.notes ?? null,
        applied_at: "2026-11-26T11:15:00.000Z",
        updated_at: "2026-11-26T11:15:00.000Z",
        jobs: jobRecord
          ? {
              ...jobRecord,
              companies: companyRecord,
            }
          : null,
        resume_versions: null,
      };
      applications.unshift(created);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(isSingle ? created : [created]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/rest/v1/daily_job_radar_runs*", async (route) => {
    const isSingle = (route.request().headers()["accept"] || "").includes("vnd.pgrst.object+json");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(isSingle ? mockRun : [mockRun]),
    });
  });

  await page.route("**/rest/v1/daily_job_radar_items*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const isSingle = (req.headers()["accept"] || "").includes("vnd.pgrst.object+json");

    if (req.method() === "GET") {
      const statusParam = url.searchParams.get("triage_status");
      let filtered = [...radarItems];
      if (statusParam === "neq.descartada") {
        filtered = filtered.filter((item) => item.triage_status !== "descartada");
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(isSingle ? filtered[0] ?? null : filtered),
      });
      return;
    }

    if (req.method() === "PATCH") {
      const idFilter = url.searchParams.get("id") || "";
      const targetId = idFilter.replace(/^eq\./, "");
      const body = req.postDataJSON() as Record<string, unknown>;
      state.patchedPayloads.push({ id: targetId, body });

      const updated: Array<Record<string, unknown>> = [];
      for (const item of radarItems) {
        if (!targetId || item.id === targetId) {
          Object.assign(item, body, { updated_at: "2026-11-26T11:20:00.000Z" });
          updated.push(item);
        }
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(isSingle ? updated[0] ?? null : updated),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/functions/v1/daily-ai-jobs-radar*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "already_ran",
        run: mockRun,
        items: radarItems,
      }),
    });
  });

  return state;
}

test.describe("Radar Diário de Vagas IA", () => {
  test("renderiza sem bloquear Portais de Vagas, exibe banner preliminar e recolhe/expande", async ({ page }) => {
    await setupAuthenticatedRadarMocks(page);
    await page.goto("/");

    await page.getByRole("button", { name: /Portais de Vagas/i }).click();

    const radar = page.getByTestId("daily-ai-jobs-radar");
    await expect(radar).toBeVisible();
    await expect(radar.getByText("Triagem preliminar:")).toBeVisible();
    await expect(page.getByTestId("radar-card-item-1")).toBeVisible();
    await expect(page.getByTestId("radar-card-item-2")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Portais de Vagas & Acompanhamento de Processos/i })
    ).toBeVisible();

    await radar.getByRole("button", { name: /^Recolher$/i }).click();
    await expect(page.getByTestId("radar-card-item-1")).toBeHidden();

    await radar.getByRole("button", { name: /^Expandir/i }).click();
    await expect(page.getByTestId("radar-card-item-1")).toBeVisible();
    await expect(page.getByTestId("radar-card-item-2")).toBeVisible();
  });

  test("aplica filtros rápidos corretamente", async ({ page }) => {
    await setupAuthenticatedRadarMocks(page);
    await page.goto("/");

    await page.getByRole("button", { name: /Portais de Vagas/i }).click();
    const radar = page.getByTestId("daily-ai-jobs-radar");
    await expect(page.getByTestId("radar-card-item-1")).toBeVisible();
    await expect(page.getByTestId("radar-card-item-2")).toBeVisible();

    await radar.getByRole("button", { name: /^Aderentes/i }).click();
    await expect(page.getByTestId("radar-card-item-1")).toBeVisible();
    await expect(page.getByTestId("radar-card-item-2")).toBeHidden();

    await radar.getByRole("button", { name: /^Adaptáveis/i }).click();
    await expect(page.getByTestId("radar-card-item-1")).toBeHidden();
    await expect(page.getByTestId("radar-card-item-2")).toBeVisible();

    await radar.getByRole("button", { name: /^Remoto/i }).click();
    await expect(page.getByTestId("radar-card-item-1")).toBeVisible();
    await expect(page.getByTestId("radar-card-item-2")).toBeHidden();

    await radar.getByRole("button", { name: /^Brasília-DF/i }).click();
    await expect(page.getByTestId("radar-card-item-1")).toBeHidden();
    await expect(page.getByTestId("radar-card-item-2")).toBeVisible();

    await radar.getByRole("button", { name: /^Todas/i }).click();
    await expect(page.getByTestId("radar-card-item-1")).toBeVisible();
    await expect(page.getByTestId("radar-card-item-2")).toBeVisible();
  });

  test("descarta vaga via PATCH e remove o card da lista", async ({ page }) => {
    const state = await setupAuthenticatedRadarMocks(page);
    await page.goto("/");

    await page.getByRole("button", { name: /Portais de Vagas/i }).click();
    const card2 = page.getByTestId("radar-card-item-2");
    await expect(card2).toBeVisible();

    await card2.getByRole("button", { name: /Descartar/i }).click();

    await expect(card2).toBeHidden();
    await expect(page.getByTestId("radar-card-item-1")).toBeVisible();
    expect(state.patchedPayloads).toContainEqual({
      id: "item-2",
      body: { triage_status: "descartada" },
    });
  });

  test("salva vaga no Kanban com status rascunho e sincroniza CRM Candidaturas", async ({ page }) => {
    const state = await setupAuthenticatedRadarMocks(page);
    await page.goto("/");

    await page.getByRole("button", { name: /Portais de Vagas/i }).click();
    const card1 = page.getByTestId("radar-card-item-1");
    await expect(card1).toBeVisible();

    await card1.getByRole("button", { name: /Salvar no Kanban/i }).click();

    await expect(card1.getByRole("button", { name: /Salva no Kanban/i })).toBeVisible();
    expect(state.createdApplications.some((app) => app.status === "rascunho")).toBe(true);

    await page.getByRole("button", { name: /CRM Candidaturas/i }).click();
    await expect(page.getByRole("heading", { name: /^Rascunho$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Engenheiro de IA Sênior" })).toBeVisible();
  });

  test("envia vaga para JobAnalyzer com pré-preenchimento de consumo único", async ({ page }) => {
    await setupAuthenticatedRadarMocks(page);
    await page.goto("/");

    await page.getByRole("button", { name: /Portais de Vagas/i }).click();
    const card1 = page.getByTestId("radar-card-item-1");
    await expect(card1).toBeVisible();

    await card1.getByRole("button", { name: /Analisar no JobAnalyzer/i }).click();

    const titleInput = page.locator('input[placeholder*="Analista de Suporte"]');
    const companyInput = page.locator('input[placeholder*="Stefanini"]');
    const urlInput = page.locator('input[placeholder*="gupy.io"]');
    const descriptionTextarea = page.locator("textarea");

    await expect(titleInput).toHaveValue("Engenheiro de IA Sênior");
    await expect(companyInput).toHaveValue("TechIA Brasil");
    await expect(urlInput).toHaveValue("https://example.com/vaga-ia-remoto");
    await expect(descriptionTextarea).toHaveValue(/Resumo preliminar/i);

    await page.getByRole("button", { name: /Portais de Vagas/i }).click();
    await page.getByRole("button", { name: /Analisar Vaga com IA/i }).click();

    await expect(titleInput).toHaveValue("");
    await expect(descriptionTextarea).toHaveValue("");
  });
});
