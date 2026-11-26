import type { NormalizedCandidateJob } from "../adapters/JobSourceAdapter.ts";

export type WorkModel = "presencial" | "hibrido" | "remoto";
export type RadarFitCategory = "aderente" | "adaptavel" | "baixa_aderencia";

export interface FilteredCandidateJob extends NormalizedCandidateJob {
  workModel: WorkModel;
  isBrasiliaDf: boolean;
  fingerprint: string;
}

const PT_BR_MARKERS = [
  "vaga",
  "requisitos",
  "experiencia",
  "conhecimento",
  "desenvolvimento",
  "desenvolvedor",
  "engenheiro",
  "trabalho",
  "remoto",
  "hibrido",
  "presencial",
  "empresa",
  "equipe",
  "solucoes",
  "inteligencia",
  "dados",
  "candidato",
  "atuar",
  "responsabilidades",
  "diferencial",
  "beneficios",
  "brasil",
];

const EN_ONLY_MARKERS = [
  "requirements",
  "responsibilities",
  "we are looking",
  "join our team",
  "experience with",
  "strong knowledge",
  "bachelor",
  "benefits include",
  "apply now",
  "full-time",
  "skills required",
  "about the role",
];

const BRASILIA_TERMS = [
  "brasilia",
  "distrito federal",
  "taguatinga",
  "aguas claras",
  "ceilandia",
  "samambaia",
  "guara",
  "asa sul",
  "asa norte",
  "sobradinho",
  "gama df",
];

const TRACKING_PARAMS = new Set(["ref", "fbclid", "gclid", "v", "s", "source", "trk"]);

/**
 * Normaliza texto para comparação determinística (minúsculas, sem acentos, espaços colapsados).
 */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Remove parâmetros de rastreamento (UTM, ref, etc.) para estabilizar deduplicação por URL.
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    const keysToDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.startsWith("utm_") || TRACKING_PARAMS.has(lowerKey)) {
        keysToDelete.push(key);
      }
    });
    for (const key of keysToDelete) {
      parsed.searchParams.delete(key);
    }
    const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    const search = parsed.searchParams.toString();
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${pathname}${search ? `?${search}` : ""}`;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Aceita exclusivamente URLs com protocolo http: ou https:.
 */
export function isSafeHttpUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Verifica se a vaga está em português (aceitando título em inglês se a descrição for PT-BR).
 */
export function isPortugueseJob(title: string, summarySnippet: string): boolean {
  const combined = normalizeText(`${title} ${summarySnippet}`);
  const summaryNorm = normalizeText(summarySnippet);
  if (!combined) return false;

  const words = new Set(combined.split(" "));
  let ptHits = 0;
  for (const marker of PT_BR_MARKERS) {
    if (words.has(marker)) ptHits += 1;
  }

  let enHits = 0;
  for (const phrase of EN_ONLY_MARKERS) {
    if (summaryNorm.includes(phrase) || combined.includes(phrase)) {
      enHits += 1;
    }
  }

  if (ptHits >= 2) return true;
  if (enHits >= 2 && ptHits === 0) return false;
  return ptHits >= 1 && enHits === 0;
}

/**
 * Identifica se a vaga menciona Brasília / Distrito Federal.
 */
export function detectBrasiliaDf(locationRaw: string, title: string, summarySnippet: string): boolean {
  const norm = normalizeText(`${locationRaw} ${title} ${summarySnippet}`);
  if (!norm) return false;
  if (BRASILIA_TERMS.some((term) => norm.includes(term))) {
    return true;
  }
  return /\bdf\b/.test(norm);
}

/**
 * Classifica modelo de trabalho com precedência estrita: remoto > hibrido > presencial.
 */
export function classifyWorkModel(
  locationRaw: string,
  title: string,
  summarySnippet: string
): WorkModel | null {
  const norm = normalizeText(`${locationRaw} ${title} ${summarySnippet}`);
  if (!norm) return null;

  if (/\b(remoto|remota|home office|trabalho remoto|100 remoto|teletrabalho)\b/.test(norm)) {
    return "remoto";
  }
  if (/\b(hibrido|hibrida|modelo hibrido)\b/.test(norm)) {
    return "hibrido";
  }
  if (/\b(presencial|modelo presencial|100 presencial)\b/.test(norm)) {
    return "presencial";
  }
  return null;
}

/**
 * Gera fingerprint SHA-256 determinístico para deduplicação intra e cross-source.
 */
export async function computeFingerprint(
  title: string,
  companyName: string,
  externalId: string,
  workModel: WorkModel
): Promise<string> {
  const normCompany = normalizeText(companyName);
  const companyPart =
    !normCompany || normCompany === "empresa confidencial" || normCompany === "confidencial"
      ? externalId
      : normCompany;
  const rawKey = `${normalizeText(title)}|${companyPart}|${workModel}`;
  const encoded = new TextEncoder().encode(rawKey);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Deriva fit_category deterministicamente a partir dos scores numéricos.
 */
export function deriveFitCategory(directFitScore: number, adaptabilityScore: number): RadarFitCategory {
  if (directFitScore >= 70) return "aderente";
  if (adaptabilityScore >= 60) return "adaptavel";
  return "baixa_aderencia";
}

/**
 * Estágio 1 (0 tokens): filtra URL segura, PT-BR, remoto ou Brasília-DF e deduplica em memória.
 */
export async function filterAndDeduplicateCandidates(
  candidates: NormalizedCandidateJob[]
): Promise<FilteredCandidateJob[]> {
  const seenFingerprints = new Set<string>();
  const filtered: FilteredCandidateJob[] = [];

  for (const job of candidates) {
    if (!isSafeHttpUrl(job.sourceUrl)) continue;
    if (!isPortugueseJob(job.title, job.summarySnippet)) continue;

    const workModel = classifyWorkModel(job.locationRaw, job.title, job.summarySnippet);
    if (!workModel) continue;

    const isBrasiliaDf = detectBrasiliaDf(job.locationRaw, job.title, job.summarySnippet);
    if (workModel !== "remoto" && !isBrasiliaDf) continue;

    const fingerprint = await computeFingerprint(
      job.title,
      job.companyName,
      job.externalId,
      workModel
    );

    if (seenFingerprints.has(fingerprint)) continue;
    seenFingerprints.add(fingerprint);

    filtered.push({
      ...job,
      workModel,
      isBrasiliaDf,
      fingerprint,
    });
  }

  return filtered;
}
