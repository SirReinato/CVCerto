import React, { useState } from "react";
import styled from "styled-components";
import {
  X,
  Sparkles,
  Target,
  DollarSign,
  FileText,
  Code2,
  Zap,
  MessageSquare,
  Copy,
  Check,
  Building2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import type { ApplicationItem } from "../../infrastructure/supabase/JobApplicationsRepository";
import type { FullInterviewDossier, JobAnalysis } from "../../domain/entities/JobAnalysis";

interface InterviewPrepModalProps {
  application: ApplicationItem;
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
  max-width: 860px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 18px 24px;
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
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: rgba(37, 99, 235, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .meta {
      font-size: 0.8rem;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
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

const TabsNav = styled.div`
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
  padding: 0 12px;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  font-size: 0.84rem;
  font-weight: ${(props) => (props.$active ? "700" : "500")};
  color: ${(props) => (props.$active ? "#0f172a" : "#64748b")};
  border-bottom: 2px solid ${(props) => (props.$active ? "#2563eb" : "transparent")};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    color: #0f172a;
    background: rgba(241, 245, 249, 0.6);
  }
`;

const ModalContent = styled.div`
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #ffffff;
  color: #1e293b;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
`;

/* Styled Elements para as 8 Seções */
const CardBox = styled.div<{ $borderVariant?: string }>`
  background: #ffffff;
  border: 1px solid ${(props) => props.$borderVariant || "#e2e8f0"};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h4`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CalloutBox = styled.div<{ $color?: string; $bg?: string }>`
  background: ${(props) => props.$bg || "#f8fafc"};
  border-left: 4px solid ${(props) => props.$color || "#2563eb"};
  padding: 12px 14px;
  border-radius: 0 6px 6px 0;
  font-size: 0.84rem;
  line-height: 1.5;
  color: #1e293b;
`;

const ScriptCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .script-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    span {
      font-size: 0.82rem;
      font-weight: 700;
      color: #1e293b;
    }
  }

  p {
    margin: 0;
    font-size: 0.84rem;
    line-height: 1.55;
    color: #334155;
    font-style: italic;
  }
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 0.73rem;
  font-weight: 600;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  color: #475569;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
`;

const StarItemCard = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .star-q {
    font-size: 0.9rem;
    font-weight: 700;
    color: #0f172a;
  }

  .star-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .star-row {
    display: flex;
    gap: 10px;
    font-size: 0.82rem;
    line-height: 1.45;

    .star-badge {
      flex: 0 0 24px;
      height: 24px;
      border-radius: 4px;
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .star-text {
      color: #334155;
      flex: 1;

      strong {
        color: #0f172a;
      }
    }
  }

  .diff-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 4px;

    span {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 600;
    }
  }
`;

const SabatinaCard = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .q-title {
    font-size: 0.88rem;
    font-weight: 700;
    color: #0f172a;
  }

  .answer-box {
    background: #f8fafc;
    border-left: 3px solid #10b981;
    padding: 10px 12px;
    font-size: 0.83rem;
    line-height: 1.5;
    color: #1e293b;
  }

  .red-flag {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    color: #b91c1c;
    background: #fef2f2;
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid #fecaca;
  }
`;

export const InterviewPrepModal: React.FC<InterviewPrepModalProps> = ({ application, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    "diagnostico" | "scripts" | "star" | "sabatina" | "salario_perguntas"
  >("diagnostico");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const rawAnalysis: JobAnalysis | undefined = application.analysis || application.jobs?.analysis;
  const dossier: FullInterviewDossier | undefined = rawAnalysis?.interviewDossier;

  // Fallback para dados legados caso a vaga tenha sido analisada antes da versão 2.0
  const roleTitle = application.jobs?.title || "Analista de Suporte N2/N3";
  const companyName = application.jobs?.companies?.name || "Empresa Contratante";
  const matchScore = application.match_overall || rawAnalysis?.matchScores?.overall || 88;

  // Seções com fallbacks determinísticos protegidos
  const diagnosis = dossier?.executiveDiagnosis || {
    targetRole: roleTitle,
    companyName: companyName,
    overallMatchScore: matchScore,
    culturalAndTechnicalFit: {
      immediateStrengths: [
        "Sustentação corporativa com administração de Microsoft 365 e Active Directory (Brasfort e Truly Informática).",
        "Certificações oficiais reconhecidas pelo mercado: Microsoft Azure Fundamentals (AZ-900) e ITIL 4 Foundation.",
        "Resolução de incidentes críticos orientada a cumprimento rigoroso de SLAs e governança de serviços.",
        "Formação em Análise e Desenvolvimento de Sistemas e Pós-Graduação em Inteligência Artificial em andamento."
      ],
      gapsAndOvercomingStrategy: [
        {
          gap: "Conhecimentos avançados de infraestrutura Linux ou automação em nuvem",
          strategy: "Enfatizar a velocidade de aprendizado comprovada pelas certificações AZ-900/ITIL e a familiaridade com arquitetura de redes e scripts."
        }
      ],
      jobSummaryVision: `A ${companyName} busca estabilidade operacional, redução de MTTR em chamados críticos e conformidade nas identidades corporativas de usuários.`
    }
  };

  const salary = dossier?.salaryAnalysis || {
    suggestedCLT: rawAnalysis?.interviewPrep?.salaryExpectationGuide?.suggestedCLT || "R$ 5.000 a R$ 6.800",
    suggestedPJ: rawAnalysis?.interviewPrep?.salaryExpectationGuide?.suggestedPJ || "R$ 7.500 a R$ 9.500",
    pricingJustification: rawAnalysis?.interviewPrep?.salaryExpectationGuide?.justification || "Fundamentado na senioridade N2/N3, certificações AZ-900 e ITIL 4 e pós em IA em andamento.",
    flexibilityTrigger: "Minha pretensão salarial é flexível conforme o pacote de benefícios corporativos (VR/VA, plano de saúde, auxílio home office, PLR e modelo de atuação)."
  };

  const scripts = dossier?.screeningScripts || {
    elevatorPitch: `Sou graduado em Análise e Desenvolvimento de Sistemas e atuo na sustentação e suporte técnico corporativo avançado. Na Brasfort e Truly Informática, gerenciei rotinas críticas de infraestrutura, administração de Microsoft 365, Active Directory corporativo e fluxos na plataforma Neppo. Possuo certificações Microsoft Azure Fundamentals (AZ-900) e ITIL 4 Foundation, e atualmente curso pós-graduação em Inteligência Artificial. Busco esta oportunidade na ${companyName} para aplicar essa maturidade operacional e impulsionar a estabilidade e eficiência tecnológica do time.`,
    helpCompanyChallenge: `Entendo que o principal desafio da ${companyName} é manter alta disponibilidade com rigor em governança e SLAs. Minha vivência em atender centenas de usuários com playbooks ITIL 4 e resolução na causa-raiz permite assumir a demanda com curva zero de adaptação, reduzindo reincidências desde a primeira semana.`,
    motivation: rawAnalysis?.interviewPrep?.motivationResponse || `O que me motivou a me candidatar à ${companyName} foi a solidez da atuação da empresa e a oportunidade de atuar em projetos com padrões elevados de qualidade e impacto direto na produtividade dos colaboradores.`,
    transitionReason: `Busco uma transição para expandir meu escopo de atuação e contribuir em um ambiente estruturado que valorize boas práticas de governança em nuvem, melhoria contínua e inovação tecnológica.`
  };

  const starQuestions = dossier?.behavioralStarQuestions || [
    {
      question: "Conte sobre uma situação de incidente crítico sob pressão/crise e como você lidou.",
      situation: "Durante um pico de operação na Truly Informática, um grupo de usuários corporativos perdeu acesso a serviços essenciais do Microsoft 365 devido a uma inconsistência de sincronização no Active Directory.",
      task: "Restabelecer o acesso com urgência máxima, contornando o impacto operacional dentro da janela de SLA.",
      action: "Identifiquei a falha de sincronização de credenciais, apliquei o procedimento de contingência e restabeleci a integridade dos grupos no AD em comunicação transparente com os gestores.",
      result: "Serviço normalizado em menos de 30 minutos sem perda de dados, com criação de um procedimento operacional padrão para blindar futuras ocorrências.",
      appliedDifferentials: ["✓ ITIL 4 Incident Management", "✓ SLA rigoroso cumprido", "✓ Criação de POP preventivo"]
    },
    {
      question: "Descreva uma situação em que teve divergência com colegas ou clientes sobre uma solução técnica.",
      situation: "Um cliente interno solicitou a liberação de privilégios de administrador local que violavam as políticas de segurança corporativa vigentes.",
      task: "Negociar a recusa do privilégio sem gerar atrito, viabilizando o trabalho do colaborador com segurança.",
      action: "Apresentei de forma consultiva e empática os riscos de segurança, mapeei a real necessidade da tarefa e criei uma exceção controlada via política segura no Azure/GPO.",
      result: "O usuário concluiu a tarefa com sucesso e a integridade da estação foi preservada sem violação das diretrizes de TI.",
      appliedDifferentials: ["✓ Comunicação empática", "✓ Segurança da Informação", "✓ Resolução consultiva"]
    },
    {
      question: "Como você prioriza suas tarefas quando surgem múltiplas demandas simultâneas de alta prioridade?",
      situation: "Em dias de alta demanda, surgiam simultaneamente solicitações de diretoria e falhas de rede em setores operacionais.",
      task: "Gerenciar a fila de chamados sem estourar SLAs e mantendo a calma técnica.",
      action: "Utilizei a matriz de gravidade e urgência do ITIL 4, delegando ações preliminares aos níveis de suporte e comunicando proativamente os solicitantes sobre a previsão de entrega.",
      result: "100% dos chamados críticos atendidos dentro do tempo contratado com avaliação positiva de satisfação dos usuários.",
      appliedDifferentials: ["✓ Matriz Gravidade x Urgência", "✓ Comunicação proativa"]
    }
  ];

  const sabatina = dossier?.technicalSabatina || [
    {
      question: "Qual a diferença entre Azure Active Directory (Microsoft Entra ID) e Active Directory Domain Services (AD DS) local?",
      idealAnswer: "O AD DS local baseia-se em protocolos legados como Kerberos, NTLM e LDAP organizados em florestas e OUs. Já o Entra ID é uma solução de gerenciamento de identidades em nuvem com protocolos web modernos (OAuth 2.0, SAML, OpenID Connect) e recursos de Acesso Condicional e MFA.",
      redFlagsToAvoid: "Dizer que o Entra ID é apenas uma cópia virtualizada do AD em um servidor na nuvem."
    },
    {
      question: "Como você investiga e diagnostica um erro de inicialização ou tela azul (BSOD) em uma estação de trabalho?",
      idealAnswer: "Coleto o minidump (.dmp) para análise de causa-raiz via WinDbg ou BlueScreenView, verifico os logs de eventos do Windows (Event Viewer) sob 'Sistema' e testo memória RAM e integridade de disco com chkdsk/sfc antes de qualquer reinstalação.",
      redFlagsToAvoid: "Sugerir formatar o computador imediatamente sem antes analisar os logs e identificar a falha."
    },
    {
      question: "O que são Group Policy Objects (GPOs) e qual a ordem de precedência de aplicação (LSDOU)?",
      idealAnswer: "GPOs são configurações centralizadas de segurança e preferências no domínio. A ordem de precedência é Local, Site, Domínio e Unidade Organizacional (LSDOU), sendo que as políticas aplicadas por último na OU sobrescrevem as anteriores a menos que haja 'No Override'/'Enforced'.",
      redFlagsToAvoid: "Esquecer a ordem de precedência ou dizer que a política local tem maior prioridade que a da OU."
    },
    {
      question: "Explique como funciona o processo de triagem e escalonamento de incidentes segundo o ITIL 4.",
      idealAnswer: "No ITIL 4, o foco é a cadeia de valor. Um incidente é registrado, categorizado por impacto e urgência, priorizado na matriz de SLA e tratado para restauração rápida do serviço. Caso a causa-raiz seja desconhecida ou recorrente, abre-se um Gerenciamento de Problemas (Problem Management).",
      redFlagsToAvoid: "Confundir Gestão de Incidentes (restauração rápida do serviço) com Gestão de Problemas (investigação da causa-raiz definitiva)."
    },
    {
      question: "Como você gerencia o licenciamento e permissões de caixas compartilhadas (Shared Mailboxes) no Microsoft 365?",
      idealAnswer: "Shared Mailboxes não exigem licença atribuída caso o volume seja inferior a 50GB. O acesso é delegado atribuindo permissões 'Full Access' (acesso total) e 'Send As' ou 'Send on Behalf' aos usuários licenciados através do Centro de Administração do Exchange (EAC) ou PowerShell.",
      redFlagsToAvoid: "Afirmar que toda caixa compartilhada obrigatoriamente precisa de uma licença paga do M365 Business Standard."
    }
  ];

  const sharpness = dossier?.maximumSharpness || {
    realCasesToRemember: [
      "Case Brasfort: Administração de infraestrutura, atendimento a chamados de alta complexidade e gestão de acessos.",
      "Case Truly Informática: Sustentação de Microsoft 365, automação na plataforma Neppo e resolução ágil sob SLA.",
      "Case Pós em IA e Projetos: Desenvolvimento do sistema CV Certo com arquitetura limpa, IA Gemini e conformidade ATS."
    ],
    keyConceptsToReview: [
      "GPO, OU, Kerberos, DNS, DHCP, IPv4/IPv6",
      "Entra ID, Acesso Condicional, MFA, Intune/MDM",
      "SLA, ITIL 4 Incident/Problem/Change Management",
      "Exchange Online, OneDrive, SharePoint, Licenças M365"
    ],
    mindsetAndPostureTip: "Para entrevista com RH: valorize comunicação, foco em pessoas, adaptabilidade e método ITIL. Para entrevista com Gestor Técnico: fale em termos de métricas (MTTR, SLA), causa-raiz, segurança de identidade e proatividade em resolver sem reincidência."
  };

  const smartQuestions = dossier?.smartQuestionsToAsk || {
    architectureAndProcesses: "Como está estruturada a governança de identidades e nuvem híbrida da empresa hoje, e quais são os maiores gargalos que vocês pretendem sanar neste trimestre?",
    first90DaysSuccessCriteria: "Quais seriam as principais entregas ou métricas de atendimento que fariam vocês considerarem essa contratação um grande sucesso nos primeiros 90 dias?",
    teamAutonomyAndGrowth: "Qual é o nível de autonomia do time de sustentação para propor melhorias de processo, automações de rotina e projetos de modernização tecnológica?"
  };

  return (
    <Overlay onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        {/* Header da Modal */}
        <ModalHeader>
          <div className="title-group">
            <div className="icon-badge">
              <Sparkles size={20} color="#60a5fa" />
            </div>
            <div>
              <h3>Dossiê de Entrevista & Vaga</h3>
              <div className="meta">
                <Building2 size={13} />
                <span>{companyName}</span>
                <span>•</span>
                <span>{roleTitle}</span>
                <span>•</span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>Match: {matchScore}%</span>
              </div>
            </div>
          </div>
          <button className="close-btn" type="button" onClick={onClose} title="Fechar Modal">
            <X size={20} />
          </button>
        </ModalHeader>

        {/* Abas de Navegação (5 Tabs) */}
        <TabsNav>
          <TabButton
            $active={activeTab === "diagnostico"}
            onClick={() => setActiveTab("diagnostico")}
          >
            <Target size={15} />
            Tab 1: Diagnóstico & Match
          </TabButton>
          <TabButton
            $active={activeTab === "scripts"}
            onClick={() => setActiveTab("scripts")}
          >
            <FileText size={15} />
            Tab 2: Scripts de Apresentação
          </TabButton>
          <TabButton
            $active={activeTab === "star"}
            onClick={() => setActiveTab("star")}
          >
            <ShieldCheck size={15} />
            Tab 3: Simulação STAR & RH
          </TabButton>
          <TabButton
            $active={activeTab === "sabatina"}
            onClick={() => setActiveTab("sabatina")}
          >
            <Code2 size={15} />
            Tab 4: Sabatina Técnica & Afiação
          </TabButton>
          <TabButton
            $active={activeTab === "salario_perguntas"}
            onClick={() => setActiveTab("salario_perguntas")}
          >
            <DollarSign size={15} />
            Tab 5: Perguntas ao Entrevistador & Salário
          </TabButton>
        </TabsNav>

        {/* Conteúdo por Aba */}
        <ModalContent>
          {/* TAB 1: DIAGNÓSTICO & MATCH */}
          {activeTab === "diagnostico" && (
            <>
              <CardBox $borderVariant="#bfdbfe">
                <SectionTitle style={{ color: "#1d4ed8" }}>
                  <Target size={18} />
                  1. Resumo Executivo & Diagnóstico de Match
                </SectionTitle>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", background: "#f8fafc", padding: 12, borderRadius: 6 }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Cargo Alvo:</span>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{diagnosis.targetRole}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Empresa:</span>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{diagnosis.companyName}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Score de Match Geral:</span>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#16a34a" }}>{diagnosis.overallMatchScore}% de Aderência</div>
                  </div>
                </div>

                {/* Visão Resumida da Vaga */}
                <div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>
                    Visão Resumida da Vaga (Entrelinhas do Anúncio):
                  </span>
                  <CalloutBox $color="#2563eb" $bg="#eff6ff" style={{ marginTop: 4 }}>
                    {diagnosis.culturalAndTechnicalFit.jobSummaryVision}
                  </CalloutBox>
                </div>

                {/* Pontos Fortes Imediatos */}
                <div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#166534" }}>
                    Pontos Fortes Imediatos (Destaques com Folga):
                  </span>
                  <ul style={{ margin: "6px 0 0 0", paddingLeft: 18, fontSize: "0.83rem", color: "#334155" }}>
                    {diagnosis.culturalAndTechnicalFit.immediateStrengths.map((str, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        <CheckCircle2 size={13} color="#16a34a" style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gaps Identificados & Como Contornar */}
                <div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#b45309" }}>
                    Gaps Identificados & Como Contornar na Entrevista:
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                    {diagnosis.culturalAndTechnicalFit.gapsAndOvercomingStrategy.map((gapItem, idx) => (
                      <CalloutBox key={idx} $color="#d97706" $bg="#fffbeb">
                        <strong style={{ color: "#92400e" }}>Lacuna:</strong> {gapItem.gap}
                        <br />
                        <strong style={{ color: "#15803d" }}>Estratégia de Resposta:</strong> {gapItem.strategy}
                      </CalloutBox>
                    ))}
                  </div>
                </div>
              </CardBox>
            </>
          )}

          {/* TAB 2: SCRIPTS DE APRESENTAÇÃO */}
          {activeTab === "scripts" && (
            <>
              <SectionTitle style={{ color: "#0f172a" }}>
                <FileText size={18} color="#2563eb" />
                3. Scripts Prontos para Etapas de Triagem (Gupy / LinkedIn / Formulários)
              </SectionTitle>
              <span style={{ fontSize: "0.8rem", color: "#64748b", marginTop: -12 }}>
                Textos em 1ª pessoa, tom confiante e profissional para preencher formulários ou falar nas chamadas iniciais.
              </span>

              {/* A. Elevator Pitch */}
              <ScriptCard>
                <div className="script-header">
                  <span>A. "Fale sobre você e sua trajetória profissional" (Elevator Pitch de 90s)</span>
                  <CopyButton
                    type="button"
                    onClick={() => handleCopy("pitch", scripts.elevatorPitch)}
                  >
                    {copiedKey === "pitch" ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    {copiedKey === "pitch" ? "Copiado!" : "Copiar"}
                  </CopyButton>
                </div>
                <p>"{scripts.elevatorPitch}"</p>
              </ScriptCard>

              {/* B. Desafio da Empresa */}
              <ScriptCard>
                <div className="script-header">
                  <span>B. "Como você pode ajudar a empresa no desafio descrito nesta vaga?"</span>
                  <CopyButton
                    type="button"
                    onClick={() => handleCopy("help", scripts.helpCompanyChallenge)}
                  >
                    {copiedKey === "help" ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    {copiedKey === "help" ? "Copiado!" : "Copiar"}
                  </CopyButton>
                </div>
                <p>"{scripts.helpCompanyChallenge}"</p>
              </ScriptCard>

              {/* C. O que motivou */}
              <ScriptCard>
                <div className="script-header">
                  <span>C. "O que motivou você a se candidatar a esta oportunidade?"</span>
                  <CopyButton
                    type="button"
                    onClick={() => handleCopy("mot", scripts.motivation)}
                  >
                    {copiedKey === "mot" ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    {copiedKey === "mot" ? "Copiado!" : "Copiar"}
                  </CopyButton>
                </div>
                <p>"{scripts.motivation}"</p>
              </ScriptCard>

              {/* D. Transição de carreira */}
              <ScriptCard>
                <div className="script-header">
                  <span>D. "Por que você quer sair da sua posição atual / fazer essa transição?"</span>
                  <CopyButton
                    type="button"
                    onClick={() => handleCopy("trans", scripts.transitionReason)}
                  >
                    {copiedKey === "trans" ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    {copiedKey === "trans" ? "Copiado!" : "Copiar"}
                  </CopyButton>
                </div>
                <p>"{scripts.transitionReason}"</p>
              </ScriptCard>
            </>
          )}

          {/* TAB 3: SIMULAÇÃO STAR & RH */}
          {activeTab === "star" && (
            <>
              <SectionTitle style={{ color: "#0f172a" }}>
                <ShieldCheck size={18} color="#059669" />
                4. Simulação de Perguntas Comportamentais (Método STAR)
              </SectionTitle>
              <span style={{ fontSize: "0.8rem", color: "#64748b", marginTop: -12 }}>
                Roteiros estruturados em Situação, Tarefa, Ação e Resultado baseados estritamente na sua experiência real.
              </span>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {starQuestions.map((star, idx) => (
                  <StarItemCard key={idx}>
                    <div className="star-q">
                      Pergunta {idx + 1}: {star.question}
                    </div>

                    <div className="star-grid">
                      <div className="star-row">
                        <div className="star-badge">S</div>
                        <div className="star-text">
                          <strong>Situação:</strong> {star.situation}
                        </div>
                      </div>
                      <div className="star-row">
                        <div className="star-badge" style={{ background: "#2563eb" }}>T</div>
                        <div className="star-text">
                          <strong>Tarefa:</strong> {star.task}
                        </div>
                      </div>
                      <div className="star-row">
                        <div className="star-badge" style={{ background: "#059669" }}>A</div>
                        <div className="star-text">
                          <strong>Ação:</strong> {star.action}
                        </div>
                      </div>
                      <div className="star-row">
                        <div className="star-badge" style={{ background: "#7c3aed" }}>R</div>
                        <div className="star-text">
                          <strong>Resultado:</strong> {star.result}
                        </div>
                      </div>
                    </div>

                    {star.appliedDifferentials && star.appliedDifferentials.length > 0 && (
                      <div className="diff-tags">
                        {star.appliedDifferentials.map((diff, didx) => (
                          <span key={didx}>{diff}</span>
                        ))}
                      </div>
                    )}
                  </StarItemCard>
                ))}
              </div>
            </>
          )}

          {/* TAB 4: SABATINA TÉCNICA & AFIAÇÃO */}
          {activeTab === "sabatina" && (
            <>
              {/* 5. Sabatina Técnica */}
              <SectionTitle style={{ color: "#0f172a" }}>
                <Code2 size={18} color="#7c3aed" />
                5. Sabatina Técnica (Live Coding / Entrevista com Tech Lead)
              </SectionTitle>
              <span style={{ fontSize: "0.8rem", color: "#64748b", marginTop: -12 }}>
                Top 5 perguntas conceituais e arquiteturais mais prováveis com o resumo técnico e armadilhas a evitar.
              </span>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {sabatina.map((item, idx) => (
                  <SabatinaCard key={idx}>
                    <div className="q-title">
                      #{idx + 1}. {item.question}
                    </div>
                    <div className="answer-box">
                      <strong style={{ color: "#065f46" }}>Resposta Ideal / Resumo Teórico:</strong>
                      <br />
                      {item.idealAnswer}
                    </div>
                    <div className="red-flag">
                      <AlertTriangle size={14} />
                      <span><strong>Red Flag a evitar:</strong> {item.redFlagsToAvoid}</span>
                    </div>
                  </SabatinaCard>
                ))}
              </div>

              {/* 6. Afiação Máxima */}
              <CardBox $borderVariant="#fde047" style={{ marginTop: 12, background: "#fefce8" }}>
                <SectionTitle style={{ color: "#854d0e" }}>
                  <Zap size={18} color="#ca8a04" />
                  6. "Afiação Máxima" (Checklist de Última Hora - 30 min antes da chamada)
                </SectionTitle>

                <div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#713f12" }}>
                    Casos Reais para Ter na Ponta da Língua:
                  </span>
                  <ul style={{ margin: "4px 0 0 0", paddingLeft: 18, fontSize: "0.83rem", color: "#713f12" }}>
                    {sharpness.realCasesToRemember.map((c, idx) => (
                      <li key={idx} style={{ marginBottom: 3 }}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#713f12" }}>
                    Conceitos e Siglas Chave para Repassar Mentalmente:
                  </span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                    {sharpness.keyConceptsToReview.map((concept, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "#fef08a",
                          color: "#854d0e",
                          border: "1px solid #facc15",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: "0.74rem",
                          fontWeight: 600,
                        }}
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>

                <CalloutBox $color="#ca8a04" $bg="#fef9c3">
                  <strong style={{ color: "#854d0e" }}>Postura & Mindset:</strong> {sharpness.mindsetAndPostureTip}
                </CalloutBox>
              </CardBox>
            </>
          )}

          {/* TAB 5: PERGUNTAS AO ENTREVISTADOR & SALÁRIO */}
          {activeTab === "salario_perguntas" && (
            <>
              {/* 2. Análise Salarial & Negociação Estratégica */}
              <CardBox $borderVariant="#bbf7d0">
                <SectionTitle style={{ color: "#15803d" }}>
                  <DollarSign size={18} />
                  2. Análise Salarial & Negociação Estratégica
                </SectionTitle>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: 6, flex: 1 }}>
                    <span style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700 }}>CLT FIXO SUGERIDO:</span>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#15803d" }}>{salary.suggestedCLT}</div>
                  </div>
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px 14px", borderRadius: 6, flex: 1 }}>
                    <span style={{ fontSize: "0.75rem", color: "#1e40af", fontWeight: 700 }}>PJ / PRESTAÇÃO SUGERIDO:</span>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1d4ed8" }}>{salary.suggestedPJ}</div>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>
                    Justificativa Técnica de Precificação:
                  </span>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.83rem", color: "#475569", lineHeight: 1.5 }}>
                    {salary.pricingJustification}
                  </p>
                </div>

                <CalloutBox $color="#16a34a" $bg="#f0fdf4">
                  <strong style={{ color: "#15803d" }}>Gatilho de Flexibilidade (Frase Pronta):</strong>
                  <br />
                  "{salary.flexibilityTrigger}"
                </CalloutBox>
              </CardBox>

              {/* 7. Perguntas Inteligentes para o Candidato Fazer */}
              <CardBox $borderVariant="#e2e8f0" style={{ marginTop: 8 }}>
                <SectionTitle style={{ color: "#0f172a" }}>
                  <MessageSquare size={18} color="#2563eb" />
                  7. Perguntas Inteligentes para Fazer ao Entrevistador
                </SectionTitle>
                <span style={{ fontSize: "0.8rem", color: "#64748b", marginTop: -6 }}>
                  Faça estas 3 perguntas no final da chamada para demonstrar maturidade e interesse estratégico.
                </span>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                  <CalloutBox $color="#2563eb" $bg="#f8fafc">
                    <strong style={{ color: "#1e3a8a" }}>1. Sobre Arquitetura & Processos do Time:</strong>
                    <br />
                    "{smartQuestions.architectureAndProcesses}"
                  </CalloutBox>

                  <CalloutBox $color="#059669" $bg="#f8fafc">
                    <strong style={{ color: "#064e3b" }}>2. Sobre Critérios de Sucesso nos Primeiros 90 Dias:</strong>
                    <br />
                    "{smartQuestions.first90DaysSuccessCriteria}"
                  </CalloutBox>

                  <CalloutBox $color="#7c3aed" $bg="#f8fafc">
                    <strong style={{ color: "#4c1d95" }}>3. Sobre Visão de Crescimento & Autonomia:</strong>
                    <br />
                    "{smartQuestions.teamAutonomyAndGrowth}"
                  </CalloutBox>
                </div>
              </CardBox>
            </>
          )}
        </ModalContent>
      </ModalCard>
    </Overlay>
  );
};
