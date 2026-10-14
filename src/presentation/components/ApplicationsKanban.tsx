import React, { useState } from "react";
import styled from "styled-components";
import {
  Building2,
  Download,
  Send,
  Sparkles,
  ExternalLink,
  Globe,
  Search,
  Trash2,
  FileText,
  X,
  Save,
} from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import type { ApplicationStatus } from "../../shared/types/database.types";
import type { ApplicationItem } from "../../infrastructure/supabase/JobApplicationsRepository";
import type { ResumeData } from "../../domain/entities/Resume";
import { ResumePDFTemplate } from "../templates/ResumePDFTemplate";
import { InterviewPrepModal } from "./InterviewPrepModal";
import { useToast } from "../../context/ToastContext";
import { openSideBrowser } from "../../shared/utils/popupLauncher";

interface ApplicationsKanbanProps {
  applications: ApplicationItem[];
  masterProfile: ResumeData;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onSendEmail?: (app: ApplicationItem) => void;
  onDeleteApplication?: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
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

const Column = styled.div<{ $isDragOver?: boolean }>`
  flex: 0 0 280px;
  background-color: ${(props) => (props.$isDragOver ? "#eff6ff" : "#f4f4f4")};
  border: ${(props) => (props.$isDragOver ? "2px dashed #2563eb" : "2px solid transparent")};
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
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

const Card = styled.div<{ $isDragging?: boolean }>`
  background-color: #ffffff;
  border-radius: 6px;
  padding: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #e8e8e8;
  cursor: grab;
  opacity: ${(props) => (props.$isDragging ? 0.35 : 1)};
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;

