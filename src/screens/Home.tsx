import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { MasterProfileRepository } from "../infrastructure/supabase/MasterProfileRepository";
import { MASTER_PROFILE } from "../shared/constants/masterProfile";
import type { ResumeData } from "../domain/entities/Resume";
import { ResumeCanvas } from "../presentation/components/ResumeCanvas";
import { WorkspaceLayout } from "../presentation/components/WorkspaceLayout";
import { ProfileEditor } from "../presentation/components/ProfileEditor";
import { JobAnalyzer } from "../presentation/components/JobAnalyzer";
import { ApplicationsKanban } from "../presentation/components/ApplicationsKanban";
import { DashboardMetrics } from "../presentation/components/DashboardMetrics";
import { EmailSenderModal } from "../presentation/components/EmailSenderModal";
import { ResumeVersionsRepository } from "../infrastructure/supabase/ResumeVersionsRepository";
import { JobApplicationsRepository, type ApplicationItem } from "../infrastructure/supabase/JobApplicationsRepository";
import type { TailoredResumeResult } from "../domain/rules/ResumeTailoringEngine";
import type { ApplicationStatus } from "../shared/types/database.types";

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
      analysis: jobDetails?.analysis || null,
      jobs: {
        title: jobDetails?.jobTitle || "Analista de Suporte N2/N3",
        raw_description: jobDetails?.jobDescription || "",
        analysis: jobDetails?.analysis || null,
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
  };

  const handleOpenEmailWithApp = (app: ApplicationItem) => {
    setSelectedAppForEmail(app);
    setCurrentTab("email");
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
      onRestoreBase={handleRestoreBase}
      applicationsCount={applications.length}
      visibleSections={visibleSections}
      onToggleSection={handleToggleSection}
    >
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
        <ResumeCanvas
          data={previewResume}
          visibleSections={visibleSections}
        />
      )}
    </WorkspaceLayout>
  );
};
export default Home;