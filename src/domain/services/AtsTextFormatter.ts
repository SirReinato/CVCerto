import type { ResumeData } from "../entities/Resume";

export const AtsTextFormatter = {
  /**
   * Converte o currículo em formato de texto estruturado puro (Plain Text / ASCII),
   * otimizado especificamente para parsers de ATS (Gupy, Workday, Taleo, Kenoby, LinkedIn).
   */
  formatAsAtsText(data: ResumeData): string {
    const lines: string[] = [];

    // 1. Cabeçalho / Identificação
    lines.push(data.personalInfo.fullName.toUpperCase());
    lines.push(data.personalInfo.targetRoleOrTags.toUpperCase());
    lines.push(
      `${data.personalInfo.city} | ${data.personalInfo.phone} | ${data.personalInfo.email} | ${data.personalInfo.linkedin || ""}`
    );
    lines.push("");

    // 2. Resumo Profissional
    lines.push("RESUMO PROFISSIONAL");
    lines.push(data.summary);
    lines.push("");

    // 3. Experiências Profissionais
    lines.push("EXPERIÊNCIAS PROFISSIONAIS");
    data.experiences.forEach((exp) => {
      lines.push(`${exp.role.toUpperCase()} | ${exp.company}`);
      lines.push(`${exp.period}`);
      exp.activities.forEach((act) => {
        lines.push(`• ${act}`);
      });
      lines.push("");
    });

    // 4. Formação Acadêmica
    lines.push("FORMAÇÃO ACADÊMICA");
    data.education.forEach((edu) => {
      lines.push(`• ${edu.degree} - ${edu.institution} (${edu.status})`);
    });
    lines.push("");

    // 5. Certificações
    if (data.certifications && data.certifications.length > 0) {
      lines.push("CERTIFICAÇÕES");
      data.certifications.forEach((cert) => {
        lines.push(`• ${cert.name} (${cert.statusOrYear})`);
      });
      lines.push("");
    }

    // 6. Conhecimentos Técnicos
    lines.push("CONHECIMENTOS TÉCNICOS");
    data.skills.forEach((skill) => {
      lines.push(`• ${skill.categoryName}: ${skill.skills.join(", ")}`);
    });
    lines.push("");

    // 7. Projetos e Portfólio
    if (data.projects && data.projects.length > 0) {
      lines.push("PROJETOS E PORTFÓLIO");
      data.projects.forEach((proj) => {
        const linkInfo = proj.link ? ` [${proj.link}]` : "";
        lines.push(`• ${proj.name}${linkInfo}`);
        lines.push(`- ${proj.description}`);
        if (proj.stack) {
          lines.push(`  Stack: ${proj.stack}`);
        }
      });
      lines.push("");
    }

    // 8. Idiomas
    if (data.languages && data.languages.length > 0) {
      lines.push("IDIOMAS");
      data.languages.forEach((lang) => {
        lines.push(`• ${lang}`);
      });
      lines.push("");
    }

    return lines.join("\n");
  },

  /**
   * Copia o texto limpo para a área de transferência do usuário
   */
  async copyAtsTextToClipboard(data: ResumeData): Promise<boolean> {
    try {
      const text = this.formatAsAtsText(data);
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error("[AtsTextFormatter] Erro ao copiar texto ATS:", err);
      return false;
    }
  },

  /**
   * Faz o download de um arquivo .txt estruturado para upload em sistemas ATS
   */
  downloadAtsTextFile(data: ResumeData, filename: string = "cv-renato-de-franca-lima-ats.txt"): void {
    const text = this.formatAsAtsText(data);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
