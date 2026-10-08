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
  const [resumeData, setResumeData] = useState<ResumeData>(MASTER_PROFILE);
  const [currentTab, setCurrentTab] = useState<"preview" | "edit" | "analyze" | "kanban" | "metrics" | "email">("preview");
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Carrega ou inicializa o perfil mestre sincronizado no Supabase
  useEffect(() => {
    if (user?.id) {
      MasterProfileRepository.getOrCreateProfile(user.id).then((profile) => {
        setResumeData(profile);
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
      setResumeData(updated);
      setCurrentTab("preview");
    } catch {
      alert("Erro ao salvar alterações no Supabase.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateTailored = async (tailoredResult: TailoredResumeResult) => {
    if (!tailoredResult.validationReport.isValid) {
      alert("Alerta de Invenção: O validador determinístico bloqueou a geração por inconsistência com o Perfil Mestre.");
      return;
    }

    setResumeData(tailoredResult.tailoredResume);
    setCurrentTab("preview");

    if (user?.id) {
      try {
        await ResumeVersionsRepository.saveVersion({
          userId: user.id,
          content: tailoredResult.tailoredResume,
          atsScore: 92,
          validationReport: tailoredResult.validationReport,
        });

        // Cria também a candidatura no CRM se houver vaga gerada
        const newApp = await JobApplicationsRepository.createApplication({
          userId: user.id,
          jobTitle: tailoredResult.tailoredResume.personalInfo.targetRoleOrTags,
          companyName: "Empresa da Vaga",
          jobDescription: tailoredResult.atsOptimizationSummary,
        });

        setApplications((prev) => [newApp as any, ...prev]);
      } catch (err) {
        console.error("Erro ao persistir versão no Supabase:", err);
      }
    }
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
            document={<ResumePDFTemplate data={resumeData} />}
            fileName="Curriculo_Renato_Franca_Lima.pdf"
            style={{ textDecoration: "none" }}
          >
            {({ loading }) => (
              <Button $primary disabled={loading}>
                <Download size={16} />
                {loading ? "Preparando PDF..." : "Baixar PDF Oficial"}
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
          onStatusChange={handleStatusChange}
        />
      ) : currentTab === "metrics" ? (
        <DashboardMetrics applications={applications} />
      ) : currentTab === "email" ? (
        <EmailSenderModal
          userId={user?.id || ""}
          candidateName={resumeData.personalInfo.fullName.replace(/\s+/g, " ").trim()}
          onSent={() => setCurrentTab("kanban")}
        />
      ) : currentTab === "analyze" ? (
        <JobAnalyzer
          masterProfile={resumeData}
          onGenerateResume={handleGenerateTailored}
        />
      ) : currentTab === "edit" ? (
        <ProfileEditor
          data={resumeData}
          onSave={handleSaveProfile}
          isSaving={isSaving}
        />
      ) : (
        <MainContent>
          <Sidebar>
            <h2>Base da Verdade (Fatos Reais)</h2>
            <p>
              Estes dados estão persistidos na tabela <code>master_facts</code> do seu Supabase.
              Nenhum processo da IA poderá gerar experiências ou certificações fora deste conjunto.
            </p>
            <ul>
              <li>
                <strong>Experiências:</strong> {resumeData.experiences.length} cadastradas
              </li>
              <li>
                <strong>Formações:</strong> {resumeData.education.length} registradas
              </li>
              <li>
                <strong>Certificações:</strong> {resumeData.certifications.length} validadas
              </li>
              <li>
                <strong>Habilidades:</strong> {resumeData.skills.length} categorias
              </li>
            </ul>
          </Sidebar>

          <PreviewArea>
            <ResumeWebPreview data={resumeData} />
          </PreviewArea>
        </MainContent>
      )}
    </Container>
  );
};
export default Home;