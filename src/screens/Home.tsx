import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, FileText, CheckCircle2, LogOut, User as UserIcon, Edit3, Eye, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { MasterProfileRepository } from "../infrastructure/supabase/MasterProfileRepository";
import { MASTER_PROFILE } from "../shared/constants/masterProfile";
import type { ResumeData } from "../domain/entities/Resume";
import { ResumeWebPreview } from "../presentation/components/ResumeWebPreview";
import { ResumePDFTemplate } from "../presentation/templates/ResumePDFTemplate";
import { ProfileEditor } from "../presentation/components/ProfileEditor";
import { JobAnalyzer } from "../presentation/components/JobAnalyzer";
import { ApplicationsKanban } from "../presentation/components/ApplicationsKanban";
import { DashboardMetrics } from "../presentation/components/DashboardMetrics";
import { EmailSenderModal } from "../presentation/components/EmailSenderModal";
import { ResumeVersionsRepository } from "../infrastructure/supabase/ResumeVersionsRepository";
import { JobApplicationsRepository, type ApplicationItem } from "../infrastructure/supabase/JobApplicationsRepository";
import type { TailoredResumeResult } from "../domain/rules/ResumeTailoringEngine";
import type { ApplicationStatus } from "../shared/types/database.types";
import { LayoutDashboard, Kanban, Mail } from "lucide-react";

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
  gap: 16px;

  h1 {
    font-size: 1.4rem;
    color: #1e1e1e;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const ActionsGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: 1px solid ${(props) => (props.$primary ? "#1E1E1E" : "#d0d0d0")};
  background-color: ${(props) => (props.$primary ? "#1E1E1E" : "#ffffff")};
  color: ${(props) => (props.$primary ? "#ffffff" : "#1E1E1E")};
  transition: all 0.2s ease;
  text-decoration: none;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const TabsBar = styled.div`
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 4px;

  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: none;
    border: none;
    font-weight: 600;
    font-size: 0.9rem;
    color: #666666;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;

    &.active {
      color: #1e1e1e;
      background-color: #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
  }
`;

const MainContent = styled.div`
  display: flex;
  gap: 24px;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.div`
  flex: 1;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: fit-content;

  h2 {
    font-size: 1.1rem;
    color: #1e1e1e;
    margin: 0 0 12px 0;
  }

  p {
    font-size: 0.85rem;
    color: #555555;
    line-height: 1.5;
  }

  ul {
    padding-left: 20px;
    margin: 12px 0;
    font-size: 0.85rem;
    color: #444444;

    li {
      margin-bottom: 6px;
    }
  }
`;

const PreviewArea = styled.div`
  flex: 2.2;
`;

export const Home: React.FC = () => {
  const { user, signOut } = useAuth();
  const [masterResume, setMasterResume] = useState<ResumeData>(MASTER_PROFILE);
  const [previewResume, setPreviewResume] = useState<ResumeData>(MASTER_PROFILE);
  const [activeResumeTitle, setActiveResumeTitle] = useState<string>("Currículo Base Oficial (N2/N3)");
  const [currentTab, setCurrentTab] = useState<"preview" | "edit" | "analyze" | "kanban" | "metrics" | "email">("preview");
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [selectedAppForEmail, setSelectedAppForEmail] = useState<ApplicationItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Carrega ou inicializa o perfil mestre sincronizado no Supabase
  useEffect(() => {
    if (user?.id) {
      MasterProfileRepository.getOrCreateProfile(user.id).then((profile) => {
        setMasterResume(profile);
        setPreviewResume(profile);
      });
      JobApplicationsRepository.listApplications(user.id).then((apps) => {
        setApplications(apps);
      });
    }
  }, [user?.id]);

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await JobApplicationsRepository.updateStatus(appId, newStatus);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
    } catch {
      alert("Erro ao atualizar status da candidatura.");
    }
  };

  const handleSaveProfile = async (updated: ResumeData) => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await MasterProfileRepository.saveProfile(user.id, updated);
      setMasterResume(updated);
      setPreviewResume(updated);
      alert("Perfil Mestre salvo e sincronizado com sucesso no Supabase!");
      setCurrentTab("preview");
    } catch (err: any) {
      console.warn("[Home] Falha ao persistir no Supabase:", err);
      setMasterResume(updated);
      setPreviewResume(updated);
      alert(
        "Aviso: Suas alterações foram atualizadas na visualização local."
      );
      setCurrentTab("preview");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateTailored = async (
    tailoredResult: TailoredResumeResult,
    jobDetails?: { jobTitle: string; companyName: string; jobDescription: string; analysis: any }
  ) => {
    if (!tailoredResult.validationReport.isValid) {
      alert("Alerta de Invenção: O validador determinístico bloqueou a geração por inconsistência com o Perfil Mestre.");
      return;
    }

    // NÃO altera o masterResume! Apenas coloca na pré-visualização ativa e salva como versão independente
    setPreviewResume(tailoredResult.tailoredResume);
    setActiveResumeTitle(
      `Versão Customizada: ${jobDetails?.jobTitle || "Vaga"} (${jobDetails?.companyName || "Empresa"})`
    );

    const newAppItem: ApplicationItem = {
      id: `app_${Date.now()}`,
      user_id: user?.id || "local",
      job_id: `job_${Date.now()}`,
      status: "curriculo_gerado",
      match_overall: jobDetails?.analysis?.matchScores?.overall || 90,
      match_technical: jobDetails?.analysis?.matchScores?.technical || 92,
      match_behavioral: jobDetails?.analysis?.matchScores?.behavioral || 88,
      work_model: "hibrido",
      salary_offered: null,
      notes: tailoredResult.atsOptimizationSummary,
      created_at: new Date().toISOString(),
      tailored_resume: tailoredResult.tailoredResume,
      cover_letter: jobDetails?.analysis?.suggestedCoverLetter || null,
      jobs: {
        title: jobDetails?.jobTitle || "Analista de Suporte N2/N3",
        raw_description: jobDetails?.jobDescription || "",
        companies: {
          name: jobDetails?.companyName || "Empresa Cadastrada",
        },
      },
    };

    setApplications((prev) => [newAppItem, ...prev]);

    if (user?.id) {
      try {
        await ResumeVersionsRepository.saveVersion({
          userId: user.id,
          content: tailoredResult.tailoredResume,
          atsScore: jobDetails?.analysis?.matchScores?.overall || 92,
          validationReport: tailoredResult.validationReport,
        });

        const created: any = await JobApplicationsRepository.createApplication({
          userId: user.id,
          jobTitle: jobDetails?.jobTitle || "Analista de Suporte N2/N3",
          companyName: jobDetails?.companyName || "Empresa Cadastrada",
          jobDescription: jobDetails?.jobDescription || tailoredResult.atsOptimizationSummary,
          analysis: jobDetails?.analysis,
        });

        if (created && created.id) {
          setApplications((prev) =>
            prev.map((a) =>
              a.id === newAppItem.id
                ? { ...a, id: created.id, tailored_resume: tailoredResult.tailoredResume }
                : a
            )
          );
        }
      } catch (err) {
        console.warn("Persistência no Supabase pendente:", err);
      }
    }

    alert(
      `Currículo gerado com sucesso para a vaga "${jobDetails?.jobTitle || "Vaga"}"!\n\nSeu currículo base permaneceu 100% intacto. A versão específica foi cadastrada no CRM de Candidaturas e pode ser baixada diretamente por lá!`
    );
    setCurrentTab("kanban");
  };

  const handleOpenEmailWithApp = (app: ApplicationItem) => {
    setSelectedAppForEmail(app);
    setCurrentTab("email");
  };

  return (
    <Container>
      <TopBar>
        <div>
          <h1>
            <FileText size={24} /> CV Certo - Perfil Mestre & IA
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#666" }}>
            Base de fatos reais protegida e motor de inteligência artificial ATS.
          </p>
        </div>

        <ActionsGroup>
          {user?.email && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.82rem",
                color: "#555",
                fontWeight: 500,
              }}
            >
              <UserIcon size={16} />
              <span>{user.email}</span>
            </div>
          )}

          <Badge>
            <CheckCircle2 size={16} /> 100% Compatível com ATS
          </Badge>

          <PDFDownloadLink
            document={<ResumePDFTemplate data={previewResume} />}
            fileName="cv-renato-de-franca-lima.pdf"
            style={{ textDecoration: "none" }}
          >
            {({ loading }) => (
              <Button $primary disabled={loading}>
                <Download size={16} />
                {loading ? "Preparando PDF..." : previewResume === masterResume ? "Baixar PDF Oficial" : "Baixar CV Visualizado"}
              </Button>
            )}
          </PDFDownloadLink>

          <Button onClick={signOut} title="Encerrar Sessão">
            <LogOut size={16} />
            Sair
          </Button>
        </ActionsGroup>
      </TopBar>

      <TabsBar>
        <button
          className={currentTab === "preview" ? "active" : ""}
          onClick={() => setCurrentTab("preview")}
        >
          <Eye size={16} /> Visualizar Currículo
        </button>
        <button
          className={currentTab === "analyze" ? "active" : ""}
          onClick={() => setCurrentTab("analyze")}
        >
          <Sparkles size={16} /> Analisar Vaga com IA
        </button>
        <button
          className={currentTab === "kanban" ? "active" : ""}
          onClick={() => setCurrentTab("kanban")}
        >
          <Kanban size={16} /> CRM Candidaturas ({applications.length})
        </button>
        <button
          className={currentTab === "metrics" ? "active" : ""}
          onClick={() => setCurrentTab("metrics")}
        >
          <LayoutDashboard size={16} /> Dashboard
        </button>
        <button
          className={currentTab === "email" ? "active" : ""}
          onClick={() => setCurrentTab("email")}
        >
          <Mail size={16} /> Disparo Outlook
        </button>
        <button
          className={currentTab === "edit" ? "active" : ""}
          onClick={() => setCurrentTab("edit")}
        >
          <Edit3 size={16} /> Editar Perfil Mestre (Fatos Reais)
        </button>
      </TabsBar>

      {currentTab === "kanban" ? (
        <ApplicationsKanban
          applications={applications}
          masterProfile={masterResume}
          onStatusChange={handleStatusChange}
          onSendEmail={handleOpenEmailWithApp}
        />
      ) : currentTab === "metrics" ? (
        <DashboardMetrics applications={applications} />
      ) : currentTab === "email" ? (
        <EmailSenderModal
          userId={user?.id || ""}
          candidateName={masterResume.personalInfo.fullName.replace(/\s+/g, " ").trim()}
          masterProfile={masterResume}
          availableApplications={applications}
          selectedApp={selectedAppForEmail}
          onSent={() => setCurrentTab("kanban")}
        />
      ) : currentTab === "analyze" ? (
        <JobAnalyzer
          masterProfile={masterResume}
          onGenerateResume={handleGenerateTailored}
        />
      ) : currentTab === "edit" ? (
        <ProfileEditor
          data={masterResume}
          onSave={handleSaveProfile}
          isSaving={isSaving}
        />
      ) : (
        <MainContent>
          <Sidebar>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Base da Verdade (Fatos Reais)</h2>
              {previewResume !== masterResume && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewResume(masterResume);
                    setActiveResumeTitle("Currículo Base Oficial (N2/N3)");
                  }}
                  style={{
                    fontSize: "0.75rem",
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid #d0d0d0",
                    background: "#f5f5f5",
                    cursor: "pointer",
                  }}
                  title="Restaurar visualização do Currículo Base Oficial"
                >
                  Ver Base
                </button>
              )}
            </div>
            <p>
              Estes dados estão protegidos na base de fatos.
              Nenhum processo da IA gera experiências ou certificações fora deste conjunto.
            </p>
            <div style={{ margin: "10px 0", padding: "8px 12px", background: "#f0f4f8", borderRadius: 6, fontSize: "0.8rem", color: "#005fb8", fontWeight: 600 }}>
              📄 Exibindo: {activeResumeTitle}
            </div>
            <ul>
              <li>
                <strong>Experiências:</strong> {masterResume.experiences.length} cadastradas
              </li>
              <li>
                <strong>Formações:</strong> {masterResume.education.length} registradas
              </li>
              <li>
                <strong>Certificações:</strong> {masterResume.certifications.length} validadas
              </li>
              <li>
                <strong>Habilidades:</strong> {masterResume.skills.length} categorias
              </li>
            </ul>
          </Sidebar>

          <PreviewArea>
            <ResumeWebPreview data={previewResume} />
          </PreviewArea>
        </MainContent>
      )}
    </Container>
  );
};
export default Home;