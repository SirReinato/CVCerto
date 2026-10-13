import React, { useState } from "react";
import styled from "styled-components";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import type { ResumeData } from "../../domain/entities/Resume";

interface ResumeCanvasProps {
  data: ResumeData;
  visibleSections?: {
    summary?: boolean;
    experiences?: boolean;
    education?: boolean;
    certifications?: boolean;
    skills?: boolean;
    projects?: boolean;
    languages?: boolean;
  };
}

const CanvasViewport = styled.div`
  width: 100%;
  min-height: calc(100vh - 180px);
  background: radial-gradient(circle at 50% 50%, #f1f3f7 0%, #e2e6ee 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 40px 20px 80px 20px;
  overflow-x: auto;

  @media print {
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    min-height: auto !important;
  }
`;

const FloatingToolbar = styled.div`
  position: sticky;
  top: 16px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 6px 14px;
  border-radius: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(220, 225, 235, 0.8);
  margin-bottom: 24px;

  @media print {
    display: none !important;
  }
`;

const ToolButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: #333333;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: #f0f2f6;
    color: #111111;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const ZoomLabel = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: #222222;
  min-width: 44px;
  text-align: center;
  user-select: none;
`;

const Divider = styled.div`
  width: 1px;
  height: 18px;
  background-color: #e0e4ec;
  margin: 0 4px;
`;

const PageIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #555555;
  padding: 0 4px;
`;

const SheetsStack = styled.div<{ $scale: number }>`
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;
  transform: scale(${(props) => props.$scale});
  transform-origin: top center;
  transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);

  @media print {
    transform: none !important;
    gap: 0 !important;
  }
`;

/* Folha A4 Rigorosa: 210mm x 297mm (794px x 1123px a 96DPI) */
const PageSheet = styled.div`
  width: 794px;
  min-height: 1123px;
  max-height: 1123px;
  background-color: #ffffff;
  color: #222222;
  padding: 72px 48px 48px 48px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(220, 225, 235, 0.8);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 0.84rem;
  line-height: 1.45;

  @media print {
    width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    box-shadow: none !important;
    border: none !important;
    margin: 0 !important;
    padding: 20mm 15mm !important;
    page-break-after: always !important;
    break-after: page !important;
  }
`;

/* Decoração Geométrica Oficial: Topo */
const TopDecoration = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 58px;
  pointer-events: none;

  .grey-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 26px;
    background-color: #3a3a3a;
  }

  .black-block-1 {
    position: absolute;
    top: 0;
    left: 0;
    width: 54px;
    height: 26px;
    background-color: #0a0a0a;
  }

  .black-block-2 {
    position: absolute;
    top: 18px;
    left: 58px;
    width: 22px;
    height: 16px;
    background-color: #0a0a0a;
  }

  .black-block-3 {
    position: absolute;
    top: 32px;
    left: 16px;
    width: 22px;
    height: 11px;
    background-color: #0a0a0a;
  }

  .black-block-4 {
    position: absolute;
    top: 45px;
    left: 44px;
    width: 12px;
    height: 11px;
    background-color: #0a0a0a;
  }
`;

/* Decoração Geométrica Oficial: Rodapé */
const BottomDecoration = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 28px;
  pointer-events: none;

  .black-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 20px;
    background-color: #0a0a0a;
  }

  .grey-block-1 {
    position: absolute;
    bottom: 16px;
    right: 76px;
    width: 14px;
    height: 9px;
    background-color: #4e4e4e;
  }

  .grey-block-2 {
    position: absolute;
    bottom: 12px;
    right: 44px;
    width: 18px;
    height: 13px;
    background-color: #4e4e4e;
  }

  .grey-block-3 {
    position: absolute;
    bottom: 3px;
    right: 82px;
    width: 22px;
    height: 15px;
    background-color: #363636;
  }
`;

