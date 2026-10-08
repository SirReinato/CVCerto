// Supabase Edge Function: analyze-job
// Runtime: Deno
// Objetivo: Analisar o texto da vaga utilizando Google Gemini 2.5 Flash
// com saída estritamente estruturada (JSON Schema) e cruzamento com os fatos reais do Renato.

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
Você é um Especialista em Recrutamento Técnico e Otimização para ATS (Applicant Tracking Systems).
Sua missão é analisar uma Vaga de Emprego e compará-la rigorosamente com a Base de Fatos Reais do candidato Renato de França Lima.

REGRA MANDATÓRIA ABSOLUTA:
NUNCA invente fatos, cargos, experiências, tecnologias ou certificações. Baseie-se APENAS nas informações fornecidas no Perfil Mestre.
Se a vaga solicitar um requisito que o candidato não possui, registre-o expressamente na lista de "gaps". Jamais crie qualificações falsas.

DADOS DA VAGA:
Título informado: ${jobTitle || "Não informado"}
Empresa informada: ${companyName || "Não informada"}
Descrição Completa:
"""
${jobDescription}
"""

PERFIL MESTRE DO CANDIDATO (FATOS REAIS):
"""
${JSON.stringify(masterProfile, null, 2)}
"""

Retorne OBRIGATORIAMENTE um JSON estritamente compatível com o seguinte formato:
{
  "jobTitle": "Título refinado da vaga",
  "companyName": "Nome da empresa identificado",
  "technicalRequirements": ["hard skill 1", "hard skill 2"],
  "softSkills": ["soft skill 1", "soft skill 2"],
  "atsKeywords": ["palavra-chave ATS 1", "palavra-chave ATS 2"],
  "desiredCertifications": ["certificação pedida"],
  "differentials": ["diferencial pedido"],
  "matchScores": {
    "overall": 85,
    "technical": 90,
    "behavioral": 80
  },
  "matchedFacts": [
    {
      "factId": "id-do-fato-no-perfil",
      "description": "descrição da experiência/certificação real que atende",
      "justification": "por que atende ao requisito da vaga"
    }
  ],
  "gaps": ["requisito da vaga que o candidato NÃO possui"],
  "recommendedHighlight": "Orientação de quais experiências reais priorizar no currículo para maximizar aderência ao ATS sem mentir."
}
`;

    // Chamada à API do Gemini utilizando modelo 2.5 Flash com resposta forçada em JSON
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2, // Temperatura baixa para garantir determinismo e fidelidade factual
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
