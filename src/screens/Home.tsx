import React, { useState, useEffect, Suspense, lazy } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { MasterProfileRepository } from "../infrastructure/supabase/MasterProfileRepository";
import { MASTER_PROFILE } from "../shared/constants/masterProfile";
import type { ResumeData } from "../domain/entities/Resume";
import { ResumeCanvas } from "../presentation/components/ResumeCanvas";
import { WorkspaceLayout } from "../presentation/components/WorkspaceLayout";
import { ResumeVersionsRepository } from "../infrastructure/supabase/ResumeVersionsRepository";
import { JobApplicationsRepository, type ApplicationItem } from "../infrastructure/supabase/JobApplicationsRepository";
import type { TailoredResumeResult } from "../domain/rules/ResumeTailoringEngine";
import type { ApplicationStatus } from "../shared/types/database.types";
import type { ResumeTemplateType } from "../presentation/templates/ResumePDFTemplate";
import { Loader2 } from "lucide-react";

// Code-Splitting: Carregamento sob demanda das abas mais pesadas
const ProfileEditor = lazy(() =>
  import("../presentation/components/ProfileEditor").then((m) => ({ default: m.ProfileEditor }))
);
const JobAnalyzer = lazy(() =>
  import("../presentation/components/JobAnalyzer").then((m) => ({ default: m.JobAnalyzer }))
);
const ApplicationsKanban = lazy(() =>
  import("../presentation/components/ApplicationsKanban").then((m) => ({ default: m.ApplicationsKanban }))
);
const DashboardMetrics = lazy(() =>
  import("../presentation/components/DashboardMetrics").then((m) => ({ default: m.DashboardMetrics }))
);
const EmailSenderModal = lazy(() =>
  import("../presentation/components/EmailSenderModal").then((m) => ({ default: m.EmailSenderModal }))
);
const JobPortalsView = lazy(() =>
  import("../presentation/components/JobPortalsView").then((m) => ({ default: m.JobPortalsView }))
);
const NewSkillView = lazy(() =>
  import("../presentation/components/NewSkillView").then((m) => ({ default: m.NewSkillView }))
);

const TabLoader: React.FC = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "360px",
      gap: "10px",
      color: "#64748b",
      fontSize: "0.9rem",
      fontWeight: 500,
    }}
  >
    <Loader2 size={24} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
    <span>Carregando módulo do workspace...</span>
  </div>
);

