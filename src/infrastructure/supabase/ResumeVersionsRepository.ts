import { supabase } from "./client";
import type { ResumeData } from "../../domain/entities/Resume";
import type { ValidationReport } from "../../domain/rules/FactAntiHallucinationValidator";

export interface SaveResumeVersionParams {
  userId: string;
  applicationId?: string;
  templateCode?: string;
  version?: number;
  content: ResumeData;
  atsScore?: number;
  validationReport: ValidationReport;
}

export const ResumeVersionsRepository = {
  /**
   * Salva uma versão otimizada de currículo vinculada ao histórico do usuário
   */
  async saveVersion(params: SaveResumeVersionParams) {
    const { data, error } = await supabase.from("resume_versions").insert({
      user_id: params.userId,
      application_id: params.applicationId || null,
      version: params.version || 1,
      content: params.content as any,
      ats_score: params.atsScore || null,
      validation_report: params.validationReport as any,
      status: "aprovado",
      was_sent: false,
    } as any).select().single();

    if (error) {
      console.error("[ResumeVersionsRepository] Erro ao salvar versão:", error);
      throw error;
    }

    return data;
  },

  /**
   * Lista as versões geradas do usuário
   */
  async listVersions(userId: string) {
    const { data, error } = await supabase
      .from("resume_versions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ResumeVersionsRepository] Erro ao listar versões:", error);
      return [];
    }

    return data;
  },
};
