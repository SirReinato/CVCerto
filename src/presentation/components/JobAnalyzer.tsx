import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { Sparkles, AlertTriangle, Target, Briefcase, FileSearch, ArrowRightCircle, ShieldCheck, Hourglass } from "lucide-react";
import type { ResumeData } from "../../domain/entities/Resume";
import type { JobAnalysis } from "../../domain/entities/JobAnalysis";
import { AiJobAnalysisService } from "../../infrastructure/ai/AiJobAnalysisService";
import { ResumeTailoringEngine, type TailoredResumeResult } from "../../domain/rules/ResumeTailoringEngine";
import { useToast } from "../../context/ToastContext";

interface JobAnalyzerProps {
  masterProfile: ResumeData;
  onAnalysisComplete?: (analysis: JobAnalysis) => void;
  onGenerateResume?: (
    tailoredResult: TailoredResumeResult,
    jobDetails?: {
      jobTitle: string;
      companyName: string;
      jobDescription: string;
      sourceUrl?: string;
      analysis: JobAnalysis;
    }
  ) => void;
}

const rotateAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(180deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
`;

const FloatingLoadingToast = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  background-color: #1e1e1e;
  color: #ffffff;
  padding: 16px 20px;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 9999;
  border-left: 5px solid #0078d4;
  animation: ${pulseAnimation} 2s infinite ease-in-out;
  max-width: 360px;

  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4da3ff;
    animation: ${rotateAnimation} 2.5s infinite ease-in-out;
  }

  .text-content {
    display: flex;
    flex-direction: column;
    gap: 2px;

    strong {
      font-size: 0.88rem;
      font-weight: 700;
      color: #ffffff;
    }

    span {
      font-size: 0.78rem;
      color: #bbbbbb;
    }
  }
`;

const Card = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #333333;
  }

  input,
  textarea {
    padding: 10px 12px;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    font-size: 0.88rem;
    outline: none;
    font-family: inherit;

    &:focus {
      border-color: #1e1e1e;
    }
  }

  textarea {
    min-height: 140px;
    resize: vertical;
  }
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const SubmitButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #1e1e1e;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;

  &:hover {
    background-color: #333333;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResultsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 12px;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
`;

const ScoresRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ScoreCard = styled.div<{ $color: string }>`
  background-color: #fafafa;
  border-left: 4px solid ${(props) => props.$color};
  padding: 14px;
  border-radius: 6px;

  .label {
    font-size: 0.78rem;
    color: #666666;
    font-weight: 600;
    text-transform: uppercase;
  }

  .value {
    font-size: 1.6rem;
    font-weight: 700;
    color: #1e1e1e;
    margin-top: 4px;
  }
`;

const TagCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;

  span {
    background-color: #f0f0f0;
    color: #333333;
    font-size: 0.78rem;
    padding: 4px 10px;
    border-radius: 20px;
    font-weight: 500;
  }

  span.ats {
    background-color: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
  }

  span.gap {
    background-color: #ffebee;
    color: #c62828;
    border: 1px solid #ffcdd2;
  }
`;

export const JobAnalyzer: React.FC<JobAnalyzerProps> = ({
  masterProfile,
  onAnalysisComplete,
  onGenerateResume,
}) => {
  const { showError } = useToast();
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<JobAnalysis | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await AiJobAnalysisService.analyzeJob({
        jobTitle,
        companyName,
        jobDescription,
        masterProfile,
      });

      setAnalysisResult(result);
      if (onAnalysisComplete) onAnalysisComplete(result);
    } catch (err) {
      showError("Erro ao realizar análise da vaga. Tente novamente.", "Erro na Análise");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <div>
        <h2 style={{ margin: "0 0 6px 0", fontSize: "1.2rem", color: "#1e1e1e", display: "flex", alignItems: "center", gap: 8 }}>
          <FileSearch size={22} /> Analisador Inteligente de Vagas (Gemini AI)
        </h2>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#666666" }}>
          Cole a descrição da vaga (LinkedIn, Gupy, etc.). A IA identificará palavras-chave ATS,
          requisitos e calculará o match real contra o seu Perfil Mestre sem inventar experiências.
        </p>
      </div>

      <form onSubmit={handleAnalyze} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FieldRow>
          <FormGroup>
            <label>Título do Cargo (Opcional)</label>
            <input
              placeholder="Ex: Analista de Suporte N2"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <label>Empresa (Opcional)</label>
            <input
              placeholder="Ex: Stefanini / NTT Data"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </FormGroup>
        </FieldRow>

        <FormGroup>
          <label>Link da Vaga / Portal (Opcional - Gupy, LinkedIn, Catho, etc.)</label>
          <input
            placeholder="Ex: https://empresa.gupy.io/job/123456 ou link do anúncio..."
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </FormGroup>

        <FormGroup>
          <label>Texto Completo da Vaga *</label>
          <textarea
            placeholder="Cole aqui os requisitos, atribuições e diferenciais copiados do anúncio da vaga..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
          />
        </FormGroup>

        <SubmitButton type="submit" disabled={isAnalyzing || !jobDescription.trim()}>
          <Sparkles size={18} />
          {isAnalyzing ? "Analisando com Gemini AI..." : "Analisar Vaga e Calcular Match"}
        </SubmitButton>
      </form>

      {analysisResult && (
        <ResultsGrid>
          <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#1e1e1e" }}>
            Resultado do Match de Compatibilidade
          </h3>

          <ScoresRow>
            <ScoreCard $color="#2e7d32">
              <div className="label">Match Geral</div>
              <div className="value">{analysisResult.matchScores.overall}%</div>
            </ScoreCard>
            <ScoreCard $color="#1565c0">
              <div className="label">Match Técnico (Hard Skills)</div>
              <div className="value">{analysisResult.matchScores.technical}%</div>
            </ScoreCard>
            <ScoreCard $color="#6a1b9a">
              <div className="label">Match Comportamental</div>
              <div className="value">{analysisResult.matchScores.behavioral}%</div>
            </ScoreCard>
          </ScoresRow>

          <div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "0.88rem", color: "#1e1e1e", display: "flex", alignItems: "center", gap: 6 }}>
              <Target size={16} /> Palavras-Chave de Alto Peso ATS Detectadas
            </h4>
            <TagCloud>
              {analysisResult.atsKeywords.map((kw, idx) => (
                <span key={idx} className="ats">{kw}</span>
              ))}
            </TagCloud>
          </div>

          <div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "0.88rem", color: "#1e1e1e", display: "flex", alignItems: "center", gap: 6 }}>
              <Briefcase size={16} /> Fatos Reais Compatíveis do seu Histórico
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              {analysisResult.matchedFacts.map((fact, idx) => (
                <div key={idx} style={{ background: "#f9f9f9", padding: "10px 14px", borderRadius: 6, fontSize: "0.84rem" }}>
                  <strong style={{ color: "#1e1e1e" }}>{fact.description}:</strong>{" "}
                  <span style={{ color: "#555" }}>{fact.justification}</span>
                </div>
              ))}
            </div>
          </div>

          {analysisResult.gaps.length > 0 && (
            <div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "0.88rem", color: "#c62828", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={16} /> Lacunas Honestas (Requisitos não presentes no Perfil Mestre)
              </h4>
              <TagCloud>
                {analysisResult.gaps.map((gap, idx) => (
                  <span key={idx} className="gap">{gap}</span>
                ))}
              </TagCloud>
            </div>
          )}

          <div style={{ backgroundColor: "#f5f5f5", padding: "14px", borderRadius: 6, borderLeft: "4px solid #1e1e1e" }}>
            <strong style={{ fontSize: "0.85rem", color: "#1e1e1e" }}>💡 Recomendação da IA para Otimização:</strong>
            <p style={{ margin: "6px 0 0 0", fontSize: "0.83rem", color: "#333333", lineHeight: 1.45 }}>
              {analysisResult.recommendedHighlight}
            </p>
          </div>

          {analysisResult.interviewPrep && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, backgroundColor: "#f8fafd", border: "1px solid #d0e2ff", borderRadius: 8, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0f62fe" }}>
                <Sparkles size={20} />
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>
                  Preparação para Entrevista & Respostas Estratégicas (IA)
                </h4>
              </div>

              {/* Guia de Pretensão Salarial */}
              <div style={{ backgroundColor: "#ffffff", padding: 14, borderRadius: 6, border: "1px solid #e0e0e0" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e1e1e", marginBottom: 6 }}>
                  💰 Guia de Pretensão Salarial Recomendada:
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontSize: "0.85rem", color: "#2e7d32", fontWeight: 600 }}>
                    CLT Fixo: {analysisResult.interviewPrep.salaryExpectationGuide.suggestedCLT}
                  </span>
                  {analysisResult.interviewPrep.salaryExpectationGuide.suggestedPJ && (
                    <span style={{ fontSize: "0.85rem", color: "#1565c0", fontWeight: 600 }}>
                      PJ: {analysisResult.interviewPrep.salaryExpectationGuide.suggestedPJ}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>
                  <em>Justificativa:</em> {analysisResult.interviewPrep.salaryExpectationGuide.justification}
                </p>
              </div>

              {/* Resposta de Motivação */}
              <div style={{ backgroundColor: "#ffffff", padding: 14, borderRadius: 6, border: "1px solid #e0e0e0" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e1e1e", marginBottom: 4 }}>
                  🎯 O que responder sobre o que motivou a se candidatar:
                </div>
                <p style={{ margin: 0, fontSize: "0.83rem", color: "#333333", lineHeight: 1.45, fontStyle: "italic" }}>
                  "{analysisResult.interviewPrep.motivationResponse}"
                </p>
              </div>

              {/* Perguntas e Respostas Comuns */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e1e1e" }}>
                  🗣️ Perguntas Frequentes & Respostas Sugeridas:
                </div>
                {analysisResult.interviewPrep.commonQuestions.map((qa, idx) => (
                  <div key={idx} style={{ backgroundColor: "#ffffff", padding: 12, borderRadius: 6, border: "1px solid #e0e0e0" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f62fe", marginBottom: 4 }}>
                      P: {qa.question}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#333", lineHeight: 1.45, marginBottom: 6 }}>
                      <strong>Sugestão:</strong> {qa.suggestedAnswer}
                    </div>
                    {qa.keyPointsToHighlight && qa.keyPointsToHighlight.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {qa.keyPointsToHighlight.map((kp, kidx) => (
                          <span key={kidx} style={{ backgroundColor: "#edf5ff", color: "#0043ce", fontSize: "0.72rem", padding: "2px 8px", borderRadius: 4 }}>
                            ✓ {kp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Dicas Práticas de Preparação */}
              {analysisResult.interviewPrep.preparationTips && (
                <div style={{ backgroundColor: "#ffffff", padding: 12, borderRadius: 6, border: "1px solid #e0e0e0" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e1e1e", marginBottom: 6 }}>
                    📌 Dicas Práticas de Postura e Estudo:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.8rem", color: "#444" }}>
                    {analysisResult.interviewPrep.preparationTips.map((tip, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {onGenerateResume && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <SubmitButton
                type="button"
                onClick={() => {
                  const tailored = ResumeTailoringEngine.generate(masterProfile, analysisResult);
                  onGenerateResume(tailored, {
                    jobTitle: jobTitle || analysisResult.jobTitle,
                    companyName: companyName || analysisResult.companyName || "Empresa Confidencial",
                    jobDescription,
                    sourceUrl: sourceUrl.trim() || undefined,
                    analysis: analysisResult,
                  });
                }}
              >
                <ShieldCheck size={18} />
                Gerar Currículo Otimizado (Validado Anti-Invenção)
                <ArrowRightCircle size={18} />
              </SubmitButton>
            </div>
          )}
        </ResultsGrid>
      )}

      {isAnalyzing && (
        <FloatingLoadingToast>
          <div className="icon-wrapper">
            <Hourglass size={24} />
          </div>
          <div className="text-content">
            <strong>Inteligência Artificial Analisando Vaga...</strong>
            <span>Cruzando requisitos com seu perfil e gerando estratégia ATS</span>
          </div>
        </FloatingLoadingToast>
      )}
    </Card>
  );
};
export default JobAnalyzer;
