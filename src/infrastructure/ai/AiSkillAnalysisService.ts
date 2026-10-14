import type { ResumeData } from "../../domain/entities/Resume";

export interface AnalyzeSkillParams {
  textDescription?: string;
  fileBase64?: string;
  fileMimeType?: string;
  fileName?: string;
  currentMasterProfile: ResumeData;
}

export interface StructuredSkillResult {
  type: "certification" | "course" | "skill" | "project";
  typeLabel: string;
  title: string;
  issuerOrInstitution: string;
  dateOrYear: string;
  workload?: string;
  skillsGained: string[];
  suggestedCategoryName: string;
  careerImpact: string;
  interviewTalkingPoints: string;
  suggestedResumeText: string;
  atsKeywords: string[];
}

export const AiSkillAnalysisService = {
  /**
   * Analisa um PDF de certificado ou texto livre de habilidade,
   * estruturando os fatos reais com Gemini 3.5 Flash Lite.
   */
  async analyzeSkill(params: AnalyzeSkillParams): Promise<StructuredSkillResult> {
    const apiKey =
      import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("[AiSkillAnalysisService] API Key não encontrada, utilizando parser local defensivo.");
      return this.fallbackLocalSkillParser(params);
    }

    const prompt = `
Você é um Tech Recruiter Sênior e Especialista em Talent Intelligence e Carreiras de TI.
Sua missão é receber um certificado/diploma (via documento/PDF ou texto) ou uma explicação de nova habilidade/curso do profissional Renato de França Lima.

DADOS FORNECIDOS PELO CANDIDATO:
${params.fileName ? `Nome do Arquivo: ${params.fileName}` : ""}
${params.textDescription ? `Explicação do Candidato:\n"""\n${params.textDescription}\n"""` : ""}

PERFIL MESTRE ATUAL DO RENATO:
- Cargo Alvo: ${params.currentMasterProfile.personalInfo.targetRoleOrTags}
- Certificações atuais: ${params.currentMasterProfile.certifications.map((c) => c.name).join(", ")}
- Formações atuais: ${params.currentMasterProfile.education.map((e) => `${e.degree} (${e.institution})`).join(", ")}
- Categorias de habilidades: ${params.currentMasterProfile.skills.map((s) => s.categoryName).join(", ")}

DIRETRIZES DA ANÁLISE:
1. Extraia com precisão: Título oficial da certificação/curso/habilidade, Instituição/Plataforma emissora (ex: Microsoft, AWS, Alura, Udemy, Coursera), Carga horária se houver, Ano/Data.
2. Identifique as Hard Skills técnicas adquiridas e palavras-chave ATS de alto valor.
3. Explique o "Impacto na Carreira / Vagas Futuras": quais tipos de vagas essa nova conquista desbloqueia ou fortalece.
4. Crie um "Argumento de Entrevista": frase pronta em 1ª pessoa que o Renato pode usar na entrevista técnica ou com RH para valorizar esse conhecimento.
5. Sugira em qual categoria de habilidades do currículo melhor se encaixa (ex: "Suporte Técnico e Administração de Sistemas", "Nuvem & Infraestrutura", "Front-end & Tecnologias Web", "Automação & Ferramentas").

Retorne OBRIGATORIAMENTE um JSON estritamente válido seguindo este formato exato:
{
  "type": "certification", // ou "course" ou "skill" ou "project"
  "typeLabel": "Certificação Oficial", // ou "Curso de Especialização" ou "Habilidade Técnica" ou "Projeto Prático"
  "title": "Nome formal da certificação ou habilidade",
  "issuerOrInstitution": "Instituição emissora",
  "dateOrYear": "2026",
  "workload": "40 horas",
  "skillsGained": ["Habilidade 1", "Habilidade 2", "Habilidade 3"],
  "suggestedCategoryName": "Nuvem & Infraestrutura",
  "careerImpact": "Como essa conquista fortalece o perfil para novas vagas de TI e aumenta a taxa de aprovação ATS.",
  "interviewTalkingPoints": "Argumento pronto em primeira pessoa demonstrando aplicação prática desse conhecimento.",
  "suggestedResumeText": "Texto padronizado para aparecer no currículo A4 do Renato.",
  "atsKeywords": ["palavra-chave 1", "palavra-chave 2"]
}
`;

    const parts: any[] = [];

    // Se houver arquivo PDF ou imagem em Base64, anexa como inlineData para leitura multimodal nativa da Gemini
    if (params.fileBase64 && params.fileMimeType) {
      parts.push({
        inlineData: {
          mimeType: params.fileMimeType,
          data: params.fileBase64,
        },
      });
    }

    parts.push({ text: prompt });

    const modelsToTry = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest"];

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[AiSkillAnalysisService] Modelo ${model} falhou (${response.status}):`, errText);
          continue;
        }

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) continue;

        text = text.trim();
        if (text.startsWith("```json")) {
          text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
        } else if (text.startsWith("```")) {
          text = text.replace(/^```\s*/, "").replace(/```\s*$/, "");
        }

        const parsed = JSON.parse(text) as StructuredSkillResult;
        console.log(`[AiSkillAnalysisService] Habilidade extraída com sucesso via ${model}!`);
        return parsed;
      } catch (err) {
        console.warn(`[AiSkillAnalysisService] Erro ao analisar com ${model}:`, err);
      }
    }

    return this.fallbackLocalSkillParser(params);
  },

  /**
   * Fallback determinístico caso a chamada à API falhe por falta de conexão
   */
  fallbackLocalSkillParser(params: AnalyzeSkillParams): StructuredSkillResult {
    const raw = (params.textDescription || params.fileName || "Nova Habilidade").trim();
    const currentYear = new Date().getFullYear().toString();

    const isCert = /certifica|cert|exame|az-|md-|itil|aws|comptia/i.test(raw);
    const isCourse = /curso|bootcamp|capacita|formação|horas|alura|udemy/i.test(raw);

    const type = isCert ? "certification" : isCourse ? "course" : "skill";
    const typeLabel = isCert
      ? "Certificação Oficial"
      : isCourse
      ? "Curso de Especialização"
      : "Habilidade Técnica";

    return {
      type,
      typeLabel,
      title: raw.split("\n")[0].substring(0, 80) || "Nova Conquista Registrada",
      issuerOrInstitution: "Instituição de Ensino / Certificadora",
      dateOrYear: currentYear,
      workload: "40 horas",
      skillsGained: [raw.substring(0, 30), "Sustentação Técnica", "Melhoria Contínua"],
      suggestedCategoryName: "Suporte Técnico e Administração de Sistemas",
      careerImpact: "Aumenta a competitividade do perfil técnico e adiciona termos relevantes para robôs de triagem ATS.",
      interviewTalkingPoints: `Recentemente consolidei meus conhecimentos em ${raw.substring(0, 40)}, aplicando boas práticas de mercado e agregando valor direto às rotinas operacionais da equipe.`,
      suggestedResumeText: `${raw.substring(0, 50)} – Concluído (${currentYear})`,
      atsKeywords: [raw.substring(0, 20), "Certificação", "Capacitação Contínua"],
    };
  },
};
