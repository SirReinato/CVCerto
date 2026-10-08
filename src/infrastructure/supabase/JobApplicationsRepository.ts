import { supabase } from "./client";
import type { ApplicationStatus, WorkModel } from "../../shared/types/database.types";
import type { JobAnalysis } from "../../domain/entities/JobAnalysis";

export interface CreateApplicationParams {
  userId: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
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
  jobs?: {
    title: string;
    raw_description: string;
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
   * Lista todas as candidaturas do usuário com dados da vaga e empresa
   */
  async listApplications(userId: string): Promise<ApplicationItem[]> {
    const { data, error } = await supabase
      .from("job_applications")
      .select("*, jobs(title, raw_description, companies(name))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[JobApplicationsRepository] Erro ao listar candidaturas:", error);
      return [];
    }

    return (data as unknown as ApplicationItem[]) || [];
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
};
