import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ResumeData } from "../../domain/entities/Resume";

// Cores e medidas extraídas com fidelidade geométrica extrema
const styles = StyleSheet.create({
  page: {
    // 72pt de margem superior para NUNCA colidir com o topo geométrico fixo de 56pt
    paddingTop: 72,
    // 38pt de margem inferior para NUNCA encostar no rodapé geométrico fixo de 20pt
    paddingBottom: 38,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#222222",
    lineHeight: 1.45,
    backgroundColor: "#FFFFFF",
  },

  // 1. TOPO GEOMÉTRICO FIXO (Faixa cinza contínua + 4 retângulos pretos)
  topDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 58,
  },
  topGreyBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: "#3A3A3A",
  },
  topBlackBlock1: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 54,
    height: 26,
    backgroundColor: "#0A0A0A",
  },
  topBlackBlock2: {
    position: "absolute",
    top: 18,
    left: 58,
    width: 22,
    height: 16,
    backgroundColor: "#0A0A0A",
  },
  topBlackBlock3: {
    position: "absolute",
    top: 32,
    left: 16,
    width: 22,
    height: 11,
    backgroundColor: "#0A0A0A",
  },
  topBlackBlock4: {
    position: "absolute",
    top: 45,
    left: 44,
    width: 12,
    height: 11,
    backgroundColor: "#0A0A0A",
  },

  // 2. RODAPÉ GEOMÉTRICO FIXO (Faixa preta contínua + 3 retângulos cinzas no canto direito)
  bottomDecoration: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
  },
  bottomBlackBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: "#0A0A0A",
  },
  bottomGreyBlock1: {
    position: "absolute",
    bottom: 16,
    right: 76,
    width: 14,
    height: 9,
    backgroundColor: "#4E4E4E",
  },
  bottomGreyBlock2: {
    position: "absolute",
    bottom: 12,
    right: 44,
    width: 18,
    height: 13,
    backgroundColor: "#4E4E4E",
  },
  bottomGreyBlock3: {
    position: "absolute",
    bottom: 3,
    right: 82,
    width: 22,
    height: 15,
    backgroundColor: "#363636",
  },

  // 3. CABEÇALHO DO CANDIDATO
  header: {
    alignItems: "center",
    marginBottom: 10,
    marginTop: 0,
  },
  fullName: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: "#111111",
    marginBottom: 4,
  },
  targetRole: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textAlign: "center",
    color: "#333333",
    marginBottom: 6,
    textTransform: "uppercase",
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
    marginVertical: 8,
  },

  // 4. SEÇÕES E TEXTOS
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    color: "#111111",
    marginTop: 8,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  summaryText: {
    fontSize: 9.2,
    textAlign: "justify",
    lineHeight: 1.45,
    color: "#222222",
    marginBottom: 6,
  },

  // 5. BLOCOS COM CONTROLE DE QUEBRA DE PÁGINA (wrap={false})
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

  // Subcategorias (sem bullet, em destaque Title Case)
  subCategoryTitle: {
    fontSize: 9.2,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    marginTop: 4,
    marginBottom: 2,
  },

  // Formação acadêmica
  educationBlock: {
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

  // Projetos
  projectBlock: {
    marginBottom: 6,
  },
  projectHeader: {
    fontSize: 9.2,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
  },
  projectDescriptionRow: {
    flexDirection: "row",
    paddingLeft: 10,
    marginTop: 1.5,
  },
  dashPoint: {
    width: 10,
    fontSize: 9,
    color: "#111111",
    fontFamily: "Helvetica-Bold",
  },
  projectDescriptionText: {
    flex: 1,
    fontSize: 9,
    color: "#222222",
    lineHeight: 1.35,
    textAlign: "justify",
  },
});

export type ResumeTemplateType = "geometric" | "moderno" | "minimalista";

interface ResumePDFTemplateProps {
  data: ResumeData;
  template?: ResumeTemplateType;
}