const PageBadge = styled.div`
  position: absolute;
  top: -24px;
  right: 0;
  font-size: 0.72rem;
  font-weight: 700;
  color: #777777;
  letter-spacing: 0.5px;
  text-transform: uppercase;

  @media print {
    display: none;
  }
`;

/* Elementos Tipográficos do Currículo */
const ResumeHeader = styled.header`
  text-align: center;
  margin-bottom: 10px;
`;

const FullName = styled.h1`
  font-size: 1.35rem;
  font-weight: 700;
  color: #111111;
  margin: 0 0 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TargetRole = styled.p`
  font-size: 0.76rem;
  letter-spacing: 1px;
  color: #333333;
  margin: 0 0 6px 0;
  font-weight: 700;
  text-transform: uppercase;
`;

const ContactInfo = styled.div`
  font-size: 0.74rem;
  color: #444444;
  line-height: 1.4;
  letter-spacing: 0.3px;
`;

const SectionDivider = styled.hr`
  border: 0;
  border-bottom: 1.5px solid #1e1e1e;
  margin: 8px 0 12px 0;
`;

const Section = styled.section`
  margin-bottom: 12px;
`;

const SectionTitle = styled.h2`
  font-size: 0.85rem;
  letter-spacing: 1.2px;
  font-weight: 700;
  color: #111111;
  text-transform: uppercase;
  margin: 0 0 5px 0;
`;

const SummaryText = styled.p`
  font-size: 0.8rem;
  text-align: justify;
  line-height: 1.4;
  color: #222222;
  margin: 0;
`;

const JobItem = styled.div`
  margin-bottom: 8px;

  h3 {
    font-size: 0.82rem;
    font-weight: 700;
    color: #111111;
    margin: 0 0 3px 0;
    text-transform: uppercase;
  }

  ul {
    margin: 0;
    padding-left: 0;
    list-style-type: none;

    li {
      font-size: 0.78rem;
      color: #222222;
      line-height: 1.32;
      margin-bottom: 2.5px;
      text-align: justify;
      position: relative;
      padding-left: 12px;

      &::before {
        content: "•";
        position: absolute;
        left: 0;
        color: #111111;
        font-weight: 700;
      }
    }
  }
`;

const SubCategoryTitle = styled.h4`
  font-size: 0.8rem;
  font-weight: 700;
  color: #111111;
  margin: 5px 0 2px 0;
`;

const EducationItem = styled.div`
  margin-bottom: 6px;

  .degree {
    font-size: 0.8rem;
    font-weight: 700;
    color: #111111;
  }

  .institution {
    font-size: 0.76rem;
    color: #444444;
    padding-left: 12px;
  }
`;

const ProjectItem = styled.div`
  margin-bottom: 6px;

  .project-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: #111111;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .project-desc {
    font-size: 0.78rem;
    color: #222222;
    padding-left: 12px;
    margin-top: 1px;
    line-height: 1.3;
    text-align: justify;
    position: relative;

    &::before {
      content: "-";
      position: absolute;
      left: 2px;
      font-weight: 700;
    }
  }
