import { supabase } from "./client";
import type { ResumeData } from "../../domain/entities/Resume";
import type { FactType } from "../../shared/types/database.types";
import { MASTER_PROFILE } from "../../shared/constants/masterProfile";

export interface MasterFactRow {
  id: string;
  user_id: string;
  type: FactType;
  data: any;
  source_resume_id: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Repositório responsável por persistir e carregar o Perfil Mestre (base de fatos reais)
 * do usuário no Supabase.
 */
export const MasterProfileRepository = {
  /**
   * Busca o perfil mestre do usuário autenticado.
   * Caso ainda não existam registros no banco, inicializa automaticamente com a base de fatos reais.
   */
  async getOrCreateProfile(userId: string): Promise<ResumeData> {
    const { data, error } = await supabase
      .from("master_facts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("position", { ascending: true });

    if (error) {
      console.error("[MasterProfileRepository] Erro ao buscar fatos:", error);
      return MASTER_PROFILE;
    }

    const facts = (data as unknown as MasterFactRow[]) || [];

    // Se o usuário ainda não tiver fatos gravados no Supabase, semeia com os dados reais
    if (!facts || facts.length === 0) {
      await this.saveProfile(userId, MASTER_PROFILE);
      return MASTER_PROFILE;
    }

    // Reconstrói a entidade ResumeData a partir dos fatos atômicos armazenados
    const profile: ResumeData = {
      personalInfo: MASTER_PROFILE.personalInfo,
      summary: MASTER_PROFILE.summary,
      experiences: [],
      education: [],
      certifications: [],
      skills: [],
      projects: [],
      languages: MASTER_PROFILE.languages,
      additionalInfo: MASTER_PROFILE.additionalInfo,
    };

    facts.forEach((fact) => {
      const parsedData = fact.data;
      switch (fact.type) {
        case "personal_info":
          if (parsedData.personalInfo) profile.personalInfo = parsedData.personalInfo;
          if (parsedData.summary) profile.summary = parsedData.summary;
          if (parsedData.languages) profile.languages = parsedData.languages;
          if (parsedData.additionalInfo) profile.additionalInfo = parsedData.additionalInfo;
          break;
        case "experience":
          profile.experiences.push(parsedData);
          break;
        case "education":
          profile.education.push(parsedData);
          break;
        case "certification":
          profile.certifications.push(parsedData);
          break;
        case "skill":
          profile.skills.push(parsedData);
          break;
        case "project":
          if (profile.projects) profile.projects.push(parsedData);
          break;
      }
    });

    return profile;
  },

  /**
   * Salva o perfil mestre completo, decompondo cada seção em fatos atômicos indexados.
   */
  async saveProfile(userId: string, profile: ResumeData): Promise<void> {
    // 1. Remove fatos existentes anteriores para versionamento limpo
    await supabase.from("master_facts").delete().eq("user_id", userId);

    const factsToInsert: Array<{
      user_id: string;
      type: FactType;
      data: any;
      position: number;
    }> = [];

    // Fato: Dados pessoais e resumo
    factsToInsert.push({
      user_id: userId,
      type: "personal_info",
      data: {
        personalInfo: profile.personalInfo,
        summary: profile.summary,
        languages: profile.languages,
        additionalInfo: profile.additionalInfo,
      },
      position: 0,
    });

    // Fatos: Experiências
    profile.experiences.forEach((exp, idx) => {
      factsToInsert.push({
        user_id: userId,
        type: "experience",
        data: exp,
        position: 10 + idx,
      });
    });

    // Fatos: Formação
    profile.education.forEach((edu, idx) => {
      factsToInsert.push({
        user_id: userId,
        type: "education",
        data: edu,
        position: 30 + idx,
      });
    });

    // Fatos: Certificações
    profile.certifications.forEach((cert, idx) => {
      factsToInsert.push({
        user_id: userId,
        type: "certification",
        data: cert,
        position: 50 + idx,
      });
    });

    // Fatos: Habilidades
    profile.skills.forEach((skill, idx) => {
      factsToInsert.push({
        user_id: userId,
        type: "skill",
        data: skill,
        position: 70 + idx,
      });
    });

    // Fatos: Projetos
    profile.projects?.forEach((proj, idx) => {
      factsToInsert.push({
        user_id: userId,
        type: "project",
        data: proj,
        position: 90 + idx,
      });
    });

    const { error } = await supabase.from("master_facts").insert(factsToInsert as any);
    if (error) {
      console.error("[MasterProfileRepository] Erro ao salvar fatos:", error);
      throw error;
    }
  },
};
