import { supabase } from "./client";
import type { ApplicationStatus, WorkModel } from "../../shared/types/database.types";
import type { JobAnalysis } from "../../domain/entities/JobAnalysis";
import type { ResumeData } from "../../domain/entities/Resume";

export interface CreateApplicationParams {
  userId: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  sourceUrl?: string;
  analysis?: JobAnalysis;
  salaryMin?: number;
  salaryMax?: number;
  workModel?: WorkModel;
  recruiterName?: string;
  recruiterEmail?: string;
  notes?: string;
}

export interface ApplicationItem {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  match_overall: number | null;
  match_technical: number | null;
  match_behavioral: number | null;
  work_model: WorkModel | null;
  salary_offered: number | null;
  notes: string | null;
  created_at: string;
  tailored_resume?: ResumeData | null;
  cover_letter?: string | null;
  analysis?: JobAnalysis | null;
  jobs?: {
    title: string;
    raw_description: string;
    source_url?: string | null;
    analysis?: any;
    companies?: {
      name: string;
    } | null;
  } | null;
}

export const JobApplicationsRepository = {
  /**
   * Cria uma nova candidatura no CRM vinculando empresa, vaga e status inicial
   */
  async createApplication(params: CreateApplicationParams) {
    // 1. Cadastra ou localiza a empresa
    let companyId: string | null = null;
    if (params.companyName) {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", params.userId)
        .eq("name", params.companyName)
        .maybeSingle();

      if (company) {
        companyId = (company as any).id;
      } else {
        const { data: newCompany } = await supabase
          .from("companies")
          .insert({
            user_id: params.userId,
            name: params.companyName,
          } as any)
          .select("id")
          .single();
        companyId = (newCompany as any)?.id || null;
      }
    }

    // 2. Cria o registro da vaga em jobs
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        user_id: params.userId,
        company_id: companyId,
        title: params.jobTitle,
        source_url: params.sourceUrl || null,
        raw_description: params.jobDescription,
        analysis: params.analysis as any,
      } as any)
      .select("id")
      .single();

    if (jobError || !job) {
      throw jobError || new Error("Erro ao cadastrar vaga.");
    }

    // 3. Cria a candidatura em job_applications
    const { data: application, error: appError } = await supabase
      .from("job_applications")
      .insert({
        user_id: params.userId,
        job_id: (job as any).id,
        status: "curriculo_gerado",
        match_overall: params.analysis?.matchScores.overall || null,
        match_technical: params.analysis?.matchScores.technical || null,
        match_behavioral: params.analysis?.matchScores.behavioral || null,
        salary_range_min: params.salaryMin || null,
        salary_range_max: params.salaryMax || null,
        work_model: params.workModel || "hibrido",
        notes: params.notes || null,
      } as any)
      .select()
      .single();

    if (appError) throw appError;
    return application;
  },

  /**
   * Lista todas as candidaturas do usuário com dados da vaga, empresa e currículo customizado persistido
   */
  async listApplications(userId: string): Promise<ApplicationItem[]> {
    const { data, error } = await supabase
      .from("job_applications")
      .select("*, jobs(title, raw_description, source_url, analysis, companies(name))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[JobApplicationsRepository] Erro ao listar candidaturas:", error);
      return [];
    }

    // Busca versões de currículo salvas para associar ao tailored_resume de cada candidatura
    const { data: versions } = await supabase
      .from("resume_versions")
      .select("application_id, content")
      .eq("user_id", userId);

    const versionMap = new Map<string, any>();
    if (versions) {
      versions.forEach((v: any) => {
        if (v.application_id && v.content) {
          versionMap.set(v.application_id, v.content);
        }
      });
    }

    const items = (data as unknown as ApplicationItem[]) || [];
    return items.map((app) => ({
      ...app,
      tailored_resume: versionMap.get(app.id) || app.tailored_resume || null,
      analysis: app.analysis || (app.jobs as any)?.analysis || null,
    }));
  },

  /**
   * Atualiza o status da candidatura (o trigger do Supabase salvará no histórico automaticamente)
   */
  async updateStatus(applicationId: string, newStatus: ApplicationStatus) {
    const { data, error } = await (supabase.from("job_applications") as any)
      .update({ status: newStatus })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Atualiza anotações, contatos e detalhes da candidatura
   */
  async updateNotes(applicationId: string, notes: string) {
    const { data, error } = await (supabase.from("job_applications") as any)
      .update({ notes })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove uma candidatura do CRM
   */
  async deleteApplication(applicationId: string): Promise<void> {
    await supabase.from("resume_versions").delete().eq("application_id", applicationId);
    const { error } = await supabase.from("job_applications").delete().eq("id", applicationId);
    if (error) {
      console.error("[JobApplicationsRepository] Erro ao excluir candidatura:", error);
      throw error;
    }
  },
};
