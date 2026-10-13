import React from "react";
import styled from "styled-components";
import { X, GitCompare, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import type { ResumeData } from "../../domain/entities/Resume";

interface ResumeDiffModalProps {
  baseResume: ResumeData;
  tailoredResume: ResumeData;
  jobTitle?: string;
  onClose: () => void;
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 16px;
`;

const ModalCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  max-width: 960px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 16px 24px;
  background: #0f172a;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title-group {
    display: flex;
    align-items: center;
    gap: 12px;

    .icon-badge {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(37, 99, 235, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .meta {
      font-size: 0.8rem;
      color: #94a3b8;
    }
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #ffffff;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
`;

const DiffGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DiffColumn = styled.div<{ $isTailored?: boolean }>`
  background: ${(props) => (props.$isTailored ? "#f0fdf4" : "#f8fafc")};
  border: 1px solid ${(props) => (props.$isTailored ? "#bbf7d0" : "#e2e8f0")};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  .col-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid ${(props) => (props.$isTailored ? "#bbf7d0" : "#e2e8f0")};

    h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: ${(props) => (props.$isTailored ? "#15803d" : "#0f172a")};
      display: flex;
      align-items: center;
      gap: 6px;
    }

    span {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      background: ${(props) => (props.$isTailored ? "#dcfce7" : "#e2e8f0")};
      color: ${(props) => (props.$isTailored ? "#166534" : "#475569")};
    }
  }
`;

const DiffSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  .label {
    font-size: 0.76rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #64748b;
  }

  .value {
    font-size: 0.84rem;
    line-height: 1.5;
    color: #1e293b;
    background: #ffffff;
    padding: 10px 12px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
  }
`;

export const ResumeDiffModal: React.FC<ResumeDiffModalProps> = ({
  baseResume,
  tailoredResume,
  jobTitle,
  onClose,
}) => {
  return (
    <Overlay onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <div className="title-group">
            <div className="icon-badge">
              <GitCompare size={20} color="#60a5fa" />
            </div>
            <div>
              <h3>Comparador de Versões: Base vs Otimizado para ATS</h3>
              <div className="meta">
                Visualização detalhada das ênfases e priorizações geradas para: {jobTitle || "Vaga Específica"}
              </div>
            </div>
          </div>
          <button className="close-btn" type="button" onClick={onClose} title="Fechar">
            <X size={20} />
          </button>
        </ModalHeader>

        <ModalBody>
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: 8,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: "0.84rem",
              color: "#065f46",
            }}
          >
            <ShieldCheck size={20} color="#059669" />
            <span>
              <strong>Garantia de Fato Real:</strong> O validador determinístico assegura que nenhuma empresa, cargo,
              formação ou certificação foi criada pela IA. Apenas a ordem das atividades e as palavras-chave do resumo foram ajustadas.
            </span>
          </div>

          <DiffGrid>
            {/* Coluna 1: Currículo Base */}
            <DiffColumn>
              <div className="col-header">
                <h4>Currículo Base Oficial</h4>
                <span>Original</span>
              </div>

              <DiffSection>
                <div className="label">Subtítulo / Especialidades:</div>
                <div className="value">{baseResume.personalInfo.targetRoleOrTags}</div>
              </DiffSection>

              <DiffSection>
                <div className="label">Resumo Profissional:</div>
                <div className="value">{baseResume.summary}</div>
              </DiffSection>

              <DiffSection>
                <div className="label">Ordem de Experiências & Destaques:</div>
                <div className="value" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {baseResume.experiences.map((exp, i) => (
                    <div key={i} style={{ borderBottom: i === 0 ? "1px dashed #cbd5e1" : "none", paddingBottom: 6 }}>
                      <strong>{exp.role}</strong> ({exp.company})
                      <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>
                        Top atividade: {exp.activities[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </DiffSection>
            </DiffColumn>

            {/* Coluna 2: Currículo Adaptado */}
            <DiffColumn $isTailored>
              <div className="col-header">
                <h4>
                  Versão Otimizada para ATS <ArrowRight size={15} />
                </h4>
                <span>Priorizada por IA</span>
              </div>

              <DiffSection>
                <div className="label">Subtítulo Ajustado com Keywords:</div>
                <div className="value" style={{ borderColor: "#86efac", background: "#f0fdf4", fontWeight: 600 }}>
                  {tailoredResume.personalInfo.targetRoleOrTags}
                </div>
              </DiffSection>

              <DiffSection>
                <div className="label">Resumo Profissional Adaptado:</div>
                <div className="value" style={{ borderColor: "#86efac", background: "#f0fdf4" }}>
                  {tailoredResume.summary}
                </div>
              </DiffSection>

              <DiffSection>
                <div className="label">Atividades Reordenadas pelo ATS:</div>
                <div className="value" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tailoredResume.experiences.map((exp, i) => (
                    <div key={i} style={{ borderBottom: i === 0 ? "1px dashed #86efac" : "none", paddingBottom: 6 }}>
                      <strong style={{ color: "#15803d" }}>{exp.role}</strong> ({exp.company})
                      <div style={{ fontSize: "0.78rem", color: "#166534", marginTop: 2 }}>
                        <CheckCircle2 size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                        Priorizada: {exp.activities[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </DiffSection>
            </DiffColumn>
          </DiffGrid>
        </ModalBody>
      </ModalCard>
    </Overlay>
  );
};
