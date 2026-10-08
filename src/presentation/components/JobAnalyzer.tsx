import React, { useState } from "react";
import styled from "styled-components";
import { Sparkles, AlertTriangle, Target, Briefcase, FileSearch } from "lucide-react";
import type { ResumeData } from "../../domain/entities/Resume";
import type { JobAnalysis } from "../../domain/entities/JobAnalysis";
import { AiJobAnalysisService } from "../../infrastructure/ai/AiJobAnalysisService";

interface JobAnalyzerProps {
  masterProfile: ResumeData;
  onAnalysisComplete?: (analysis: JobAnalysis) => void;
}

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

export const JobAnalyzer: React.FC<JobAnalyzerProps> = ({ masterProfile, onAnalysisComplete }) => {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
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
      alert("Erro ao realizar análise da vaga.");
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
        </ResultsGrid>
      )}
    </Card>
  );
};
export default JobAnalyzer;
