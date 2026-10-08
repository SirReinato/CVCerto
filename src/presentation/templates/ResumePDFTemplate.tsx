import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ResumeData } from "../../domain/entities/Resume";

// Cores e medidas extraídas exatamente do layout oficial
const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#222222",
    lineHeight: 1.45,
    backgroundColor: "#FFFFFF",
  },
  // Marcadores geométricos decorativos superiores
  topDecorationContainer: {
    position: "absolute",
    top: 24,
    left: 24,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  squareLarge: {
    width: 22,
    height: 22,
    backgroundColor: "#1E1E1E",
    marginRight: 6,
  },
  squareSmall: {
    width: 9,
    height: 9,
    backgroundColor: "#1E1E1E",
    marginTop: 13,
  },
  header: {
    alignItems: "center",
    marginBottom: 14,
    marginTop: 4,
  },
  fullName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3.5,
    textAlign: "center",
    marginBottom: 6,
    color: "#111111",
  },
  targetRole: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    letterSpacing: 1.2,
    textAlign: "center",
    color: "#333333",
    marginBottom: 8,
  },
  contactText: {
    fontSize: 8.5,
    textAlign: "center",
    color: "#444444",
    lineHeight: 1.4,
    letterSpacing: 0.5,
  },
  horizontalDivider: {
    borderBottomWidth: 1.2,
    borderBottomColor: "#1E1E1E",
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    color: "#111111",
    marginTop: 10,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  summaryText: {
    fontSize: 9.2,
    textAlign: "justify",
    lineHeight: 1.45,
    color: "#222222",
    marginBottom: 8,
  },
  jobBlock: {
    marginBottom: 8,
  },
  jobHeader: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    marginBottom: 3,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2.5,
    paddingLeft: 6,
  },
  bulletPoint: {
    width: 10,
    fontSize: 9.5,
    color: "#111111",
  },
  bulletContent: {
    flex: 1,
    fontSize: 9,
    color: "#222222",
    lineHeight: 1.35,
    textAlign: "justify",
  },
  skillCategoryTitle: {
    fontSize: 9.2,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    marginTop: 4,
    marginBottom: 2,
  },
  educationItem: {
    marginBottom: 6,
  },
  educationDegree: {
    fontSize: 9.2,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
  },
  educationInstitution: {
    fontSize: 9,
    color: "#444444",
    paddingLeft: 8,
  },
});

interface ResumePDFTemplateProps {
  data: ResumeData;
}

export const ResumePDFTemplate: React.FC<ResumePDFTemplateProps> = ({ data }) => {
  return (
    <Document title={`Curriculo_${data.personalInfo.fullName.replace(/\s+/g, "_")}`}>
      <Page size="A4" style={styles.page}>
        {/* Adorno Geométrico Superior */}
        <View style={styles.topDecorationContainer}>
          <View style={styles.squareLarge} />
          <View style={styles.squareSmall} />
        </View>

        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.fullName}>{data.personalInfo.fullName}</Text>
          <Text style={styles.targetRole}>{data.personalInfo.targetRoleOrTags}</Text>
          <Text style={styles.contactText}>
            {data.personalInfo.age ? `${data.personalInfo.age}\n` : ""}
            {data.personalInfo.city}
            {"\n"}
            {data.personalInfo.phone}
            {"\n"}
            {data.personalInfo.email}
          </Text>
        </View>

        <View style={styles.horizontalDivider} />

        {/* Resumo Profissional / Objetivo */}
        <View>
          <Text style={styles.sectionTitle}>RESUMO PROFISSIONAL</Text>
          <Text style={styles.summaryText}>{data.summary}</Text>
        </View>

        {/* Experiências Profissionais */}
        {data.experiences.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>EXPERIÊNCIAS PROFISSIONAIS</Text>
            {data.experiences.map((exp) => (
              <View key={exp.id} style={styles.jobBlock}>
                <Text style={styles.jobHeader}>
                  {exp.role.toUpperCase()} | {exp.company} - {exp.period}
                </Text>
                {exp.activities.map((act, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletContent}>{act}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Formação Acadêmica */}
        {data.education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>FORMAÇÃO ACADÊMICA</Text>
            {data.education.map((edu) => (
              <View key={edu.id} style={styles.educationItem}>
                <Text style={styles.educationDegree}>
                  • {edu.degree} – {edu.status}
                </Text>
                <Text style={styles.educationInstitution}>{edu.institution}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Certificações */}
        {data.certifications.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>CERTIFICAÇÕES</Text>
            {data.certifications
              .filter((c) => c.category === "principal")
              .map((cert) => (
                <View key={cert.id} style={styles.bulletRow}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletContent}>
                    {cert.name} - {cert.statusOrYear}
                  </Text>
                </View>
              ))}

            {data.certifications.some((c) => c.category === "complementar") && (
              <>
                <Text style={[styles.skillCategoryTitle, { marginTop: 6 }]}>
                  Certificações Complementares
                </Text>
                {data.certifications
                  .filter((c) => c.category === "complementar")
                  .map((cert) => (
                    <View key={cert.id} style={styles.bulletRow}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.bulletContent}>
                        {cert.name} – {cert.statusOrYear}
                      </Text>
                    </View>
                  ))}
              </>
            )}
          </View>
        )}

        {/* Conhecimentos Técnicos / Competências */}
        {data.skills.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>CONHECIMENTOS TÉCNICOS E OPERACIONAIS</Text>
            {data.skills.map((cat) => (
              <View key={cat.id} style={{ marginBottom: 4 }}>
                <Text style={styles.skillCategoryTitle}>{cat.categoryName}</Text>
                {cat.skills.map((skill, sIdx) => (
                  <View key={sIdx} style={styles.bulletRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletContent}>{skill}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Projetos e Portfólio (se houver) */}
        {data.projects && data.projects.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>PROJETOS E PORTFÓLIO</Text>
            {data.projects.map((proj) => (
              <View key={proj.id} style={{ marginBottom: 4 }}>
                <Text style={styles.skillCategoryTitle}>
                  • {proj.name} - {proj.stack}
                </Text>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletPoint}>◦</Text>
                  <Text style={styles.bulletContent}>{proj.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Idiomas */}
        {data.languages && data.languages.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>IDIOMAS</Text>
            {data.languages.map((lang, lIdx) => (
              <Text key={lIdx} style={{ fontSize: 9, color: "#222222", paddingLeft: 6 }}>
                {lang}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};
