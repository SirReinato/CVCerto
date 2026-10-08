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
  padding: 40px 48px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 0.85rem;
  line-height: 1.45;
  position: relative;
  margin: 0 auto;

  @media (max-width: 600px) {
    padding: 24px 16px;
    font-size: 0.8rem;
  }
`;

const TopDecoration = styled.div`
  position: absolute;
  top: 28px;
  left: 28px;
  display: flex;
  gap: 5px;
  align-items: flex-start;

  .large {
    width: 22px;
    height: 22px;
    background-color: #1e1e1e;
  }

  .small {
    width: 9px;
    height: 9px;
    background-color: #1e1e1e;
    margin-top: 13px;
  }
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 14px;
  margin-top: 4px;
`;

const FullName = styled.h1`
  font-size: 1.35rem;
  letter-spacing: 4px;
  font-weight: 700;
  color: #111111;
  margin: 0 0 6px 0;
  text-transform: uppercase;
`;

const TargetRole = styled.p`
  font-size: 0.75rem;
  letter-spacing: 1.2px;
  color: #333333;
  margin: 0 0 8px 0;
  font-weight: 500;
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
  margin: 12px 0 16px 0;
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
  margin: 0 0 8px 0;
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
  }

  ul {
    margin: 0;
    padding-left: 18px;
    list-style-type: disc;

    li {
      font-size: 0.8rem;
      color: #222222;
      line-height: 1.35;
      margin-bottom: 3px;
      text-align: justify;
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
    font-size: 0.8rem;
    color: #444444;
    padding-left: 12px;
    margin-top: 2px;
  }
`;

const SkillCategory = styled.div`
  margin-bottom: 6px;

  h4 {
    font-size: 0.82rem;
    font-weight: 700;
    color: #111111;
    margin: 0 0 2px 0;
  }

  ul {
    margin: 0;
    padding-left: 18px;
    list-style-type: disc;

    li {
      font-size: 0.8rem;
      color: #222222;
      margin-bottom: 2px;
    }
  }
`;

export const ResumeWebPreview: React.FC<ResumeWebPreviewProps> = ({ data }) => {
  return (
    <Sheet>
      <TopDecoration>
        <div className="large" />
        <div className="small" />
      </TopDecoration>

      <Header>
        <FullName>{data.personalInfo.fullName}</FullName>
        <TargetRole>{data.personalInfo.targetRoleOrTags}</TargetRole>
        <ContactInfo>
          {data.personalInfo.age && <div>{data.personalInfo.age}</div>}
          <div>{data.personalInfo.city}</div>
          <div>{data.personalInfo.phone}</div>
          <div>{data.personalInfo.email}</div>
        </ContactInfo>
      </Header>

      <Divider />

      <Section>
        <SectionTitle>RESUMO PROFISSIONAL</SectionTitle>
        <Summary>{data.summary}</Summary>
      </Section>

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
            <SkillCategory>
              <h4 style={{ marginTop: 6 }}>Certificações Complementares</h4>
              <ul>
                {data.certifications
                  .filter((c) => c.category === "complementar")
                  .map((cert) => (
                    <li key={cert.id}>
                      {cert.name} – {cert.statusOrYear}
                    </li>
                  ))}
              </ul>
            </SkillCategory>
          )}
        </Section>
      )}

      {data.skills.length > 0 && (
        <Section>
          <SectionTitle>CONHECIMENTOS TÉCNICOS E OPERACIONAIS</SectionTitle>
          {data.skills.map((cat) => (
            <SkillCategory key={cat.id}>
              <h4>{cat.categoryName}</h4>
              <ul>
                {cat.skills.map((skill, sIdx) => (
                  <li key={sIdx}>{skill}</li>
                ))}
              </ul>
            </SkillCategory>
          ))}
        </Section>
      )}

      {data.projects && data.projects.length > 0 && (
        <Section>
          <SectionTitle>PROJETOS E PORTFÓLIO</SectionTitle>
          {data.projects.map((proj) => (
            <SkillCategory key={proj.id}>
              <h4>
                • {proj.name} - {proj.stack}
              </h4>
              <ul style={{ listStyleType: "circle" }}>
                <li>{proj.description}</li>
              </ul>
            </SkillCategory>
          ))}
        </Section>
      )}

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