  &:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  &:active {
    cursor: grabbing;
  }

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
  font-size: 0.73rem;
  padding: 3px 6px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #334155;
  outline: none;
  cursor: pointer;
`;

const FilterBarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;

  .search-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px 14px;
    flex: 1;
    max-width: 420px;

    input {
      border: none;
      outline: none;
      font-size: 0.85rem;
      width: 100%;
      background: transparent;
      color: #0f172a;
    }
  }

  .stats-pill {
    background-color: #f1f5f9;
    color: #475569;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
  }
`;

const NotesModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 16px;
`;

const NotesModalBox = styled.div`
  background: #ffffff;
  border-radius: 12px;
  max-width: 520px;
  width: 100%;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.2);
  border: 1px solid #e2e8f0;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    button.close {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
    }
  }

  textarea {
    min-height: 120px;
    padding: 10px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.85rem;
    outline: none;
    font-family: inherit;
    resize: vertical;

    &:focus {
      border-color: #0284c7;
    }
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
`;

export const ApplicationsKanban: React.FC<ApplicationsKanbanProps> = ({
  applications,
  masterProfile,
  onStatusChange,
  onSendEmail,
  onDeleteApplication,
  onUpdateNotes,
}) => {
  const { showSuccess } = useToast();
  const [selectedAppModal, setSelectedAppModal] = useState<ApplicationItem | null>(null);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);

  // Busca e Filtros
  const [searchQuery, setSearchQuery] = useState("");

  // Modal de Anotações
  const [editingNotesApp, setEditingNotesApp] = useState<ApplicationItem | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const handleOpenNotes = (app: ApplicationItem) => {
    setEditingNotesApp(app);
    setNotesValue(app.notes || "");
  };

  const handleSaveNotes = () => {
    if (!editingNotesApp || !onUpdateNotes) return;
    onUpdateNotes(editingNotesApp.id, notesValue);
    setEditingNotesApp(null);
  };

  const handleDropCard = (appId: string, newStatus: ApplicationStatus) => {
    const app = applications.find((a) => a.id === appId);
    if (!app || app.status === newStatus) return;

    onStatusChange(appId, newStatus);
    const targetCol = COLUMNS.find((c) => c.status === newStatus);
    showSuccess(
      `Candidatura movida para "${targetCol?.label || newStatus}"!`,
      "Status Atualizado"
    );
  };

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = (app.jobs?.title || "").toLowerCase();
    const company = (app.jobs?.companies?.name || "").toLowerCase();
    const notes = (app.notes || "").toLowerCase();
    return title.includes(q) || company.includes(q) || notes.includes(q);
  });

  return (
    <>
      {/* Barra de Filtro e Busca Rápida */}
      <FilterBarContainer>
        <div className="search-wrapper">
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Filtrar por cargo, empresa ou anotações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="stats-pill">
          {filteredApplications.length} de {applications.length} candidaturas exibidas
        </div>
      </FilterBarContainer>

      <Board>
        {COLUMNS.map((col) => {
          const items = filteredApplications.filter((app) => app.status === col.status);
          return (
            <Column
              key={col.status}
              $isDragOver={dragOverColumn === col.status}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverColumn(col.status);
              }}
              onDragLeave={() => {
                setDragOverColumn((prev) => (prev === col.status ? null : prev));
              }}
              onDrop={(e) => {
                e.preventDefault();
                const appId = e.dataTransfer.getData("text/plain");
                if (appId) {
                  handleDropCard(appId, col.status);
                }
                setDragOverColumn(null);
                setDraggedAppId(null);
              }}
            >
              <ColumnHeader $color={col.color}>
                <h3>{col.label}</h3>
                <span>{items.length}</span>
              </ColumnHeader>

              {items.map((app) => (
                <Card
                  key={app.id}
                  draggable={true}
                  $isDragging={draggedAppId === app.id}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", app.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggedAppId(app.id);
                  }}
                  onDragEnd={() => {
                    setDraggedAppId(null);
                    setDragOverColumn(null);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                    <h4>{app.jobs?.title || "Vaga Cadastrada"}</h4>
                    {onDeleteApplication && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Deseja realmente excluir a candidatura para "${app.jobs?.title || "Vaga"}"?`
                            )
                          ) {
                            onDeleteApplication(app.id);
                          }
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: 2,
                          borderRadius: 4,
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Excluir candidatura do CRM"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <div className="company">
                    <Building2 size={14} />
                    <span>{app.jobs?.companies?.name || "Empresa Confidencial"}</span>
                  </div>

                  <div className="meta">
                    <span>Match: {app.match_overall || 85}%</span>
                    <StatusSelect
                      value={app.status}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.status} value={c.status}>
                          {c.label}
                        </option>
                      ))}
                    </StatusSelect>
                  </div>

                  {/* Botões de Dicas e Anotações */}
                  <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                    <button
                      type="button"
                      onClick={() => setSelectedAppModal(app)}
                      style={{
                        flex: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        padding: "6px 8px",
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        backgroundColor: "#f0f7ff",
                        color: "#0062fe",
                        border: "1px solid #b3d7ff",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                      title="Ver perguntas, respostas e dicas de preparação para esta vaga"
                    >
                      <Sparkles size={13} />
                      Dicas & Vaga
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenNotes(app)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        padding: "6px 8px",
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        backgroundColor: app.notes ? "#fef3c7" : "#f8fafc",
                        color: app.notes ? "#92400e" : "#475569",
                        border: `1px solid ${app.notes ? "#fde68a" : "#cbd5e1"}`,
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                      title="Anotar contatos, data de entrevista ou feedback da vaga"
                    >
                      <FileText size={13} />
                      {app.notes ? "Notas ✓" : "Notas"}
                    </button>
                  </div>

                  {/* Botão de Navegador Lateral / Portal da Vaga */}
                  {(() => {
                    const jobUrl =
                      (app.jobs as any)?.source_url ||
                      app.jobs?.raw_description?.match(/https?:\/\/[^\s]+/)?.[0] ||
                      null;

                    const handleOpenPortal = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      const title = `${app.jobs?.title || "Vaga"} (${app.jobs?.companies?.name || "Empresa"})`;
                      if (jobUrl) {
                        openSideBrowser(jobUrl, title);
                        showSuccess(`Abrindo vaga no navegador lateral!`, "Portal de Vagas");
                      } else {
                        const query = encodeURIComponent(`${app.jobs?.title || "Vaga"} ${app.jobs?.companies?.name || ""}`);
                        openSideBrowser(`https://www.google.com/search?q=${query}`, title);
                        showSuccess("Localizando vaga no navegador lateral...", "Portal de Vagas");
                      }
                    };

                    return (
                      <button
                        type="button"
                        onClick={handleOpenPortal}
                        style={{
                          width: "100%",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "5px 10px",
                          fontSize: "0.74rem",
                          fontWeight: 600,
                          backgroundColor: "#f8fafc",
                          color: "#1e293b",
                          border: "1px solid #cbd5e1",
                          borderRadius: 4,
                          cursor: "pointer",
                          marginTop: 2,
                        }}
                        title="Abrir página da vaga ou portal em mini-browser lateral"
                      >
                        <Globe size={13} color="#0284c7" />
                        <span>{jobUrl ? "Acompanhar no Portal" : "Localizar no Portal"}</span>
                        <ExternalLink size={11} color="#64748b" />
                      </button>
                    );
                  })()}

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

      {/* Modal de Detalhes da Vaga & Preparação para Entrevista (8 Seções / 5 Tabs) */}
      {selectedAppModal && (
        <InterviewPrepModal
          application={selectedAppModal}
          onClose={() => setSelectedAppModal(null)}
        />
      )}

      {/* Modal de Anotações do CRM */}
      {editingNotesApp && (
        <NotesModalOverlay onClick={() => setEditingNotesApp(null)}>
          <NotesModalBox onClick={(e) => e.stopPropagation()}>
            <div className="header">
              <h3>
                <FileText size={18} color="#0284c7" />
                Anotações: {editingNotesApp.jobs?.title || "Vaga"}
              </h3>
              <button
                type="button"
                className="close"
                onClick={() => setEditingNotesApp(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
              Registre contatos de recrutadores, data/horário de entrevistas, link da chamada Teams/Meet ou pretensão combinada.
            </div>

            <textarea
              placeholder="Ex: Entrevista técnica agendada para 16/10 às 14h com gestor de infraestrutura (Lucas). Link: meet.google.com/xyz..."
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
            />

            <div className="footer">
              <button
                type="button"
                onClick={() => setEditingNotesApp(null)}
                style={{
                  padding: "8px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                <Save size={14} /> Salvar Anotações
              </button>
            </div>
          </NotesModalBox>
        </NotesModalOverlay>
      )}
    </>
  );
};
