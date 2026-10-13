import { z } from "zod";

// 1. Resumo Executivo & Diagnóstico de Match
export const ExecutiveDiagnosisSchema = z.object({
  targetRole: z.string(),
  companyName: z.string(),
  overallMatchScore: z.number().min(0).max(100),
  culturalAndTechnicalFit: z.object({
    immediateStrengths: z.array(z.string()), // 3 a 4 requisitos onde o candidato se destaca
    gapsAndOvercomingStrategy: z.array(
      z.object({
        gap: z.string(),
        strategy: z.string(), // estratégia exata para justificar na entrevista
      })
    ),
    jobSummaryVision: z.string(), // Síntese em 3 linhas dos reais desafios que a empresa quer resolver
  }),
});

// 2. Análise Salarial & Negociação Estratégica
export const SalaryAnalysisSchema = z.object({
  suggestedCLT: z.string(),
  suggestedPJ: z.string(),
  pricingJustification: z.string(),
  flexibilityTrigger: z.string(), // Frase pronta considerando benefícios corporativos
});

// 3. Scripts Prontos para Etapas de Triagem (Gupy / LinkedIn / Formulários)
export const ScreeningScriptsSchema = z.object({
  elevatorPitch: z.string(),        // Trajetória de 90 segundos: Passado + Presente + Próximo passo
  helpCompanyChallenge: z.string(), // Conexão entre a maior dor da vaga e habilidade real do candidato
  motivation: z.string(),           // O que motivou a candidatura citando o impacto da empresa
  transitionReason: z.string(),     // Por que sair da posição atual / transição, focado em expansão
});

// 4. Simulação de Perguntas Comportamentais (Método STAR)
export const StarSimulationQuestionSchema = z.object({
  question: z.string(),
  situation: z.string(), // S
  task: z.string(),      // T
  action: z.string(),    // A
  result: z.string(),    // R
  appliedDifferentials: z.array(z.string()), // ex: ITIL 4, SLA cumprido, Resolução sem reincidência
});

// 5. Sabatina Técnica (Live Coding / Entrevista com Tech Lead)
export const TechnicalSabatinaItemSchema = z.object({
  question: z.string(),
  idealAnswer: z.string(),
  redFlagsToAvoid: z.string(), // O que nunca dizer nessa resposta
});

// 6. "Afiação Máxima" (Checklist de Última Hora - 30 min antes da chamada)
export const MaximumSharpnessSchema = z.object({
  realCasesToRemember: z.array(z.string()), // 3 projetos ou ocorrências reais na ponta da língua
  keyConceptsToReview: z.array(z.string()), // termos e siglas para repassar mentalmente
  mindsetAndPostureTip: z.string(),        // Dica de postura (RH vs Gestor de TI)
});

// 7. Perguntas Inteligentes para o Candidato Fazer ao Entrevistador
export const SmartQuestionsToAskSchema = z.object({
  architectureAndProcesses: z.string(),
  first90DaysSuccessCriteria: z.string(),
  teamAutonomyAndGrowth: z.string(),
});

// Dossiê Completo de Entrevista
export const FullInterviewDossierSchema = z.object({
  executiveDiagnosis: ExecutiveDiagnosisSchema,
  salaryAnalysis: SalaryAnalysisSchema,
  screeningScripts: ScreeningScriptsSchema,
  behavioralStarQuestions: z.array(StarSimulationQuestionSchema),
  technicalSabatina: z.array(TechnicalSabatinaItemSchema),
  maximumSharpness: MaximumSharpnessSchema,
  smartQuestionsToAsk: SmartQuestionsToAskSchema,
});

export const JobAnalysisSchema = z.object({
  jobTitle: z.string(),
  companyName: z.string().optional(),
  technicalRequirements: z.array(z.string()),
  softSkills: z.array(z.string()),
  atsKeywords: z.array(z.string()),
  desiredCertifications: z.array(z.string()),
  differentials: z.array(z.string()),
  matchScores: z.object({
    overall: z.number().min(0).max(100),
    technical: z.number().min(0).max(100),
    behavioral: z.number().min(0).max(100),
  }),
  matchedFacts: z.array(
    z.object({
      factId: z.string(),
      description: z.string(),
      justification: z.string(),
    })
  ),
  gaps: z.array(z.string()),
  recommendedHighlight: z.string(),
  interviewPrep: z.object({
    salaryExpectationGuide: z.object({
      suggestedCLT: z.string(),
      suggestedPJ: z.string().optional(),
      justification: z.string(),
    }),
    motivationResponse: z.string(),
    commonQuestions: z.array(
      z.object({
        question: z.string(),
        suggestedAnswer: z.string(),
        keyPointsToHighlight: z.array(z.string()),
      })
    ),
    preparationTips: z.array(z.string()),
  }).optional(),
  interviewDossier: FullInterviewDossierSchema.optional(),
  suggestedCoverLetter: z.string().optional(),
});

export type ExecutiveDiagnosis = z.infer<typeof ExecutiveDiagnosisSchema>;
export type SalaryAnalysis = z.infer<typeof SalaryAnalysisSchema>;
export type ScreeningScripts = z.infer<typeof ScreeningScriptsSchema>;
export type StarSimulationQuestion = z.infer<typeof StarSimulationQuestionSchema>;
export type TechnicalSabatinaItem = z.infer<typeof TechnicalSabatinaItemSchema>;
export type MaximumSharpness = z.infer<typeof MaximumSharpnessSchema>;
export type SmartQuestionsToAsk = z.infer<typeof SmartQuestionsToAskSchema>;
export type FullInterviewDossier = z.infer<typeof FullInterviewDossierSchema>;
export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;
