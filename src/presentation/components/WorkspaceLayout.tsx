import React, { useState } from "react";
import styled from "styled-components";
import {
  FileText,
  Sparkles,
  Kanban,
  LayoutDashboard,
  Mail,
  Edit3,
  Download,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Database,
  Layers,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  Printer,
  Copy,
  FileDown,
  GitCompare,
  Globe,
} from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import type { ResumeData } from "../../domain/entities/Resume";
import { ResumePDFTemplate } from "../templates/ResumePDFTemplate";
import { AtsTextFormatter } from "../../domain/services/AtsTextFormatter";
import { useToast } from "../../context/ToastContext";
import { ResumeDiffModal } from "./ResumeDiffModal";

export interface WorkspaceLayoutProps {
  currentTab: "preview" | "analyze" | "kanban" | "metrics" | "email" | "edit" | "portals";
  onTabChange: (tab: "preview" | "analyze" | "kanban" | "metrics" | "email" | "edit" | "portals") => void;
  userEmail?: string;
  onSignOut: () => void;
  masterResume: ResumeData;
  activeResume: ResumeData;
  activeResumeTitle: string;
  onRestoreBase?: () => void;
  applicationsCount: number;
  visibleSections: {
    summary: boolean;
    experiences: boolean;
    education: boolean;
    certifications: boolean;
    skills: boolean;
    projects: boolean;
    languages: boolean;
  };
  onToggleSection: (sectionKey: string) => void;
  children: React.ReactNode;
}

/* 1. Header Global Glassmorphism */
const TopNav = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
  background-color: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media print {
    display: none !important;
  }
`;

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.05rem;
    font-weight: 800;
    color: #111111;
    text-decoration: none;
    letter-spacing: -0.3px;
  }

  .version-badge {
    background: #f1f5f9;
    color: #475569;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }
`;

const NavCenter = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 900px) {
    display: none;
  }
`;

const StatusPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.74rem;
  font-weight: 600;
`;

const SyncIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 500;
`;

const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #111111;
  color: #ffffff;
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: #2c2c2c;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const UserDropdown = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s;

  &:hover {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: #0f172a;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.74rem;
    font-weight: 700;
  }

  .user-email {
    font-size: 0.78rem;
    color: #334155;
    font-weight: 500;
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media (max-width: 600px) {
      display: none;
    }
  }
`;

/* 2. Sub-Header com Abas Estilo Workspace */
const SubHeader = styled.nav`
  position: sticky;
  top: 56px;
  z-index: 90;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 3px;
  }

  @media print {
    display: none !important;
  }
`;

const TabItem = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${(props) => (props.$active ? "#0f172a" : "#64748b")};
  background: none;
  border: none;
  border-bottom: 2px solid ${(props) => (props.$active ? "#0f172a" : "transparent")};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    color: #0f172a;
    background-color: #f8fafc;
  }

  .count-badge {
    background-color: ${(props) => (props.$active ? "#0f172a" : "#e2e8f0")};
    color: ${(props) => (props.$active ? "#ffffff" : "#475569")};
    font-size: 0.68rem;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 10px;
  }
`;

/* 3. Área de Trabalho Dividida em 2 Colunas */
const WorkspaceContainer = styled.div`
  display: flex;
  min-height: calc(100vh - 96px);
  width: 100%;

  @media print {
    display: block !important;
    min-height: auto !important;
  }
`;

/* Painel Lateral / Inspector */
const SidebarInspector = styled.aside`
  width: 320px;
  flex-shrink: 0;
  background-color: #ffffff;
  border-right: 1px solid #e2e8f0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 96px);
  position: sticky;
  top: 96px;

  @media (max-width: 960px) {
    display: none;
  }

  @media print {
    display: none !important;
  }
`;

const InspectorCard = styled.div`
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  h3 {
    font-size: 0.82rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const MetricRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  color: #475569;
  padding: 4px 0;
  border-bottom: 1px dashed #e2e8f0;

  &:last-child {
    border-bottom: none;
  }

  strong {
    color: #0f172a;
  }
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.76rem;
  color: #334155;
  padding: 4px 0;

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 4px;
    border-radius: 4px;

    &:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
  }
`;

const MainContentArea = styled.main`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;

  @media print {
    padding: 0 !important;
    margin: 0 !important;
  }
