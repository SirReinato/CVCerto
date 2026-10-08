import type { ResumeData } from "../entities/Resume";

export interface ValidationIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationReport {
  isValid: boolean;
  issues: ValidationIssue[];
}

/**
 * Validador Determinístico Anti-Invenção (Regra de Ouro do CV Certo).
 * Executado puramente em código (sem IA) para garantir que nenhuma entidade,
 * empresa, cargo, período ou certificação tenha sido forjada ou alucinada.
 */
export const FactAntiHallucinationValidator = {
  validate(candidate: ResumeData, master: ResumeData): ValidationReport {
    const issues: ValidationIssue[] = [];

    // 1. Validação de Empresas e Cargos
    candidate.experiences.forEach((candExp) => {
      const match = master.experiences.find(
        (mExp) =>
          mExp.company.trim().toLowerCase() === candExp.company.trim().toLowerCase() &&
          mExp.role.trim().toLowerCase() === candExp.role.trim().toLowerCase()
      );

      if (!match) {
        issues.push({
          field: `experiences.${candExp.company}`,
          message: `Invenção detectada: Experiência "${candExp.role}" na empresa "${candExp.company}" não existe no Perfil Mestre.`,
          severity: "error",
        });
      } else {
        // Validação de Período/Datas
        if (match.period.trim().toLowerCase() !== candExp.period.trim().toLowerCase()) {
          issues.push({
            field: `experiences.${candExp.company}.period`,
            message: `Inconsistência de período na empresa "${candExp.company}": esperado "${match.period}", recebido "${candExp.period}".`,
            severity: "error",
          });
        }
      }
    });

    // 2. Validação de Formação Acadêmica
    candidate.education.forEach((candEdu) => {
      const match = master.education.find(
        (mEdu) =>
          mEdu.degree.trim().toLowerCase() === candEdu.degree.trim().toLowerCase() &&
          mEdu.institution.trim().toLowerCase() === candEdu.institution.trim().toLowerCase()
      );

      if (!match) {
        issues.push({
          field: `education.${candEdu.degree}`,
          message: `Invenção detectada: Formação "${candEdu.degree}" na instituição "${candEdu.institution}" não existe no Perfil Mestre.`,
          severity: "error",
        });
      }
    });

    // 3. Validação de Certificações
    candidate.certifications.forEach((candCert) => {
      const match = master.certifications.find(
        (mCert) => mCert.name.trim().toLowerCase() === candCert.name.trim().toLowerCase()
      );

      if (!match) {
        issues.push({
          field: `certifications.${candCert.name}`,
          message: `Invenção detectada: Certificação "${candCert.name}" não cadastrada no Perfil Mestre.`,
          severity: "error",
        });
      }
    });

    return {
      isValid: issues.filter((i) => i.severity === "error").length === 0,
      issues,
    };
  },
};
