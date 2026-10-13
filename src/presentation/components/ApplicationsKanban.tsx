import React, { useState } from "react";
import styled from "styled-components";
import { Building2, Download, Send, Sparkles, X, CheckCircle2, Target, HelpCircle, DollarSign, BookOpen } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import type { ApplicationStatus } from "../../shared/types/database.types";
import type { ApplicationItem } from "../../infrastructure/supabase/JobApplicationsRepository";
import type { ResumeData } from "../../domain/entities/Resume";
import { ResumePDFTemplate } from "../templates/ResumePDFTemplate";

interface ApplicationsKanbanProps {
  applications: ApplicationItem[];
  masterProfile: ResumeData;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onSendEmail?: (app: ApplicationItem) => void;
}

const COLUMNS: Array<{ status: ApplicationStatus; label: string; color: string }> = [
  { status: "curriculo_gerado", label: "Currículo Gerado", color: "#607d8b" },
  { status: "curriculo_enviado", label: "Enviado", color: "#1976d2" },
  { status: "triagem_inicial", label: "Triagem RH", color: "#f57c00" },
  { status: "entrevista_tecnica", label: "Entrevista Técnica", color: "#7b1fa2" },
  { status: "entrevista_gestor", label: "Entrevista Gestor", color: "#00796b" },
  { status: "aguardando_retorno", label: "Aguardando", color: "#ffa000" },
  { status: "aprovado", label: "Aprovado 🎉", color: "#388e3c" },
  { status: "reprovado", label: "Reprovado", color: "#d32f2f" },
];

const Board = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
  min-height: 480px;

  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }
`;

const Column = styled.div`
  flex: 0 0 280px;
  background-color: #f4f4f4;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ColumnHeader = styled.div<{ $color: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 3px solid ${(props) => props.$color};
  padding-top: 8px;

  h3 {
    font-size: 0.88rem;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }

  span {
    background-color: #e0e0e0;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 12px;
    color: #444;
  }
`;

const Card = styled.div`
  background-color: #ffffff;
  border-radius: 6px;
  padding: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #e8e8e8;

  h4 {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1e1e1e;
    margin: 0;
  }

  .company {
    font-size: 0.8rem;
    color: #666;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: #777;
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px dashed #eee;
  }
`;

const StatusSelect = styled.select`
  font-size: 0.75rem;
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid #d0d0d0;
  background-color: #fafafa;
  outline: none;
  cursor: pointer;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
`;

const ModalDialog = styled.div`
  background-color: #ffffff;
  border-radius: 10px;
  max-width: 680px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #eaeaea;
  position: sticky;
  top: 0;
  background: #ffffff;
  z-index: 10;

  h3 {
    margin: 0;
    font-size: 1.15rem;
    color: #1e1e1e;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #888;
    padding: 4px;
    border-radius: 4px;

    &:hover {
      color: #1e1e1e;
      background: #f0f0f0;
    }
  }
`;

const ModalBody = styled.div`
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const SectionBox = styled.div`
  background-color: #f8fafd;
  border: 1px solid #d0e2ff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  h4 {
    margin: 0;
    font-size: 0.92rem;
    color: #0f62fe;
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const QuestionCard = styled.div`
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .q-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: #0f62fe;
  }

  .q-ans {
    font-size: 0.82rem;
    color: #333;
    line-height: 1.45;
  }

  .tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 4px;

    span {
      background: #edf5ff;
      color: #0043ce;
      font-size: 0.72rem;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
    }
  }
