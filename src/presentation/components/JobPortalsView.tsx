import React, { useState } from "react";
import styled from "styled-components";
import {
  Globe,
  ExternalLink,
  Search,
  Building2,
  BookmarkCheck,
  Briefcase,
  ArrowUpRight,
  ShieldCheck,
  Copy,
} from "lucide-react";
import { openSideBrowser } from "../../shared/utils/popupLauncher";
import type { ApplicationItem } from "../../infrastructure/supabase/JobApplicationsRepository";
import { useToast } from "../../context/ToastContext";

interface JobPortalsViewProps {
  applications: ApplicationItem[];
  onUpdateJobUrl?: (applicationId: string, url: string) => void;
}

interface PortalInfo {
  id: string;
  name: string;
  category: string;
  badge: string;
  badgeColor: string;
  description: string;
  trackingUrl: string;
  searchUrl: string;
  logoText: string;
  logoBg: string;
  tips: string;
}

const PORTALS: PortalInfo[] = [
  {
    id: "gupy",
    name: "Gupy Candidaturas",
    category: "Principal Plataforma Corporativa",
    badge: "Minhas Candidaturas",
    badgeColor: "#0055ff",
    description: "Acompanhe testes de perfil, fit cultural, etapas de triagem e feedbacks das suas inscrições na Gupy.",
    trackingUrl: "https://login.gupy.io/candidates/signin",
    searchUrl: "https://portal.gupy.io/job-search?jobName=Suporte",
    logoText: "GUPY",
    logoBg: "#0055ff",
    tips: "Faça login com sua conta da Gupy para acompanhar o progresso em tempo real ao lado do seu currículo.",
  },
  {
    id: "linkedin",
    name: "LinkedIn Jobs & Tracker",
    category: "Rede Profissional & Vagas",
    badge: "Candidaturas Enviadas",
    badgeColor: "#0a66c2",
    description: "Verifique o status das vagas onde você enviou candidatura simplificada ou salvou para acompanhar.",
    trackingUrl: "https://www.linkedin.com/jobs/tracker/applied/",
    searchUrl: "https://www.linkedin.com/jobs/search/?keywords=Suporte%20TI%20N2%20N3",
    logoText: "in",
    logoBg: "#0a66c2",
    tips: "Veja quais recrutadores visualizaram sua candidatura e o número de inscritos por vaga.",
  },
  {
    id: "indeed",
    name: "Indeed Minhas Vagas",
    category: "Agregador Global",
    badge: "Painel do Candidato",
    badgeColor: "#2164f3",
    description: "Monitore respostas de recrutadores, convites para entrevistas e alertas de novas oportunidades.",
    trackingUrl: "https://br.indeed.com/myjobs",
    searchUrl: "https://br.indeed.com/jobs?q=analista+suporte&l=Brasil",
    logoText: "indeed",
    logoBg: "#2164f3",
    tips: "Ideal para conferir atualizações de candidaturas feitas diretamente pela plataforma.",
  },
  {
    id: "glassdoor",
    name: "Glassdoor & Salários",
    category: "Cultura & Salários",
    badge: "Empresas & Vagas",
    badgeColor: "#0caa41",
    description: "Consulte avaliações reais de funcionários, salários praticados e perguntas frequentes de entrevistas.",
    trackingUrl: "https://www.glassdoor.com.br/member/home/index.htm",
    searchUrl: "https://www.glassdoor.com.br/Vaga/index.htm",
    logoText: "GD",
    logoBg: "#0caa41",
    tips: "Excelente para validar a faixa salarial antes da entrevista com o RH.",
  },
  {
    id: "catho",
    name: "Catho Área do Candidato",
    category: "Banco de Vagas Nacional",
    badge: "Minhas Candidaturas",
    badgeColor: "#ff5000",
    description: "Acompanhe o envio de currículos, histórico de visualizações por empresas e mensagens de selecionadores.",
    trackingUrl: "https://www.catho.com.br/area-candidato/",
    searchUrl: "https://www.catho.com.br/vagas/analista-de-suporte/",
    logoText: "CATHO",
    logoBg: "#ff5000",
    tips: "Consulte se as empresas abriram seu currículo nas últimas 48 horas.",
  },
  {
    id: "infojobs",
    name: "InfoJobs Candidaturas",
    category: "Portal de Empregos",
    badge: "Processos Seletivos",
    badgeColor: "#0083ca",
    description: "Verifique o andamento de processos seletivos, testes online aplicados e convites de empresas parceiras.",
    trackingUrl: "https://www.infojobs.com.br/candidate/",
    searchUrl: "https://www.infojobs.com.br/vagas-de-emprego-analista-suporte.aspx",
    logoText: "IJ",
    logoBg: "#0083ca",
    tips: "Acompanhe o status do processo em etapas (Inscrito, Em Análise, Selecionado).",
  },
];

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px 4px;
`;

const HeaderBanner = styled.div`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #ffffff;
  border-radius: 12px;
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  @media (max-width: 860px) {
    flex-direction: column;
    align-items: flex-start;
  }

  .title-area {
    display: flex;
    flex-direction: column;
    gap: 8px;

    h2 {
      font-size: 1.35rem;
      font-weight: 700;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #ffffff;
    }

    p {
      margin: 0;
      font-size: 0.88rem;
      color: #94a3b8;
      max-width: 680px;
      line-height: 1.5;
    }
  }

  .badge-panel {
    background-color: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    white-space: nowrap;

    .icon {
      color: #38bdf8;
    }

    .info {
      display: flex;
      flex-direction: column;
      font-size: 0.78rem;

      strong {
        color: #f8fafc;
        font-weight: 600;
      }

      span {
        color: #94a3b8;
      }
    }
  }
