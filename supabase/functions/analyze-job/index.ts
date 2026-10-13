// Supabase Edge Function: analyze-job
// Runtime: Deno
// Objetivo: Analisar o texto da vaga utilizando Google Gemini
// com saída estritamente estruturada (JSON Schema) para o dossiê em 8 seções e cruzamento com os fatos reais do Renato.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { jobTitle, companyName, jobDescription, masterProfile } = await req.json();

    if (!jobDescription) {
      return new Response(JSON.stringify({ error: "Descrição da vaga é obrigatória." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Chave GEMINI_API_KEY não configurada no Supabase Edge Secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const prompt = `
Você é um Tech Recruiter Sênior e Career Coach Executivo especializado na área de Tecnologia.
Sua missão é receber:
1. Perfil Mestre (Base da Verdade do Candidato): Experiências reais, formações, certificações e projetos.
2. Descrição Completa da Vaga (Job Description): Requisitos, escopo, cultura e desafios da empresa contratante.

A partir desses dados, você deve gerar um dossiê ultra-completo e acionável para a Modal de Preparação para Entrevista e Análise da Vaga.

REGRA DE OURO (SEM ALUCINAÇÃO):
As respostas prontas e argumentos devem usar estritamente fatos reais presentes no Perfil Mestre do candidato. Se a vaga exigir algo que o candidato não possui diretamente, trace paralelos de adaptabilidade rápida com as tecnologias que ele já domina, sem mentir.

DADOS DA VAGA:
Cargo informado: ${jobTitle || "Não informado"}
Empresa informada: ${companyName || "Não informada"}
Descrição Completa:
"""
${jobDescription}
"""

PERFIL MESTRE DO CANDIDATO (FATOS REAIS):
"""
${JSON.stringify(masterProfile, null, 2)}
"""

Retorne OBRIGATORIAMENTE um JSON estritamente válido seguindo este formato exato:
{
  "jobTitle": "Cargo Alvo identificado",
  "companyName": "Nome da Empresa identificado",
  "technicalRequirements": ["hard skill 1", "hard skill 2"],
  "softSkills": ["soft skill 1", "soft skill 2"],
  "atsKeywords": ["palavra-chave ATS 1", "palavra-chave ATS 2"],
  "desiredCertifications": ["certificação solicitada"],
  "differentials": ["diferencial solicitado"],
  "matchScores": {
    "overall": 88,
    "technical": 90,
    "behavioral": 86
  },
  "matchedFacts": [
    {
      "factId": "id-do-fato",
      "description": "descrição do fato real no perfil",
      "justification": "por que atende ao requisito da vaga"
    }
  ],
  "gaps": ["requisito não atendido 100%"],
  "recommendedHighlight": "Orientação de quais experiências reais priorizar no currículo.",
  "interviewDossier": {
    "executiveDiagnosis": {
      "targetRole": "${jobTitle || "Cargo Alvo"}",
      "companyName": "${companyName || "Empresa Contratante"}",
      "overallMatchScore": 88,
      "culturalAndTechnicalFit": {
        "immediateStrengths": [
          "Requisito 1 onde o candidato se destaca com folga",
          "Requisito 2 onde o candidato se destaca com folga",
          "Requisito 3 onde o candidato se destaca com folga"
        ],
        "gapsAndOvercomingStrategy": [
          {
            "gap": "Requisito da vaga não atendido 100%",
            "strategy": "Estratégia exata para justificar na conversa com adaptabilidade rápida"
          }
        ],
        "jobSummaryVision": "Síntese em 3 linhas dos reais desafios que a empresa quer resolver."
      }
    },
    "salaryAnalysis": {
      "suggestedCLT": "R$ X.XXX a R$ Y.YYY",
      "suggestedPJ": "R$ X.XXX a R$ Y.YYY",
      "pricingJustification": "Argumento fundamentado na senioridade e escopo.",
      "flexibilityTrigger": "Frase pronta considerando benefícios corporativos."
    },
    "screeningScripts": {
      "elevatorPitch": "Elevator Pitch de 90 segundos em 1ª pessoa.",
      "helpCompanyChallenge": "Resposta conectando dor descrita com habilidade real do candidato.",
      "motivation": "O que motivou a candidatura citando o impacto da empresa.",
      "transitionReason": "Resposta segura focada em expansão técnica."
    },
    "behavioralStarQuestions": [
      {
        "question": "Pergunta STAR 1 (Incidente sob pressão)",
        "situation": "Situação real",
        "task": "Tarefa",
        "action": "Ação",
        "result": "Resultado mensurável",
        "appliedDifferentials": ["✓ ITIL 4", "✓ SLA cumprido"]
      },
      {
        "question": "Pergunta STAR 2 (Divergência técnica)",
        "situation": "Situação",
        "task": "Tarefa",
        "action": "Ação",
        "result": "Resultado",
        "appliedDifferentials": ["✓ Comunicação empática"]
      },
      {
        "question": "Pergunta STAR 3 (Múltiplas demandas simultâneas)",
        "situation": "Situação",
        "task": "Tarefa",
        "action": "Ação",
        "result": "Resultado",
        "appliedDifferentials": ["✓ Matriz de Priorização"]
      }
    ],
    "technicalSabatina": [
      {
        "question": "Pergunta técnica 1",
        "idealAnswer": "Resposta direta e técnica",
        "redFlagsToAvoid": "O que evitar dizer"
      },
      {
        "question": "Pergunta técnica 2",
        "idealAnswer": "Resposta direta e técnica",
        "redFlagsToAvoid": "O que evitar dizer"
      },
      {
        "question": "Pergunta técnica 3",
        "idealAnswer": "Resposta direta e técnica",
        "redFlagsToAvoid": "O que evitar dizer"
      },
      {
        "question": "Pergunta técnica 4",
        "idealAnswer": "Resposta direta e técnica",
        "redFlagsToAvoid": "O que evitar dizer"
      },
      {
        "question": "Pergunta técnica 5",
        "idealAnswer": "Resposta direta e técnica",
        "redFlagsToAvoid": "O que evitar dizer"
      }
    ],
    "maximumSharpness": {
      "realCasesToRemember": ["Case 1", "Case 2", "Case 3"],
      "keyConceptsToReview": ["Conceito 1", "Conceito 2", "Conceito 3", "Conceito 4"],
      "mindsetAndPostureTip": "Dica de postura para a entrevista"
    },
    "smartQuestionsToAsk": {
      "architectureAndProcesses": "Pergunta sobre arquitetura e processos",
      "first90DaysSuccessCriteria": "Pergunta sobre critérios de sucesso nos 90 dias",
      "teamAutonomyAndGrowth": "Pergunta sobre autonomia do time"
    }
  },
  "suggestedCoverLetter": "Apresentação executiva concisa para e-mail da vaga."
}
`;

    // Chamada à API do Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: `Erro na API Gemini: ${errorText}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await response.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("Resposta da IA vazia.");
    }

    const analysisResult = JSON.parse(generatedText);

    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