`;

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  currentTab,
  onTabChange,
  userEmail,
  onSignOut,
  masterResume,
  activeResume,
  activeResumeTitle,
  onRestoreBase,
  applicationsCount,
  visibleSections,
  onToggleSection,
  children,
}) => {
  const { showSuccess, showError } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [diffModalOpen, setDiffModalOpen] = useState(false);

  const handleCopyAtsText = async () => {
    const success = await AtsTextFormatter.copyAtsTextToClipboard(activeResume);
    if (success) {
      showSuccess(
        "Currículo em texto limpo copiado para a área de transferência! Perfeito para colar no Gupy/LinkedIn.",
        "Texto ATS Copiado"
      );
    } else {
      showError("Não foi possível copiar o texto automaticamente.", "Erro ao Copiar");
    }
    setExportMenuOpen(false);
  };

  const handleDownloadAtsTxt = () => {
    AtsTextFormatter.downloadAtsTextFile(activeResume);
    showSuccess("Download do arquivo .txt limpo para robôs ATS iniciado!", "Download Iniciado");
    setExportMenuOpen(false);
  };

  return (
    <div>
      {/* 1. Header Global Glassmorphism */}
      <TopNav>
        <NavLeft>
          <div className="brand-logo">
            <FileText size={20} color="#0f172a" />
            <span>CV Certo</span>
          </div>
          <span className="version-badge">v2.0 Workspace</span>
        </NavLeft>

        <NavCenter>
          <StatusPill>
            <CheckCircle2 size={13} />
            <span>100% Compatível com ATS</span>
          </StatusPill>
          <SyncIndicator>
            <Database size={12} />
            <span>Sincronizado</span>
          </SyncIndicator>
        </NavCenter>

        <NavRight>
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", gap: 2 }}>
              <PDFDownloadLink
                document={<ResumePDFTemplate data={activeResume} />}
                fileName="cv-renato-de-franca-lima.pdf"
                style={{ textDecoration: "none" }}
              >
                {({ loading }) => (
                  <PrimaryButton
                    disabled={loading}
                    style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                  >
                    <Download size={14} />
                    <span>{loading ? "Gerando..." : "Baixar PDF Oficial"}</span>
                  </PrimaryButton>
                )}
              </PDFDownloadLink>
              <PrimaryButton
                type="button"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  padding: "7px 8px",
                  borderLeft: "1px solid rgba(255,255,255,0.2)",
                }}
                title="Mais opções de exportação para ATS"
              >
                <ChevronDown size={14} />
              </PrimaryButton>
            </div>

            {exportMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: 40,
                  right: 0,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                  padding: "6px 0",
                  zIndex: 250,
                  minWidth: 230,
                }}
              >
                <button
                  type="button"
                  onClick={handleCopyAtsText}
                  style={{
                    width: "100%",
                    padding: "9px 14px",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    color: "#0f172a",
                    textAlign: "left",
                  }}
                >
                  <Copy size={14} color="#2563eb" /> Copiar Texto Limpo para ATS
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAtsTxt}
                  style={{
                    width: "100%",
                    padding: "9px 14px",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    color: "#0f172a",
                    textAlign: "left",
                  }}
                >
                  <FileDown size={14} color="#16a34a" /> Baixar Arquivo .TXT para ATS
                </button>
                <div style={{ height: 1, backgroundColor: "#f1f5f9", margin: "4px 0" }} />
                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    window.print();
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 14px",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    color: "#475569",
                    textAlign: "left",
                  }}
                >
                  <Printer size={14} /> Imprimir A4 Direto
                </button>
              </div>
            )}
          </div>

          <UserDropdown onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="avatar">
              {userEmail ? userEmail.charAt(0).toUpperCase() : <User size={14} />}
            </div>
            <span className="user-email">{userEmail || "Candidato"}</span>
            <ChevronDown size={14} color="#64748b" />
          </UserDropdown>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: 50,
                right: 20,
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                padding: "6px 0",
                zIndex: 200,
                minWidth: 160,
              }}
            >
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  fontSize: "0.8rem",
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  color: "#334155",
                }}
              >
                <Printer size={14} /> Imprimir / PDF
              </button>
              <div style={{ height: 1, backgroundColor: "#f1f5f9", margin: "4px 0" }} />
              <button
                type="button"
                onClick={onSignOut}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  fontSize: "0.8rem",
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  color: "#dc2626",
                }}
              >
                <LogOut size={14} /> Sair da Conta
              </button>
            </div>
          )}
        </NavRight>
      </TopNav>

      {/* 2. Sub-Header de Navegação Fluida */}
      <SubHeader>
        <TabItem
          $active={currentTab === "preview"}
          onClick={() => onTabChange("preview")}
        >
          <FileText size={15} />
          <span>Visualizar Currículo</span>
        </TabItem>
        <TabItem
          $active={currentTab === "analyze"}
          onClick={() => onTabChange("analyze")}
        >
          <Sparkles size={15} />
          <span>Analisar Vaga com IA</span>
        </TabItem>
        <TabItem
          $active={currentTab === "kanban"}
          onClick={() => onTabChange("kanban")}
        >
          <Kanban size={15} />
          <span>CRM Candidaturas</span>
          <span className="count-badge">{applicationsCount}</span>
        </TabItem>
        <TabItem
          $active={currentTab === "portals"}
          onClick={() => onTabChange("portals")}
        >
          <Globe size={15} />
          <span>Portais de Vagas</span>
        </TabItem>
        <TabItem
          $active={currentTab === "metrics"}
          onClick={() => onTabChange("metrics")}
        >
          <LayoutDashboard size={15} />
          <span>Dashboard</span>
        </TabItem>
        <TabItem
          $active={currentTab === "email"}
          onClick={() => onTabChange("email")}
        >
          <Mail size={15} />
          <span>Disparo Outlook</span>
        </TabItem>
        <TabItem
          $active={currentTab === "edit"}
          onClick={() => onTabChange("edit")}
        >
          <Edit3 size={15} />
          <span>Editar Perfil Mestre</span>
        </TabItem>
      </SubHeader>

      {/* 3. Área de Trabalho */}
      <WorkspaceContainer>
        {currentTab === "preview" && (
          <SidebarInspector>
            <InspectorCard>
              <h3>
                <ShieldCheck size={15} color="#0f172a" />
                Versão em Exibição
              </h3>
              <div style={{ fontSize: "0.78rem", color: "#334155", lineHeight: 1.4 }}>
                {activeResumeTitle}
              </div>
              {activeResume !== masterResume && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setDiffModalOpen(true)}
                    style={{
                      padding: "6px 10px",
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      backgroundColor: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: 4,
                      cursor: "pointer",
                      color: "#1d4ed8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                    title="Comparar o currículo original com as priorizações feitas pela IA"
                  >
                    <GitCompare size={13} /> Comparar com Base (Diff)
                  </button>
                  {onRestoreBase && (
                    <button
                      type="button"
                      onClick={onRestoreBase}
                      style={{
                        padding: "6px 10px",
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        backgroundColor: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: 4,
                        cursor: "pointer",
                        color: "#0f172a",
                      }}
                    >
                      Restaurar Currículo Base
                    </button>
                  )}
                </div>
              )}
            </InspectorCard>

            <InspectorCard>
              <h3>
                <Database size={15} color="#0f172a" />
                Base de Fatos Reais
              </h3>
              <MetricRow>
                <span>Experiências</span>
                <strong>{masterResume.experiences.length} cadastradas</strong>
              </MetricRow>
              <MetricRow>
                <span>Formações</span>
                <strong>{masterResume.education.length} cadastradas</strong>
              </MetricRow>
              <MetricRow>
                <span>Certificações</span>
                <strong>{masterResume.certifications.length} validadas</strong>
              </MetricRow>
              <MetricRow>
                <span>Habilidades</span>
                <strong>{masterResume.skills.length} categorias</strong>
              </MetricRow>
              <MetricRow>
                <span>Projetos</span>
                <strong>{masterResume.projects?.length || 0} projetos</strong>
              </MetricRow>
            </InspectorCard>

            <InspectorCard>
              <h3>
                <Layers size={15} color="#0f172a" />
                Visibilidade de Seções
              </h3>
              <ToggleRow>
                <span>Resumo Profissional</span>
                <button type="button" onClick={() => onToggleSection("summary")}>
                  {visibleSections.summary ? <Eye size={13} color="#166534" /> : <EyeOff size={13} color="#94a3b8" />}
                </button>
              </ToggleRow>
              <ToggleRow>
                <span>Experiências</span>
                <button type="button" onClick={() => onToggleSection("experiences")}>
                  {visibleSections.experiences ? <Eye size={13} color="#166534" /> : <EyeOff size={13} color="#94a3b8" />}
                </button>
              </ToggleRow>
              <ToggleRow>
                <span>Formação Acadêmica</span>
                <button type="button" onClick={() => onToggleSection("education")}>
                  {visibleSections.education ? <Eye size={13} color="#166534" /> : <EyeOff size={13} color="#94a3b8" />}
                </button>
              </ToggleRow>
              <ToggleRow>
                <span>Certificações</span>
                <button type="button" onClick={() => onToggleSection("certifications")}>
                  {visibleSections.certifications ? <Eye size={13} color="#166534" /> : <EyeOff size={13} color="#94a3b8" />}
                </button>
              </ToggleRow>
              <ToggleRow>
                <span>Conhecimentos</span>
                <button type="button" onClick={() => onToggleSection("skills")}>
                  {visibleSections.skills ? <Eye size={13} color="#166534" /> : <EyeOff size={13} color="#94a3b8" />}
                </button>
              </ToggleRow>
              <ToggleRow>
                <span>Projetos & Portfólio</span>
                <button type="button" onClick={() => onToggleSection("projects")}>
                  {visibleSections.projects ? <Eye size={13} color="#166534" /> : <EyeOff size={13} color="#94a3b8" />}
                </button>
              </ToggleRow>
            </InspectorCard>
          </SidebarInspector>
        )}

        <MainContentArea>{children}</MainContentArea>
      </WorkspaceContainer>

      {diffModalOpen && (
        <ResumeDiffModal
          baseResume={masterResume}
          tailoredResume={activeResume}
          jobTitle={activeResumeTitle}
          onClose={() => setDiffModalOpen(false)}
        />
      )}
    </div>
  );
};