`;

export const ResumeCanvas: React.FC<ResumeCanvasProps> = ({
  data,
  visibleSections = {
    summary: true,
    experiences: true,
    education: true,
    certifications: true,
    skills: true,
    projects: true,
    languages: true,
  },
}) => {
  const [scale, setScale] = useState<number>(0.92);
  const [activePageIndex, setActivePageIndex] = useState<number>(1);

  const handleZoomIn = () => setScale((prev) => Math.min(1.4, Number((prev + 0.1).toFixed(2))));
  const handleZoomOut = () => setScale((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(2))));
  const handleResetZoom = () => setScale(0.92);
  const handleFitScreen = () => setScale(0.75);

  // Divide as seções entre Página 1 e Página 2 com precisão para replicar o corte exato do PDF A4
  return (
    <CanvasViewport>
      <FloatingToolbar>
        <ToolButton onClick={handleZoomOut} title="Diminuir Zoom (-10%)">
          <ZoomOut size={15} />
        </ToolButton>
        <ZoomLabel>{Math.round(scale * 100)}%</ZoomLabel>
        <ToolButton onClick={handleZoomIn} title="Aumentar Zoom (+10%)">
          <ZoomIn size={15} />
        </ToolButton>

        <ToolButton onClick={handleResetZoom} title="Tamanho Padrão (100%)">
          <RotateCcw size={14} />
        </ToolButton>
        <ToolButton onClick={handleFitScreen} title="Ajustar à Tela">
          <Maximize2 size={14} />
        </ToolButton>

        <Divider />

        <ToolButton
          disabled={activePageIndex === 1}
          onClick={() => setActivePageIndex(1)}
          title="Página Anterior"
        >
          <ChevronLeft size={16} />
        </ToolButton>
        <PageIndicator>
          <FileText size={14} />
          <span>Folhas A4: 1 & 2</span>
        </PageIndicator>
        <ToolButton
          disabled={activePageIndex === 2}
          onClick={() => setActivePageIndex(2)}
          title="Próxima Página"
        >
          <ChevronRight size={16} />
        </ToolButton>
      </FloatingToolbar>

      <SheetsStack $scale={scale}>
        {/* PÁGINA 1 */}
        <PageSheet id="resume-page-1">
          <PageBadge>Página 1 de 2 • Padrão A4 Oficial</PageBadge>
          <TopDecoration>
            <div className="grey-bar" />
            <div className="black-block-1" />
            <div className="black-block-2" />
            <div className="black-block-3" />
            <div className="black-block-4" />
          </TopDecoration>

          <ResumeHeader>
            <FullName>{data.personalInfo.fullName}</FullName>
            <TargetRole>{data.personalInfo.targetRoleOrTags}</TargetRole>
            <ContactInfo>
              SAMAMBAIA, DF. | (61) 9935-3163 | RFRANCA.LIMA@OUTLOOK.COM | 28 ANOS
            </ContactInfo>
            <SectionDivider />
          </ResumeHeader>

          {/* Resumo Profissional */}
          {visibleSections.summary !== false && (
            <Section>
              <SectionTitle>RESUMO PROFISSIONAL</SectionTitle>
              <SummaryText>{data.summary}</SummaryText>
            </Section>
          )}

          {/* Experiências Profissionais (Página 1 acomoda perfeitamente Brasfort e Truly) */}
          {visibleSections.experiences !== false && data.experiences.length > 0 && (
            <Section>
              <SectionTitle>EXPERIÊNCIAS PROFISSIONAIS</SectionTitle>
              {data.experiences.slice(0, 2).map((exp) => (
                <JobItem key={exp.id}>
                  <h3>
                    {exp.role.toUpperCase()} | {exp.company} - {exp.period}
                  </h3>
                  <ul>
                    {exp.activities.map((act, idx) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>
                </JobItem>
              ))}
            </Section>
          )}

          <BottomDecoration>
            <div className="black-bar" />
            <div className="grey-block-1" />
            <div className="grey-block-2" />
            <div className="grey-block-3" />
          </BottomDecoration>
        </PageSheet>

        {/* PÁGINA 2 */}
        <PageSheet id="resume-page-2">
          <PageBadge>Página 2 de 2 • Padrão A4 Oficial</PageBadge>
          <TopDecoration>
            <div className="grey-bar" />
            <div className="black-block-1" />
            <div className="black-block-2" />
            <div className="black-block-3" />
            <div className="black-block-4" />
          </TopDecoration>

          {/* Continuação das Experiências: Forças Armadas */}
          {visibleSections.experiences !== false && data.experiences.length > 2 && (
            <Section>
              <JobItem>
                <h3>
                  {data.experiences[2].role.toUpperCase()} | {data.experiences[2].company} - {data.experiences[2].period}
                </h3>
                <ul>
                  {data.experiences[2].activities.map((act, idx) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </JobItem>
            </Section>
          )}

          {/* Formação Acadêmica */}
          {visibleSections.education !== false && data.education.length > 0 && (
            <Section>
              <SectionTitle>FORMAÇÃO ACADÊMICA</SectionTitle>
              {data.education.map((edu) => (
                <EducationItem key={edu.id}>
                  <div className="degree">
                    • {edu.degree} – {edu.status}
                  </div>
                  <div className="institution">{edu.institution}</div>
                </EducationItem>
              ))}
            </Section>
          )}

          {/* Certificações */}
          {visibleSections.certifications !== false && data.certifications.length > 0 && (
            <Section>
              <SectionTitle>CERTIFICAÇÕES</SectionTitle>
              <JobItem>
                <ul>
                  {data.certifications
                    .filter((c) => c.category === "principal")
                    .map((cert) => (
                      <li key={cert.id}>
                        <strong>{cert.name}</strong> - {cert.statusOrYear}
                      </li>
                    ))}
                </ul>
              </JobItem>

              {data.certifications.some((c) => c.category === "complementar") && (
                <div style={{ marginTop: 4 }}>
                  <SubCategoryTitle>Certificações Complementares</SubCategoryTitle>
                  <JobItem>
                    <ul>
                      {data.certifications
                        .filter((c) => c.category === "complementar")
                        .map((cert) => (
                          <li key={cert.id}>
                            {cert.name} – {cert.statusOrYear}
                          </li>
                        ))}
                    </ul>
                  </JobItem>
                </div>
              )}
            </Section>
          )}

          {/* Conhecimentos Técnicos e Operacionais */}
          {visibleSections.skills !== false && data.skills.length > 0 && (
            <Section>
              <SectionTitle>CONHECIMENTOS TÉCNICOS E OPERACIONAIS</SectionTitle>
              {data.skills.map((cat) => (
                <div key={cat.id} style={{ marginBottom: 6 }}>
                  <SubCategoryTitle>{cat.categoryName}</SubCategoryTitle>
                  <JobItem>
                    <ul>
                      {cat.skills.map((skill, sIdx) => (
                        <li key={sIdx}>{skill}</li>
                      ))}
                    </ul>
                  </JobItem>
                </div>
              ))}
            </Section>
          )}

          {/* Projetos e Portfólio */}
          {visibleSections.projects !== false && data.projects && data.projects.length > 0 && (
            <Section>
              <SectionTitle>PROJETOS E PORTFÓLIO</SectionTitle>
              {data.projects.map((proj) => {
                const desc = proj.description.trim().startsWith("-")
                  ? proj.description.trim().substring(1).trim()
                  : proj.description.trim();

                return (
                  <ProjectItem key={proj.id}>
                    <div className="project-title">
                      <span>• {proj.name} - {proj.stack}</span>
                      {proj.link && (
                        <a
                          href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: "0.74rem",
                            color: "#1e1e1e",
                            fontWeight: 600,
                            textDecoration: "underline",
                          }}
                        >
                          [Ver Projeto ↗]
                        </a>
                      )}
                    </div>
                    <div className="project-desc">{desc}</div>
                  </ProjectItem>
                );
              })}
            </Section>
          )}

          {/* Idiomas */}
          {visibleSections.languages !== false && data.languages && data.languages.length > 0 && (
            <Section>
              <SectionTitle>IDIOMAS</SectionTitle>
              <p style={{ fontSize: "0.78rem", margin: 0, paddingLeft: 6 }}>
                {data.languages.join(" | ")}
              </p>
            </Section>
          )}

          <BottomDecoration>
            <div className="black-bar" />
            <div className="grey-block-1" />
            <div className="grey-block-2" />
            <div className="grey-block-3" />
          </BottomDecoration>
        </PageSheet>
      </SheetsStack>
    </CanvasViewport>
  );
};
