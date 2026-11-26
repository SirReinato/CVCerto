import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.24.2";
import { AdzunaBrAdapter } from "./adapters/JobSourceAdapter.ts";
import {
  deriveFitCategory,
  filterAndDeduplicateCandidates,
  normalizeText,
  normalizeUrl,
  type FilteredCandidateJob,
} from "./filters/deterministicFilter.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_DAILY_CANDIDATES = 12;
const STALE_RUNNING_MS = 5 * 60 * 1000;
const GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest"];

const RequestBodySchema = z.object({
  mode: z.enum(["auto", "retry"]).default("auto"),
});

const GeminiItemScoreSchema = z.object({
  fingerprint: z.string().min(1),
  directFitScore: z.number().min(0).max(100),
  adaptabilityScore: z.number().min(0).max(100),
  matchedFacts: z.array(z.string()).default([]),
  adaptabilityNotes: z.string().default(""),
});

const GeminiTriageResponseSchema = z.object({
  results: z.array(GeminiItemScoreSchema),
});

interface MasterFactRow {
  type: string;
  data: Record<string, unknown>;
}

interface CrmJobRow {
  title: string;
  source_url: string | null;
  companies: { name: string } | { name: string }[] | null;
}

interface RadarRunRow {
  id: string;
  user_id: string;
  run_date: string;
  status: "running" | "completed" | "failed";
  source: string;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getTodayDateSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

async function listActiveItems(adminClient: SupabaseClient, userId: string) {
  const { data, error } = await adminClient
    .from("daily_job_radar_items")
    .select("*")
    .eq("user_id", userId)
    .neq("triage_status", "descartada")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data ?? [];
}

async function deduplicateAgainstDatabase(
  adminClient: SupabaseClient,
  userId: string,
  candidates: FilteredCandidateJob[]
): Promise<FilteredCandidateJob[]> {
  if (candidates.length === 0) return [];

  const fingerprints = candidates.map((c) => c.fingerprint);

  const [existingRadarRes, existingCrmRes] = await Promise.all([
    adminClient
      .from("daily_job_radar_items")
      .select("fingerprint")
      .eq("user_id", userId)
      .in("fingerprint", fingerprints),
    adminClient
      .from("jobs")
      .select("title, source_url, companies(name)")
      .eq("user_id", userId),
  ]);

  if (existingRadarRes.error) throw existingRadarRes.error;
  if (existingCrmRes.error) throw existingCrmRes.error;

  const existingFingerprints = new Set<string>(
    (existingRadarRes.data ?? []).map((row: { fingerprint: string }) => row.fingerprint)
  );

  const existingCrmUrls = new Set<string>();
  const existingCrmTitleCompany = new Set<string>();

  for (const row of (existingCrmRes.data ?? []) as CrmJobRow[]) {
    if (row.source_url) {
      existingCrmUrls.add(normalizeUrl(row.source_url));
    }
    const companyObj = Array.isArray(row.companies) ? row.companies[0] : row.companies;
    const companyName = companyObj?.name ?? "";
    const titleKey = normalizeText(row.title);
    const companyKey = normalizeText(companyName);
    if (titleKey && companyKey) {
      existingCrmTitleCompany.add(`${titleKey}|${companyKey}`);
    }
  }

  return candidates.filter((candidate) => {
    if (existingFingerprints.has(candidate.fingerprint)) return false;

    const normCandidateUrl = normalizeUrl(candidate.sourceUrl);
    if (existingCrmUrls.has(normCandidateUrl)) return false;

    const candidateTitleCompany = `${normalizeText(candidate.title)}|${normalizeText(candidate.companyName)}`;
    if (existingCrmTitleCompany.has(candidateTitleCompany)) return false;

    return true;
  });
}

async function classifyCandidatesWithGemini(
  geminiApiKey: string,
  masterFacts: MasterFactRow[],
  candidates: FilteredCandidateJob[]
): Promise<z.infer<typeof GeminiTriageResponseSchema>> {
  const prompt = `
Você é um Tech Recruiter Sênior especialista em Inteligência Artificial no Brasil.
Receba a Base da Verdade do candidato (fatos reais cadastrados) e uma lista de até ${MAX_DAILY_CANDIDATES} vagas retornadas por API (com resumo truncado).

REGRAS ESTRITAS:
1. NUNCA invente experiências, cargos, ferramentas ou certificações fora da Base da Verdade.
2. "directFitScore" (0 a 100): mede quanto os requisitos explícitos do resumo coincidem diretamente com fatos reais da Base da Verdade.
3. "adaptabilityScore" (0 a 100): mede quão rápido o candidato consegue se adaptar com base em stacks ou domínios próximos que já domina na Base da Verdade.
4. "matchedFacts": liste de 1 a 4 frases curtas citando exclusivamente fatos reais da Base da Verdade que sustentam o score.
5. "adaptabilityNotes": justificativa objetiva de 1 a 2 frases explicando a aderência ou o caminho de adaptação sem alucinar.
6. Retorne exatamente um objeto JSON no formato {"results": [{"fingerprint": "...", "directFitScore": 0, "adaptabilityScore": 0, "matchedFacts": ["..."], "adaptabilityNotes": "..."}]} contendo todas as vagas recebidas.

BASE DA VERDADE DO CANDIDATO:
${JSON.stringify(masterFacts)}

VAGAS PARA TRIAGEM PRELIMINAR:
${JSON.stringify(
  candidates.map((c) => ({
    fingerprint: c.fingerprint,
    title: c.title,
    companyName: c.companyName,
    locationRaw: c.locationRaw,
    workModel: c.workModel,
    summarySnippet: c.summarySnippet,
  }))
)}
`;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        }
      );

      if (!response.ok) {
        continue;
      }

      const geminiData = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      let rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      rawText = rawText.trim();
      if (rawText.startsWith("```json")) {
        rawText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
      } else if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```\s*/, "").replace(/```\s*$/, "");
      }

      const parsedJson: unknown = JSON.parse(rawText);
      const validated = GeminiTriageResponseSchema.safeParse(parsedJson);
      if (validated.success) {
        return validated.data;
      }
    } catch {
      // Tenta o próximo modelo fallback
    }
  }

  throw new Error("Falha na classificação preliminar via Gemini API.");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !geminiApiKey) {
    return jsonResponse({ error: "Variáveis de ambiente do servidor não configuradas." }, 500);
  }

  // 1. Autenticação obrigatória por JWT
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return jsonResponse({ error: "Token de autenticação ausente." }, 401);
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user) {
    return jsonResponse({ error: "Sessão inválida ou expirada." }, 401);
  }

  const userId = user.id;

  // 2. Validação do body ({ mode: "auto" | "retry" })
  let parsedBody: z.infer<typeof RequestBodySchema>;
  try {
    const rawBody: unknown = await req.json().catch(() => ({}));
    const validation = RequestBodySchema.safeParse(rawBody);
    if (!validation.success) {
      return jsonResponse({ error: "Parâmetro mode inválido. Use 'auto' ou 'retry'." }, 400);
    }
    parsedBody = validation.data;
  } catch {
    return jsonResponse({ error: "Corpo da requisição inválido." }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // 3. Guard para master_facts vazio antes de adquirir trava ou gastar cota
  const { data: masterFacts, error: factsError } = await adminClient
    .from("master_facts")
    .select("type, data")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (factsError) {
    return jsonResponse({ error: factsError.message }, 500);
  }

  if (!masterFacts || masterFacts.length === 0) {
    const items = await listActiveItems(adminClient, userId);
    return jsonResponse({
      status: "missing_profile",
      run: null,
      items,
    });
  }

  // 4. Trava atômica diária (America/Sao_Paulo)
  const runDate = getTodayDateSaoPaulo();
  const nowIso = new Date().toISOString();
  let activeRun: RadarRunRow | null = null;

  if (parsedBody.mode === "auto") {
    const { data: insertedRun, error: insertError } = await adminClient
      .from("daily_job_radar_runs")
      .insert({
        user_id: userId,
        run_date: runDate,
        status: "running",
        source: "adzuna_br",
        started_at: nowIso,
      })
      .select("*")
      .maybeSingle();

    if (!insertError && insertedRun) {
      activeRun = insertedRun as RadarRunRow;
    } else if (insertError && insertError.code !== "23505") {
      return jsonResponse({ error: insertError.message }, 500);
    } else {
      const { data: existingRun, error: fetchRunError } = await adminClient
        .from("daily_job_radar_runs")
        .select("*")
        .eq("user_id", userId)
        .eq("run_date", runDate)
        .single();

      if (fetchRunError || !existingRun) {
        return jsonResponse({ error: "Falha ao verificar execução diária." }, 500);
      }

      const existing = existingRun as RadarRunRow;
      const items = await listActiveItems(adminClient, userId);

      if (existing.status === "completed") {
        return jsonResponse({ status: "already_ran", run: existing, items });
      }
      if (existing.status === "failed") {
        return jsonResponse({
          status: "failed",
          run: existing,
          items,
          error: existing.error_message ?? undefined,
        });
      }

      const staleThresholdIso = new Date(Date.now() - STALE_RUNNING_MS).toISOString();
      if (existing.started_at >= staleThresholdIso) {
        return jsonResponse({ status: "running", run: existing, items });
      }

      // Reassume trava órfã (> 5 min)
      const { data: reclaimedRun } = await adminClient
        .from("daily_job_radar_runs")
        .update({
          status: "running",
          started_at: nowIso,
          error_message: null,
        })
        .eq("id", existing.id)
        .eq("status", "running")
        .lt("started_at", staleThresholdIso)
        .select("*")
        .maybeSingle();

      if (!reclaimedRun) {
        return jsonResponse({ status: "running", run: existing, items });
      }
      activeRun = reclaimedRun as RadarRunRow;
    }
  } else {
    // mode === "retry"
    const { data: retriedRun, error: retryError } = await adminClient
      .from("daily_job_radar_runs")
      .update({
        status: "running",
        started_at: nowIso,
        error_message: null,
      })
      .eq("user_id", userId)
      .eq("run_date", runDate)
      .eq("status", "failed")
      .select("*")
      .maybeSingle();

    if (retryError) {
      return jsonResponse({ error: retryError.message }, 500);
    }
    if (!retriedRun) {
      return jsonResponse({ error: "Nenhuma execução com falha elegível para retentativa hoje." }, 409);
    }
    activeRun = retriedRun as RadarRunRow;
  }

  // 5. Pipeline de coleta, pré-filtro, deduplicação e triagem Gemini
  try {
    const adapter = new AdzunaBrAdapter();
    const rawCandidates = await adapter.fetchJobs({
      page: 1,
      resultsPerPage: 50,
      maxDaysOld: 7,
      timeoutMs: 8000,
    });

    const stage1Candidates = await filterAndDeduplicateCandidates(rawCandidates);
    const dedupedCandidates = await deduplicateAgainstDatabase(
      adminClient,
      userId,
      stage1Candidates
    );
    const batch = dedupedCandidates.slice(0, MAX_DAILY_CANDIDATES);

    if (batch.length > 0) {
      const triage = await classifyCandidatesWithGemini(
        geminiApiKey,
        masterFacts as MasterFactRow[],
        batch
      );

      const scoreByFingerprint = new Map(
        triage.results.map((item) => [item.fingerprint, item])
      );

      const rowsToInsert = batch.map((candidate) => {
        const scored = scoreByFingerprint.get(candidate.fingerprint);
        const directFitScore = Math.round(scored?.directFitScore ?? 0);
        const adaptabilityScore = Math.round(scored?.adaptabilityScore ?? 0);

        return {
          user_id: userId,
          run_id: activeRun!.id,
          source: candidate.source,
          external_id: candidate.externalId,
          fingerprint: candidate.fingerprint,
          title: candidate.title,
          company_name: candidate.companyName,
          location_raw: candidate.locationRaw,
          work_model: candidate.workModel,
          is_brasilia_df: candidate.isBrasiliaDf,
          summary_snippet: candidate.summarySnippet,
          source_url: candidate.sourceUrl,
          published_at: candidate.publishedAt,
          direct_fit_score: directFitScore,
          adaptability_score: adaptabilityScore,
          fit_category: deriveFitCategory(directFitScore, adaptabilityScore),
          matched_facts: scored?.matchedFacts ?? [],
          adaptability_notes: scored?.adaptabilityNotes ?? "",
          triage_status: "nova",
        };
      });

      const { error: upsertError } = await adminClient
        .from("daily_job_radar_items")
        .upsert(rowsToInsert, {
          onConflict: "user_id,fingerprint",
          ignoreDuplicates: true,
        });

      if (upsertError) {
        throw upsertError;
      }
    }

    const { data: completedRun, error: completeError } = await adminClient
      .from("daily_job_radar_runs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", activeRun.id)
      .select("*")
      .single();

    if (completeError) {
      throw completeError;
    }

    const items = await listActiveItems(adminClient, userId);
    return jsonResponse({
      status: "completed",
      run: completedRun,
      items,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado no Radar Diário IA.";
    await adminClient
      .from("daily_job_radar_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: message,
      })
      .eq("id", activeRun.id);

    return jsonResponse({ error: message }, 500);
  }
});