`;

const UrlNavigatorCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px 22px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 12px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    span {
      font-size: 0.78rem;
      color: #64748b;
    }
  }

  .input-group {
    display: flex;
    gap: 8px;

    @media (max-width: 640px) {
      flex-direction: column;
    }

    input {
      flex: 1;
      padding: 10px 14px;
      font-size: 0.88rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      outline: none;
      transition: border-color 0.15s ease;

      &:focus {
        border-color: #0284c7;
        box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
      }
    }

    button {
      background-color: #0f172a;
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 10px 18px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.15s ease;
      white-space: nowrap;

      &:hover {
        background-color: #1e293b;
      }
    }
  }
`;

const PortalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const PortalCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
  }

  .card-top {
    display: flex;
    align-items: flex-start;
    gap: 14px;

    .portal-avatar {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.95rem;
      flex-shrink: 0;
    }

    .portal-meta {
      display: flex;
      flex-direction: column;
      gap: 3px;

      .category {
        font-size: 0.72rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: #0f172a;
      }
    }
  }

  p.description {
    margin: 0;
    font-size: 0.82rem;
    color: #475569;
    line-height: 1.45;
  }

  .tips-box {
    background-color: #f8fafc;
    border-left: 3px solid #cbd5e1;
    padding: 8px 12px;
    border-radius: 0 4px 4px 0;
    font-size: 0.75rem;
    color: #64748b;
    line-height: 1.4;
  }

  .action-buttons {
    display: flex;
    gap: 8px;

    button.primary-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background-color: #0f172a;
      color: #ffffff;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 9px 12px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: background-color 0.15s ease;

      &:hover {
        background-color: #1e293b;
      }
    }

    button.secondary-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background-color: #f1f5f9;
      color: #334155;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 9px 12px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: background-color 0.15s ease;

      &:hover {
        background-color: #e2e8f0;
      }
    }
  }
`;

const CrmTrackingSection = styled.div`
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 16px;

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    span {
      font-size: 0.78rem;
      color: #64748b;
    }
  }

  .apps-table {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;

const AppRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  gap: 12px;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: flex-start;
  }

  .app-info {
    display: flex;
    flex-direction: column;
    gap: 3px;

    strong {
      font-size: 0.88rem;
      color: #0f172a;
    }

    .sub {
      font-size: 0.78rem;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .app-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 7px 12px;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }

    button.open-btn {
      background-color: #0284c7;
      color: #ffffff;

      &:hover {
        background-color: #0369a1;
      }
    }

    button.copy-btn {
      background-color: #ffffff;
      color: #475569;
      border: 1px solid #cbd5e1;

      &:hover {
        background-color: #f1f5f9;
      }
    }
  }
