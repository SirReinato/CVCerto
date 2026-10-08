import type { ResumeData } from "../entities/Resume";
import type { JobAnalysis } from "../entities/JobAnalysis";
import { FactAntiHallucinationValidator, type ValidationReport } from "../rules/FactAntiHallucinationValidator";

export interface TailoredResumeResult {
  tailoredResume: ResumeData;
  validationReport: ValidationReport;
  atsOptimizationSummary: string;
}

/**
 * Motor de adaptação inteligente de currículos.
 * Reorganiza, prioriza e reescreve ênfases de acordo com os termos ATS da vaga analisada,
 * preservando com exatidão a integridade de todas as experiências reais de Renato.
 */
export const ResumeTailoringEngine = {
  generate(master: ResumeData, analysis: JobAnalysis): TailoredResumeResult {
    // 1. Identifica se a vaga tem foco maior em Desenvolvimento ou em Suporte/Infra
    const isDevOriented =
      analysis.technicalRequirements.some((r) =>
        /react|next|node|typescript|javascript|front|full/i.test(r)
      ) || /desenvolvedor|frontend|front-end/i.test(analysis.jobTitle);

    // 2. Ajuste fino do Subtítulo / Tags
    let tailoredTargetRole = master.personalInfo.targetRoleOrTags;
    if (isDevOriented) {
      tailoredTargetRole =
        "DESENVOLVEDOR FRONT-END | REACT | TYPESCRIPT | NEXT.JS | APIS REST";
    } else {
      tailoredTargetRole =
        "ANALISTA DE SUPORTE | MICROSOFT 365 | ACTIVE DIRECTORY | AZURE | ITIL";
    }

    // 3. Ajuste do Resumo com ênfase nas palavras-chave ATS detectadas na vaga
    let tailoredSummary = master.summary;
    if (isDevOriented) {
      tailoredSummary =
        "Profissional com sólida formação em Análise e Desenvolvimento de Sistemas e especialização em IA/Machine Learning. Experiência prática na criação de interfaces modernas, reutilizáveis e responsivas utilizando React, TypeScript, Next.js e integração de APIs REST. Vivência em troubleshooting, versionamento com Git e ambiente corporativo, unindo agilidade de entrega à estabilidade de sistemas.";
    }

    // 4. Reordenação e priorização das atividades dentro das experiências reais
    // (Apenas reordena as atividades existentes para colocar no topo as que têm keywords da vaga)
    const tailoredExperiences = master.experiences.map((exp) => {
      const sortedActivities = [...exp.activities].sort((a, b) => {
        const aMatches = analysis.atsKeywords.filter((kw) =>
          a.toLowerCase().includes(kw.toLowerCase())
        ).length;
        const bMatches = analysis.atsKeywords.filter((kw) =>
          b.toLowerCase().includes(kw.toLowerCase())
        ).length;
        return bMatches - aMatches; // Coloca no topo as atividades mais relevantes para a vaga
      });

      return {
        ...exp,
        activities: sortedActivities,
      };
    });

    // 5. Priorização de Habilidades
    const tailoredSkills = [...master.skills].sort((a, b) => {
      const aMatches = analysis.atsKeywords.filter((kw) =>
        a.categoryName.toLowerCase().includes(kw.toLowerCase())
      ).length;
      const bMatches = analysis.atsKeywords.filter((kw) =>
        b.categoryName.toLowerCase().includes(kw.toLowerCase())
      ).length;
      return bMatches - aMatches;
    });

    const candidateResume: ResumeData = {
      ...master,
      personalInfo: {
        ...master.personalInfo,
        targetRoleOrTags: tailoredTargetRole,
      },
      summary: tailoredSummary,
      experiences: tailoredExperiences,
      skills: tailoredSkills,
    };

    // 6. Execução obrigatória do validador determinístico anti-invenção
    const validationReport = FactAntiHallucinationValidator.validate(candidateResume, master);

    return {
      tailoredResume: candidateResume,
      validationReport,
      atsOptimizationSummary: isDevOriented
        ? "Currículo adaptado para Front-End/Dev: destacadas atividades em React, APIs e Git."
        : "Currículo adaptado para Infra/Suporte: priorizadas atividades em Microsoft 365, Active Directory e SLAs.",
    };
  },
};
