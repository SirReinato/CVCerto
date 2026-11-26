declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

/**
 * Vaga normalizada retornada por qualquer adaptador de fonte externa.
 */
export interface NormalizedCandidateJob {
  source: string;
  externalId: string;
  title: string;
  companyName: string;
  locationRaw: string;
  summarySnippet: string;
  sourceUrl: string;
  publishedAt: string | null;
}

export interface JobFetchOptions {
  keywords?: string;
  page?: number;
  resultsPerPage?: number;
  maxDaysOld?: number;
  timeoutMs?: number;
}

export interface JobSourceAdapter {
  readonly sourceName: string;
  fetchJobs(options?: JobFetchOptions): Promise<NormalizedCandidateJob[]>;
}

export const DEFAULT_AI_KEYWORDS =
  "inteligencia artificial IA LLM agente agentes generativa prompt machine learning langchain openai gemini";

interface AdzunaRawJob {
  id?: string | number;
  title?: string;
  description?: string;
  redirect_url?: string;
  created?: string;
  company?: {
    display_name?: string;
  };
  location?: {
    display_name?: string;
    area?: string[];
  };
}

interface AdzunaSearchResponse {
  results?: AdzunaRawJob[];
}

function cleanText(raw: string | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Adaptador oficial para a API gratuita Adzuna BR (/v1/api/jobs/br/search/{page}).
 */
export class AdzunaBrAdapter implements JobSourceAdapter {
  readonly sourceName = "adzuna_br";

  async fetchJobs(options: JobFetchOptions = {}): Promise<NormalizedCandidateJob[]> {
    const appId = Deno.env.get("ADZUNA_APP_ID");
    const appKey = Deno.env.get("ADZUNA_APP_KEY");

    if (!appId || !appKey) {
      throw new Error("Credenciais ADZUNA_APP_ID ou ADZUNA_APP_KEY não configuradas nos Edge Secrets.");
    }

    const page = options.page ?? 1;
    const resultsPerPage = options.resultsPerPage ?? 50;
    const maxDaysOld = options.maxDaysOld ?? 7;
    const timeoutMs = options.timeoutMs ?? 8000;
    const whatOr = options.keywords ?? DEFAULT_AI_KEYWORDS;

    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      what_or: whatOr,
      sort_by: "date",
      max_days_old: String(maxDaysOld),
      results_per_page: String(resultsPerPage),
      "content-type": "application/json",
    });

    const url = `https://api.adzuna.com/v1/api/jobs/br/search/${page}?${params.toString()}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Adzuna BR retornou HTTP ${response.status}`);
      }

      const payload = (await response.json()) as AdzunaSearchResponse;
      const results = Array.isArray(payload.results) ? payload.results : [];

      return results
        .filter((item) => item.id !== undefined && Boolean(item.title) && Boolean(item.redirect_url))
        .map((item) => {
          const areaParts = Array.isArray(item.location?.area) ? item.location.area : [];
          const locationRaw = cleanText(item.location?.display_name) || areaParts.join(", ") || "Brasil";

          return {
            source: this.sourceName,
            externalId: String(item.id),
            title: cleanText(item.title),
            companyName: cleanText(item.company?.display_name) || "Empresa Confidencial",
            locationRaw,
            summarySnippet: cleanText(item.description),
            sourceUrl: (item.redirect_url ?? "").trim(),
            publishedAt: item.created ?? null,
          };
        });
    } finally {
      clearTimeout(timer);
    }
  }
}