export const ResumePDFTemplate: React.FC<ResumePDFTemplateProps> = ({
  data,
  template = "geometric",
}) => {
  const dividerStyle =
    template === "moderno"
      ? [styles.horizontalDivider, { borderBottomColor: "#2563EB", borderBottomWidth: 1.5 }]
      : template === "minimalista"
      ? [styles.horizontalDivider, { borderBottomColor: "#CBD5E1", borderBottomWidth: 1 }]
      : styles.horizontalDivider;

  const sectionTitleStyle =
    template === "moderno"
      ? [styles.sectionTitle, { color: "#1E3A8A", borderBottomWidth: 1, borderBottomColor: "#DBEAFE", paddingBottom: 2 }]
      : template === "minimalista"
      ? [styles.sectionTitle, { color: "#0F172A", letterSpacing: 2 }]
      : styles.sectionTitle;

  return (
    <Document title="cv-renato-de-franca-lima">
      <Page size="A4" style={styles.page}>
        {/* 1. TOPO FIXO POR TEMPLATE (Repete em todas as páginas) */}
        {template === "geometric" && (
          <View style={styles.topDecoration} fixed>
            <View style={styles.topGreyBar} />
            <View style={styles.topBlackBlock1} />
            <View style={styles.topBlackBlock2} />
            <View style={styles.topBlackBlock3} />
            <View style={styles.topBlackBlock4} />
          </View>
        )}

        {template === "moderno" && (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 26, backgroundColor: "#0F172A" }} fixed>
            <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "#2563EB" }} />
          </View>
        )}

        {template === "minimalista" && (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: "#E2E8F0" }} fixed />
        )}

        {/* 2. RODAPÉ FIXO POR TEMPLATE (Repete em todas as páginas) */}
        {template === "geometric" && (
          <View style={styles.bottomDecoration} fixed>
            <View style={styles.bottomBlackBar} />
            <View style={styles.bottomGreyBlock1} />
            <View style={styles.bottomGreyBlock2} />
            <View style={styles.bottomGreyBlock3} />
          </View>
        )}

        {template === "moderno" && (
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 18, backgroundColor: "#0F172A", justifyContent: "center", alignItems: "center" }} fixed>
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, backgroundColor: "#2563EB" }} />
            <Text style={{ fontSize: 7, color: "#94A3B8" }}>
              Renato de França Lima • Currículo Profissional N2/N3 • Padrão A4 Oficial
            </Text>
          </View>
        )}

        {template === "minimalista" && (
          <View style={{ position: "absolute", bottom: 12, left: 0, right: 0, alignItems: "center" }} fixed>
            <Text style={{ fontSize: 7.5, color: "#94A3B8" }} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        )}

        {/* 3. CABEÇALHO */}
        <View style={styles.header}>
          <Text style={styles.fullName}>
            {data.personalInfo.fullName.toUpperCase()}
          </Text>
          <Text style={styles.targetRole}>
            {data.personalInfo.targetRoleOrTags.toUpperCase()}
          </Text>
          <Text style={styles.contactText}>
            {data.personalInfo.age ? `${data.personalInfo.age.toUpperCase()}\n` : ""}
            {data.personalInfo.city}
            {"\n"}
            {data.personalInfo.phone}
            {"\n"}
            {data.personalInfo.email}
          </Text>
        </View>

        <View style={dividerStyle} />

        {/* 4. RESUMO PROFISSIONAL (Indivisível) */}
        <View wrap={false}>
          <Text style={sectionTitleStyle}>RESUMO PROFISSIONAL</Text>
          <Text style={styles.summaryText}>{data.summary}</Text>
        </View>

        {/* 5. EXPERIÊNCIAS PROFISSIONAIS */}
        {data.experiences.length > 0 && (
          <View>
            {/* TÍTULO + PRIMEIRA EXPERIÊNCIA AGRUPADOS COM wrap={false}: IMPOSSÍVEL O TÍTULO FICAR ÓRFÃO! */}
            <View wrap={false}>
              <Text style={sectionTitleStyle}>EXPERIÊNCIAS PROFISSIONAIS</Text>
              <View style={styles.jobBlock}>
                <Text style={styles.jobHeader}>
                  {data.experiences[0].role.toUpperCase()} | {data.experiences[0].company} - {data.experiences[0].period}
                </Text>
                {data.experiences[0].activities.map((act, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletContent}>{act}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Demais experiências: cada uma inteira com wrap={false} (nunca corta ao meio) */}
            {data.experiences.slice(1).map((exp) => (
              <View key={exp.id} style={styles.jobBlock} wrap={false}>
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

        {/* 6. FORMAÇÃO ACADÊMICA (Seção inteira indivisível com wrap={false}: nunca separa título nem curso da instituição) */}
        {data.education.length > 0 && (
          <View wrap={false}>
            <Text style={sectionTitleStyle}>FORMAÇÃO ACADÊMICA</Text>
            {data.education.map((edu) => (
              <View key={edu.id} style={styles.educationBlock}>
                <Text style={styles.educationDegree}>
                  • {edu.degree} – {edu.status}
                </Text>
                <Text style={styles.educationInstitution}>{edu.institution}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 7. CERTIFICAÇÕES */}
        {data.certifications.length > 0 && (
          <View>
            {/* Título + Certificações Principais agrupados com wrap={false} */}
            <View wrap={false}>
              <Text style={sectionTitleStyle}>CERTIFICAÇÕES</Text>
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
            </View>

            {/* Certificações Complementares agrupadas com wrap={false} */}
            {data.certifications.some((c) => c.category === "complementar") && (
              <View wrap={false} style={{ marginTop: 4 }}>
                <Text style={styles.subCategoryTitle}>
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
              </View>
            )}
          </View>
        )}

        {/* 8. CONHECIMENTOS TÉCNICOS E OPERACIONAIS */}
        {data.skills.length > 0 && (
          <View>
            {/* TÍTULO + PRIMEIRA CATEGORIA AGRUPADOS COM wrap={false}: IMPOSSÍVEL O TÍTULO FICAR ÓRFÃO! */}
            <View wrap={false}>
              <Text style={sectionTitleStyle}>CONHECIMENTOS TÉCNICOS E OPERACIONAIS</Text>
              <View style={{ marginBottom: 4 }}>
                <Text style={styles.subCategoryTitle}>{data.skills[0].categoryName}</Text>
                {data.skills[0].skills.map((skill, sIdx) => (
                  <View key={sIdx} style={styles.bulletRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletContent}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Demais categorias de habilidades: cada uma indivisível com wrap={false} */}
            {data.skills.slice(1).map((cat) => (
              <View key={cat.id} style={{ marginBottom: 4 }} wrap={false}>
                <Text style={styles.subCategoryTitle}>{cat.categoryName}</Text>
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

        {/* 9. PROJETOS E PORTFÓLIO */}
        {data.projects && data.projects.length > 0 && (
          <View>
            {/* TÍTULO + PRIMEIRO PROJETO AGRUPADOS COM wrap={false}: IMPOSSÍVEL O TÍTULO FICAR ÓRFÃO! */}
            <View wrap={false}>
              <Text style={sectionTitleStyle}>PROJETOS E PORTFÓLIO</Text>
              {(() => {
                const proj = data.projects[0];
                const desc = proj.description.trim().startsWith("-")
                  ? proj.description.trim().substring(1).trim()
                  : proj.description.trim();

                return (
                  <View style={styles.projectBlock}>
                    <Text style={styles.projectHeader}>
                      • {proj.name} - {proj.stack}{" "}
                      {proj.link && (
                        <Link
                          src={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                          style={{ fontSize: 8, color: "#1e1e1e", textDecoration: "underline" }}
                        >
                          [Ver Projeto]
                        </Link>
                      )}
                    </Text>
                    <View style={styles.projectDescriptionRow}>
                      <Text style={styles.dashPoint}>-</Text>
                      <Text style={styles.projectDescriptionText}>{desc}</Text>
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* Demais projetos: cada um indivisível com wrap={false} */}
            {data.projects.slice(1).map((proj) => {
              const desc = proj.description.trim().startsWith("-")
                ? proj.description.trim().substring(1).trim()
                : proj.description.trim();

              return (
                <View key={proj.id} style={styles.projectBlock} wrap={false}>
                  <Text style={styles.projectHeader}>
                    • {proj.name} - {proj.stack}{" "}
                    {proj.link && (
                      <Link
                        src={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                        style={{ fontSize: 8, color: "#1e1e1e", textDecoration: "underline" }}
                      >
                        [Ver Projeto]
                      </Link>
                    )}
                  </Text>
                  <View style={styles.projectDescriptionRow}>
                    <Text style={styles.dashPoint}>-</Text>
                    <Text style={styles.projectDescriptionText}>{desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 10. IDIOMAS (Indivisível com wrap={false}) */}
        {data.languages && data.languages.length > 0 && (
          <View wrap={false}>
            <Text style={sectionTitleStyle}>IDIOMAS</Text>
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