`;

export const ApplicationsKanban: React.FC<ApplicationsKanbanProps> = ({
  applications,
  masterProfile,
  onStatusChange,
  onSendEmail,
}) => {
  const [selectedAppModal, setSelectedAppModal] = useState<ApplicationItem | null>(null);

  return (
    <>
      <Board>
        {COLUMNS.map((col) => {
          const items = applications.filter((app) => app.status === col.status);
          return (
            <Column key={col.status}>
              <ColumnHeader $color={col.color}>
                <h3>{col.label}</h3>
                <span>{items.length}</span>
              </ColumnHeader>

              {items.map((app) => (
                <Card key={app.id}>
                  <h4>{app.jobs?.title || "Vaga Cadastrada"}</h4>
                  <div className="company">
                    <Building2 size={14} />
                    <span>{app.jobs?.companies?.name || "Empresa Confidencial"}</span>
                  </div>

                  <div className="meta">
                    <span>Match: {app.match_overall || 85}%</span>
                    <StatusSelect
                      value={app.status}
                      onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.status} value={c.status}>
                          {c.label}
                        </option>
                      ))}
                    </StatusSelect>
                  </div>

                  {/* Botão de Dicas e Preparação */}
                  <button
                    type="button"
                    onClick={() => setSelectedAppModal(app)}
                    style={{
                      width: "100%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "6px 10px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: "#f0f7ff",
                      color: "#0062fe",
                      border: "1px solid #b3d7ff",
                      borderRadius: 4,
                      cursor: "pointer",
                      marginTop: 2,
                    }}
                    title="Ver perguntas, respostas e dicas de preparação para esta vaga"
                  >
                    <Sparkles size={13} />
                    Dicas de Entrevista & Vaga
                  </button>

                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <PDFDownloadLink
                      document={
                        <ResumePDFTemplate
                          data={app.tailored_resume || masterProfile}
                        />
                      }
                      fileName="cv-renato-de-franca-lima.pdf"
                      style={{ textDecoration: "none", flex: 1 }}
                    >
                      {({ loading }) => (
                        <button
                          type="button"
                          disabled={loading}
                          style={{
                            width: "100%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 4,
                            padding: "6px 8px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            backgroundColor: "#1e1e1e",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                          title="Baixar currículo sob medida para esta vaga"
                        >
                          <Download size={12} />
                          {loading ? "Gerando..." : "Baixar CV da Vaga"}
                        </button>
                      )}
                    </PDFDownloadLink>

                    {onSendEmail && (
                      <button
                        type="button"
                        onClick={() => onSendEmail(app)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          padding: "6px 8px",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          backgroundColor: "#0078d4",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                        title="Disparar e-mail via Outlook"
                      >
                        <Send size={12} />
                        Outlook
                      </button>
                    )}
                  </div>
                </Card>
              ))}

              {items.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#999", fontSize: "0.8rem" }}>
                  Nenhuma vaga
                </div>
              )}
            </Column>
          );
        })}
      </Board>

      {/* Modal de Detalhes da Vaga & Preparação para Entrevista */}
      {selectedAppModal && (
        <ModalOverlay onClick={() => setSelectedAppModal(null)}>
          <ModalDialog onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>
                <Sparkles size={20} color="#0f62fe" />
                Guia de Entrevista: {selectedAppModal.jobs?.title || "Vaga"}
              </h3>
              <button type="button" onClick={() => setSelectedAppModal(null)}>
                <X size={20} />
              </button>
            </ModalHeader>

            <ModalBody>
              {/* Informações Básicas da Oportunidade */}
              <div style={{ background: "#f9f9f9", padding: "14px", borderRadius: 8, border: "1px solid #e0e0e0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <strong style={{ fontSize: "0.95rem", color: "#1e1e1e" }}>
                    {selectedAppModal.jobs?.companies?.name || "Empresa Confidencial"}
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "#2e7d32", fontWeight: 700 }}>
                    Match Geral: {selectedAppModal.match_overall || 85}%
                  </span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "#555" }}>
                  <strong>Cargo:</strong> {selectedAppModal.jobs?.title || "Analista de Suporte"}
                </div>
                {selectedAppModal.notes && (
                  <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 6, fontStyle: "italic" }}>
                    {selectedAppModal.notes}
                  </div>
                )}
              </div>

              {/* Guia Salarial */}
              <SectionBox>
                <h4>
                  <DollarSign size={17} /> Pretensão Salarial Sugerida
                </h4>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "0.85rem", fontWeight: 600 }}>
                  <span style={{ color: "#2e7d32" }}>
                    CLT Fixo:{" "}
                    {selectedAppModal.analysis?.interviewPrep?.salaryExpectationGuide?.suggestedCLT ||
                      (selectedAppModal.jobs?.analysis?.interviewPrep?.salaryExpectationGuide?.suggestedCLT) ||
                      "R$ 5.000 a R$ 6.800"}
                  </span>
                  <span style={{ color: "#1565c0" }}>
                    PJ:{" "}
                    {selectedAppModal.analysis?.interviewPrep?.salaryExpectationGuide?.suggestedPJ ||
                      (selectedAppModal.jobs?.analysis?.interviewPrep?.salaryExpectationGuide?.suggestedPJ) ||
                      "R$ 7.500 a R$ 9.500"}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#555" }}>
                  <em>Justificativa técnica:</em>{" "}
                  {selectedAppModal.analysis?.interviewPrep?.salaryExpectationGuide?.justification ||
                    (selectedAppModal.jobs?.analysis?.interviewPrep?.salaryExpectationGuide?.justification) ||
                    "Alinhado à senioridade N2/N3, certificações AZ-900 e ITIL 4, pós-graduação em IA e governança de ambientes Microsoft 365."}
                </p>
              </SectionBox>

              {/* O que motivou a candidatura */}
              <SectionBox>
                <h4>
                  <Target size={17} /> O que motivou a se candidatar (Resposta Pronta)
                </h4>
                <p style={{ margin: 0, fontSize: "0.83rem", color: "#333", lineHeight: 1.45, fontStyle: "italic", background: "#ffffff", padding: 12, borderRadius: 6, border: "1px solid #d0e2ff" }}>
                  "{selectedAppModal.analysis?.interviewPrep?.motivationResponse ||
                    (selectedAppModal.jobs?.analysis?.interviewPrep?.motivationResponse) ||
                    `Minha motivação decorre da forte sinergia entre os desafios técnicos da oportunidade e minha vivência prática em sustentação de ambientes de missão crítica, administração de Microsoft 365 e Active Directory, com foco em estabilidade e SLAs rigorosos.`}"
                </p>
              </SectionBox>

              {/* Perguntas Comuns e Respostas Sugeridas */}
              <SectionBox>
                <h4>
                  <HelpCircle size={17} /> Perguntas Básicas de Recrutadores & Como Responder
                </h4>
                {(
                  selectedAppModal.analysis?.interviewPrep?.commonQuestions ||
                  selectedAppModal.jobs?.analysis?.interviewPrep?.commonQuestions || [
                    {
                      question: "Informe a sua pretensão salarial (Fixo/CLT) ou o que motivou a se candidatar para essa vaga.",
                      suggestedAnswer:
                        "Minha pretensão salarial para regime CLT situa-se entre R$ 5.000 e R$ 6.800, aberta a negociação conforme o pacote de benefícios. O que me motivou foi a oportunidade de aplicar minha bagagem em suporte avançado e nuvem Azure nos desafios operacionais da empresa.",
                      keyPointsToHighlight: ["Suporte N2/N3", "Certificações AZ-900 e ITIL 4", "SLAs e Automação"],
                    },
                    {
                      question: "Como você lida com incidentes críticos de indisponibilidade de serviços sob pressão de tempo?",
                      suggestedAnswer:
                        "Priorizo a contenção imediata e a comunicação executiva transparente com os líderes seguindo as diretrizes do ITIL 4. Mantenho a estabilidade emocional, investigo logs e acessos, e após restabelecer o serviço conduzo a análise de causa-raiz para blindar a infraestrutura.",
                      keyPointsToHighlight: ["ITIL 4 Incident Management", "Comunicação clara", "Causa-raiz"],
                    },
                  ]
                ).map((qa: any, idx: number) => (
                  <QuestionCard key={idx}>
                    <div className="q-title">P: {qa.question}</div>
                    <div className="q-ans">
                      <strong>Sugestão:</strong> {qa.suggestedAnswer}
                    </div>
                    {qa.keyPointsToHighlight && qa.keyPointsToHighlight.length > 0 && (
                      <div className="tags">
                        {qa.keyPointsToHighlight.map((kp: string, kidx: number) => (
                          <span key={kidx}>✓ {kp}</span>
                        ))}
                      </div>
                    )}
                  </QuestionCard>
                ))}
              </SectionBox>

              {/* O que deve estar afiado (Dicas Práticas) */}
              <SectionBox>
                <h4>
                  <BookOpen size={17} /> O que deve estar AFIAÇÃO máxima para a entrevista:
                </h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.82rem", color: "#333", lineHeight: 1.5 }}>
                  {(
                    selectedAppModal.analysis?.interviewPrep?.preparationTips ||
                    selectedAppModal.jobs?.analysis?.interviewPrep?.preparationTips || [
                      "Conceitos de Group Policy Objects (GPOs), OUs e governança de identidades no Active Directory / Microsoft Entra ID.",
                      "Exemplos práticos de chamados críticos P1/P2 resolvidos sob pressão com cumprimento estrito de SLA.",
                      "Casos de migração de contas, licenciamento e administração de caixas compartilhadas no Microsoft 365.",
                      "Destacar a certificação Microsoft Azure (AZ-900), ITIL 4 Foundation e a Pós-Graduação em Inteligência Artificial como diferencial.",
                    ]
                  ).map((tip: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: 4 }}>
                      <CheckCircle2 size={13} color="#2e7d32" style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </SectionBox>
            </ModalBody>
          </ModalDialog>
        </ModalOverlay>
      )}
    </>
  );
};
