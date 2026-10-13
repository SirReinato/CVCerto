import React from "react";
import styled from "styled-components";
import type { ResumeData } from "../../domain/entities/Resume";

interface ResumeWebPreviewProps {
  data: ResumeData;
}

const Sheet = styled.div`
  width: 100%;
  max-width: 800px;
  background-color: #ffffff;
  color: #222222;
  padding: 56px 48px 48px 48px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 0.85rem;
  line-height: 1.45;
  position: relative;
  margin: 0 auto;
  overflow: hidden;

  @media (max-width: 600px) {
    padding: 48px 16px 36px 16px;
    font-size: 0.8rem;
  }
`;

/* 1. Topo Geométrico */
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

/* 2. Rodapé Geométrico */
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

const Header = styled.header`
  text-align: center;
  margin-bottom: 12px;
  margin-top: 8px;
`;

const NameBanner = styled.div`
  background-color: #f2ede4;
  padding: 8px 16px;
  margin-bottom: 8px;
  border-radius: 2px;
`;

const FullName = styled.h1`
  font-size: 1.35rem;
  letter-spacing: 4px;
  font-weight: 700;
  color: #111111;
  margin: 0;
  text-transform: uppercase;
`;

const TargetRole = styled.p`
  font-size: 0.78rem;
  letter-spacing: 1.2px;
  color: #333333;
  margin: 0 0 6px 0;
  font-weight: 700;
  text-transform: uppercase;
`;

const ContactInfo = styled.div`
  font-size: 0.75rem;
  color: #444444;
  line-height: 1.4;
  letter-spacing: 0.4px;
`;

const Divider = styled.hr`
  border: 0;
  border-bottom: 1.5px solid #1e1e1e;
  margin: 10px 0 14px 0;
`;

const Section = styled.section`
  margin-bottom: 14px;
`;

const SectionTitle = styled.h2`
  font-size: 0.88rem;
  letter-spacing: 1.5px;
  font-weight: 700;
  color: #111111;
  text-transform: uppercase;
  margin: 0 0 6px 0;
`;

const Summary = styled.p`
  font-size: 0.82rem;
  text-align: justify;
  line-height: 1.45;
  color: #222222;
  margin: 0;
`;

const JobItem = styled.div`
  margin-bottom: 10px;

  h3 {
    font-size: 0.85rem;
    font-weight: 700;
    color: #111111;
    margin: 0 0 4px 0;
    text-transform: uppercase;
  }

  ul {
    margin: 0;
    padding-left: 18px;
    list-style-type: none;

    li {
      font-size: 0.8rem;
      color: #222222;
      line-height: 1.35;
      margin-bottom: 3px;
      text-align: justify;
      position: relative;
      padding-left: 14px;

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

const EducationItem = styled.div`
  margin-bottom: 8px;

  .degree {
    font-size: 0.83rem;
    font-weight: 700;
    color: #111111;
  }

  .institution {
    font-size: 0.78rem;
    color: #444444;
    padding-left: 14px;
  }
`;

const SubCategoryTitle = styled.h4`
  font-size: 0.82rem;
  font-weight: 700;
  color: #111111;
  margin: 6px 0 3px 0;
`;

const SkillCategory = styled.div`
  margin-bottom: 8px;

  ul {
    margin: 0;
    padding-left: 18px;
    list-style-type: none;

    li {
      font-size: 0.8rem;
      color: #222222;
      line-height: 1.35;
      margin-bottom: 2px;
      position: relative;
      padding-left: 14px;

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

const ProjectItem = styled.div`
  margin-bottom: 8px;

  .project-title {
    font-size: 0.83rem;
    font-weight: 700;
    color: #111111;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .project-desc {
    font-size: 0.8rem;
    color: #222222;
    line-height: 1.35;
    padding-left: 14px;
    text-align: justify;
    position: relative;

    &::before {
      content: "-";
      position: absolute;
      left: 2px;
      font-weight: 700;
      color: #111111;
    }
  }
`;

export const ResumeWebPreview: React.FC<ResumeWebPreviewProps> = ({ data }) => {
  return (
    <Sheet>
      {/* 1. Topo Geométrico */}
      <TopDecoration>
        <div className="grey-bar" />
        <div className="black-block-1" />
        <div className="black-block-2" />
        <div className="black-block-3" />
        <div className="black-block-4" />
      </TopDecoration>

      {/* 2. Rodapé Geométrico */}
      <BottomDecoration>
        <div className="black-bar" />
        <div className="grey-block-1" />
        <div className="grey-block-2" />
        <div className="grey-block-3" />
      </BottomDecoration>

      {/* 3. Cabeçalho */}
      <Header>
        <NameBanner>
          <FullName>{data.personalInfo.fullName.toUpperCase()}</FullName>
        </NameBanner>
        <TargetRole>{data.personalInfo.targetRoleOrTags.toUpperCase()}</TargetRole>
        <ContactInfo>
          {data.personalInfo.age && <div>{data.personalInfo.age.toUpperCase()}</div>}
          <div>{data.personalInfo.city}</div>
          <div>{data.personalInfo.phone}</div>
          <div>{data.personalInfo.email}</div>
        </ContactInfo>
      </Header>

      <Divider />

      {/* 4. Resumo Profissional */}
      <Section>
        <SectionTitle>RESUMO PROFISSIONAL</SectionTitle>
        <Summary>{data.summary}</Summary>
      </Section>

      {/* 5. Experiências Profissionais */}
      {data.experiences.length > 0 && (
        <Section>
          <SectionTitle>EXPERIÊNCIAS PROFISSIONAIS</SectionTitle>
          {data.experiences.map((exp) => (
            <JobItem key={exp.id}>
              <h3>
                {exp.role.toUpperCase()} | {exp.company} - {exp.period}
              </h3>
              <ul>
                {exp.activities.map((act, index) => (
                  <li key={index}>{act}</li>
                ))}
              </ul>
            </JobItem>
          ))}
        </Section>
      )}

      {/* 6. Formação Acadêmica */}
      {data.education.length > 0 && (
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

      {/* 7. Certificações */}
      {data.certifications.length > 0 && (
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
            <div style={{ marginTop: 6 }}>
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

      {/* 8. Conhecimentos Técnicos e Operacionais */}
      {data.skills.length > 0 && (
        <Section>
          <SectionTitle>CONHECIMENTOS TÉCNICOS E OPERACIONAIS</SectionTitle>
          {data.skills.map((cat) => (
            <SkillCategory key={cat.id}>
              <SubCategoryTitle>{cat.categoryName}</SubCategoryTitle>
              <ul>
                {cat.skills.map((skill, sIdx) => (
                  <li key={sIdx}>{skill}</li>
                ))}
              </ul>
            </SkillCategory>
          ))}
        </Section>
      )}

      {/* 9. Projetos e Portfólio */}
      {data.projects && data.projects.length > 0 && (
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
                        fontSize: "0.75rem",
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

      {/* 10. Idiomas */}
      {data.languages && data.languages.length > 0 && (
        <Section>
          <SectionTitle>IDIOMAS</SectionTitle>
          <p style={{ fontSize: "0.8rem", margin: 0, paddingLeft: 6 }}>
            {data.languages.join(" | ")}
          </p>
        </Section>
      )}
    </Sheet>
  );
};