export const Home: React.FC = () => {
  const { user, signOut } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [masterResume, setMasterResume] = useState<ResumeData>(MASTER_PROFILE);
  const [previewResume, setPreviewResume] = useState<ResumeData>(MASTER_PROFILE);
  const [activeResumeTitle, setActiveResumeTitle] = useState<string>("Currículo Base Oficial (N2/N3)");
  const [currentTab, setCurrentTab] = useState<"preview" | "edit" | "analyze" | "kanban" | "metrics" | "email" | "portals" | "skill">("preview");
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [selectedAppForEmail, setSelectedAppForEmail] = useState<ApplicationItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [resumeTemplate, setResumeTemplate] = useState<ResumeTemplateType>("geometric");

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
      showError("Não foi possível atualizar o status da candidatura no banco de dados.", "Erro ao Atualizar");
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    try {
      if (user?.id) {
        await JobApplicationsRepository.deleteApplication(appId);
      }
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      showSuccess("Candidatura excluída com sucesso do CRM.", "Candidatura Removida");
    } catch {
      showError("Não foi possível excluir a candidatura.", "Erro ao Excluir");
    }
  };

  const handleUpdateNotes = async (appId: string, notes: string) => {
    try {
      if (user?.id) {
        await JobApplicationsRepository.updateNotes(appId, notes);
      }
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, notes } : a))
      );
      showSuccess("Anotações da candidatura atualizadas!", "Anotações Salvas");
    } catch {
      showError("Não foi possível salvar as anotações.", "Erro ao Salvar");
    }
  };

  const handleSaveProfile = async (updated: ResumeData) => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await MasterProfileRepository.saveProfile(user.id, updated);
      setMasterResume(updated);
      setPreviewResume(updated);
      showSuccess("Perfil Mestre e Fatos Reais sincronizados com sucesso no Supabase!", "Perfil Salvo");
      setCurrentTab("preview");
    } catch (err: any) {
      console.warn("[Home] Falha ao persistir no Supabase:", err);
      setMasterResume(updated);
      setPreviewResume(updated);
      showWarning("Suas alterações foram atualizadas no estado local.", "Aviso de Sincronização");
      setCurrentTab("preview");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateTailored = async (
    tailoredResult: TailoredResumeResult,
    jobDetails?: {
      jobTitle: string;
      companyName: string;
      jobDescription: string;
      sourceUrl?: string;
      analysis: any;
    }
  ) => {
    if (!tailoredResult.validationReport.isValid) {
      showError(
        "O validador determinístico bloqueou a geração por detectar inconsistência com a Base da Verdade.",
        "Alerta Anti-Invenção"
      );
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
      analysis: jobDetails?.analysis || null,
      jobs: {
        title: jobDetails?.jobTitle || "Analista de Suporte N2/N3",
        raw_description: jobDetails?.jobDescription || "",
        source_url: jobDetails?.sourceUrl || null,
        analysis: jobDetails?.analysis || null,
        companies: {
          name: jobDetails?.companyName || "Empresa Cadastrada",
        },
      },
    };

    setApplications((prev) => [newAppItem, ...prev]);

    if (user?.id) {
      try {
        const created: any = await JobApplicationsRepository.createApplication({
          userId: user.id,
          jobTitle: jobDetails?.jobTitle || "Analista de Suporte N2/N3",
          companyName: jobDetails?.companyName || "Empresa Cadastrada",
          jobDescription: jobDetails?.jobDescription || tailoredResult.atsOptimizationSummary,
          sourceUrl: jobDetails?.sourceUrl,
          analysis: jobDetails?.analysis,
        });

        const createdId = created?.id;

        await ResumeVersionsRepository.saveVersion({
          userId: user.id,
          applicationId: createdId || undefined,
          content: tailoredResult.tailoredResume,
          atsScore: jobDetails?.analysis?.matchScores?.overall || 92,
          validationReport: tailoredResult.validationReport,
        });

        if (createdId) {
          setApplications((prev) =>
            prev.map((a) =>
              a.id === newAppItem.id
                ? { ...a, id: createdId, tailored_resume: tailoredResult.tailoredResume }
                : a
            )
          );
        }
      } catch (err) {
        console.warn("Persistência no Supabase pendente:", err);
      }
    }

    showSuccess(
      `Currículo gerado para "${jobDetails?.jobTitle || "Vaga"}". Seu currículo base permaneceu 100% intacto e a versão específica foi adicionada ao CRM!`,
      "Currículo Otimizado Gerado"
    );
    setCurrentTab("kanban");
  };

  const [visibleSections, setVisibleSections] = useState({
    summary: true,
    experiences: true,
    education: true,
    certifications: true,
    skills: true,
    projects: true,
    languages: true,
  });

  const handleToggleSection = (sectionKey: string) => {
    setVisibleSections((prev) => ({
      ...prev,
      [sectionKey as keyof typeof prev]: !prev[sectionKey as keyof typeof prev],
    }));
  };

  const handleRestoreBase = () => {
    setPreviewResume(masterResume);
    setActiveResumeTitle("Currículo Base Oficial (N2/N3)");
    showInfo("Visualização do Currículo Base Oficial (N2/N3) restaurada.", "Currículo Base");
  };

  const handleOpenEmailWithApp = (app: ApplicationItem) => {
    setSelectedAppForEmail(app);
    setCurrentTab("email");
  };

  const handleSaveNewSkill = async (updated: ResumeData, skillTitle: string) => {
    if (!user?.id) {
      setMasterResume(updated);
      setPreviewResume(updated);
      showInfo(`Habilidade "${skillTitle}" salva no estado local.`, "Habilidade Adicionada");
      return;
    }

    try {
      await MasterProfileRepository.saveProfile(user.id, updated);
      setMasterResume(updated);
      setPreviewResume(updated);
      showSuccess(
        `"${skillTitle}" sincronizada na Base da Verdade e no Currículo Base Oficial!`,
        "Base da Verdade Sincronizada"
      );
    } catch (err) {
      console.warn("[Home] Falha ao sincronizar nova habilidade no Supabase:", err);
      setMasterResume(updated);
      setPreviewResume(updated);
      showWarning(
        `Habilidade salva no estado local da aplicação.`,
        "Sincronização Local"
      );
    }
  };

  return (
    <WorkspaceLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      userEmail={user?.email}
      onSignOut={signOut}
      masterResume={masterResume}
      activeResume={previewResume}
      activeResumeTitle={activeResumeTitle}
      template={resumeTemplate}
      onTemplateChange={setResumeTemplate}
      onRestoreBase={handleRestoreBase}
      applicationsCount={applications.length}
      visibleSections={visibleSections}
      onToggleSection={handleToggleSection}
    >
      <Suspense fallback={<TabLoader />}>
        {currentTab === "kanban" ? (
          <ApplicationsKanban
            applications={applications}
            masterProfile={masterResume}
            onStatusChange={handleStatusChange}
            onSendEmail={handleOpenEmailWithApp}
            onDeleteApplication={handleDeleteApplication}
            onUpdateNotes={handleUpdateNotes}
          />
        ) : currentTab === "portals" ? (
          <JobPortalsView applications={applications} />
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
        ) : currentTab === "skill" ? (
          <NewSkillView
            masterProfile={masterResume}
            onSaveSkill={handleSaveNewSkill}
            onGoToPreview={() => setCurrentTab("preview")}
          />
        ) : (
          <ResumeCanvas
            data={previewResume}
            template={resumeTemplate}
            onTemplateChange={setResumeTemplate}
            visibleSections={visibleSections}
          />
        )}
      </Suspense>
    </WorkspaceLayout>
  );
};
export default Home;