`;

export const JobPortalsView: React.FC<JobPortalsViewProps> = ({
  applications,
}) => {
  const { showSuccess, showInfo } = useToast();
  const [customUrl, setCustomUrl] = useState("");

  const handleOpenSide = (url: string, name: string) => {
    openSideBrowser(url, name);
    showSuccess(`Abrindo ${name} em janela lateral acoplada.`, "Navegador Lateral");
  };

  const handleOpenCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    openSideBrowser(customUrl.trim(), "Navegação da Vaga");
    showSuccess("Link aberto no navegador lateral!", "Navegador Lateral");
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    showInfo("Link copiado para a área de transferência!", "Link Copiado");
  };

  return (
    <Container>
      {/* Banner Principal */}
      <HeaderBanner>
        <div className="title-area">
          <h2>
            <Globe size={24} color="#38bdf8" />
            Portais de Vagas & Acompanhamento de Processos
          </h2>
          <p>
            Monitore suas candidaturas na Gupy, LinkedIn e outros portais diretamente ao lado do
            seu workspace no CV Certo. As janelas abrem como um mini-browser lateral com a sua sessão
            e login de usuário preservados.
          </p>
        </div>

        <div className="badge-panel">
          <ShieldCheck size={26} className="icon" />
          <div className="info">
            <strong>Sessão de Usuário Mantida</strong>
            <span>Login e cookies ativos do navegador</span>
          </div>
        </div>
      </HeaderBanner>

      {/* Barra de URL Rápida para qualquer link de vaga */}
      <UrlNavigatorCard>
        <div className="card-header">
          <h3>
            <Search size={16} color="#0284c7" />
            Abrir Qualquer Link de Vaga no Navegador Lateral
          </h3>
          <span>Cole links de vagas recebidos por e-mail, WhatsApp ou recrutadores</span>
        </div>

        <form onSubmit={handleOpenCustomUrl} className="input-group">
          <input
            type="text"
            placeholder="Cole aqui o link da vaga (ex: https://empresa.gupy.io/job/123456 ou LinkedIn...)"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
          />
          <button type="submit">
            <ExternalLink size={15} />
            Abrir em Janela Lateral
          </button>
        </form>
      </UrlNavigatorCard>

      {/* Grid de Portais Principais */}
      <div>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <Briefcase size={18} color="#0f172a" />
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
            Acesso Rápido às Suas Contas nos Portais
          </h3>
        </div>

        <PortalsGrid>
          {PORTALS.map((portal) => (
            <PortalCard key={portal.id}>
              <div>
                <div className="card-top">
                  <div className="portal-avatar" style={{ backgroundColor: portal.logoBg }}>
                    {portal.logoText}
                  </div>
                  <div className="portal-meta">
                    <span className="category">{portal.category}</span>
                    <h4>{portal.name}</h4>
                  </div>
                </div>

                <p className="description" style={{ marginTop: 12 }}>
                  {portal.description}
                </p>

                <div className="tips-box" style={{ marginTop: 12 }}>
                  💡 {portal.tips}
                </div>
              </div>

              <div className="action-buttons">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => handleOpenSide(portal.trackingUrl, portal.name)}
                  title={`Abrir ${portal.name} em mini-browser lateral`}
                >
                  <ArrowUpRight size={15} />
                  Abrir Minhas Candidaturas
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => openSideBrowser(portal.searchUrl, `Buscar Vagas - ${portal.name}`)}
                  title="Abrir busca de vagas em TI"
                >
                  <Search size={13} />
                  Buscar
                </button>
              </div>
            </PortalCard>
          ))}
        </PortalsGrid>
      </div>

      {/* Candidaturas do CRM com atalho para abrir */}
      <CrmTrackingSection>
        <div className="section-header">
          <h3>
            <BookmarkCheck size={18} color="#0f172a" />
            Acompanhar Vagas do Seu CRM
          </h3>
          <span>{applications.length} candidaturas registradas</span>
        </div>

        {applications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: "0.85rem" }}>
            Nenhuma candidatura registrada no CRM ainda. Quando você analisar uma vaga ou gerar um
            currículo, ela aparecerá aqui para acompanhamento rápido.
          </div>
        ) : (
          <div className="apps-table">
            {applications.map((app) => {
              const jobTitle = app.jobs?.title || "Vaga Cadastrada";
              const companyName = app.jobs?.companies?.name || "Empresa";
              // Tenta localizar url da vaga
              const candidateUrl =
                (app.jobs as any)?.source_url ||
                (app.jobs?.raw_description?.match(/https?:\/\/[^\s]+/)?.[0]) ||
                null;

              return (
                <AppRow key={app.id}>
                  <div className="app-info">
                    <strong>{jobTitle}</strong>
                    <div className="sub">
                      <Building2 size={13} />
                      <span>{companyName}</span>
                      <span>•</span>
                      <span>Status: {app.status.replace(/_/g, " ")}</span>
                    </div>
                  </div>

                  <div className="app-actions">
                    {candidateUrl ? (
                      <>
                        <button
                          type="button"
                          className="open-btn"
                          onClick={() => handleOpenSide(candidateUrl, `${jobTitle} (${companyName})`)}
                        >
                          <ExternalLink size={13} />
                          Abrir Link da Vaga
                        </button>
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={() => handleCopyLink(candidateUrl)}
                          title="Copiar URL"
                        >
                          <Copy size={13} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="open-btn"
                        onClick={() =>
                          openSideBrowser(
                            `https://www.google.com/search?q=${encodeURIComponent(
                              `${jobTitle} ${companyName} vaga`
                            )}`,
                            `${jobTitle} - Busca`
                          )
                        }
                      >
                        <Search size={13} />
                        Buscar Vaga no Google/Portal
                      </button>
                    )}
                  </div>
                </AppRow>
              );
            })}
          </div>
        )}
      </CrmTrackingSection>
    </Container>
  );
};
