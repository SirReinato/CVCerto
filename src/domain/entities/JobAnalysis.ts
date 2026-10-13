import { z } from "zod";

export const JobAnalysisSchema = z.object({
  jobTitle: z.string(),
  companyName: z.string().optional(),
  technicalRequirements: z.array(z.string()), // Hard skills obrigatórias
  softSkills: z.array(z.string()),            // Competências comportamentais
  atsKeywords: z.array(z.string()),           // Palavras-chave de alto peso para robôs ATS
  desiredCertifications: z.array(z.string()), // Certificações solicitadas (ex: AZ-900, ITIL)
  differentials: z.array(z.string()),         // Requisitos diferenciais
  matchScores: z.object({
    overall: z.number().min(0).max(100),      // Compatibilidade Geral (%)
    technical: z.number().min(0).max(100),    // Compatibilidade Técnica (%)
    behavioral: z.number().min(0).max(100),   // Compatibilidade Comportamental (%)
  }),
  matchedFacts: z.array(                      // Fatos reais do Renato que atendem à vaga
    z.object({
      factId: z.string(),
      description: z.string(),
      justification: z.string(),
    })
  ),
  gaps: z.array(z.string()),                  // Requisitos da vaga que Renato NÃO possui (honestidade ATS)
  recommendedHighlight: z.string(),           // Resumo do que destacar no currículo
  interviewPrep: z.object({                   // Preparação para entrevista e respostas para perguntas comuns
    salaryExpectationGuide: z.object({
      suggestedCLT: z.string(),
      suggestedPJ: z.string().optional(),
      justification: z.string(),
    }),
    motivationResponse: z.string(),           // O que motivou a se candidatar para a vaga
    commonQuestions: z.array(
      z.object({
        question: z.string(),
        suggestedAnswer: z.string(),
        keyPointsToHighlight: z.array(z.string()),
      })
    ),
    preparationTips: z.array(z.string()),     // Dicas de estudo e postura técnica
  }).optional(),
});

export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;
