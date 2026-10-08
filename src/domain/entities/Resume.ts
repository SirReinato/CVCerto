import { z } from "zod";

export const ExperienceSchema = z.object({
  id: z.string().uuid(),
  company: z.string().min(1, "Empresa é obrigatória"),
  role: z.string().min(1, "Cargo é obrigatório"),
  period: z.string().min(1, "Período é obrigatório"), // Ex: "Maio de 2026 - Atual"
  activities: z.array(z.string().min(1)),
});

export const EducationSchema = z.object({
  id: z.string().uuid(),
  degree: z.string().min(1, "Título do curso é obrigatório"),
  institution: z.string().min(1, "Instituição é obrigatória"),
  status: z.string().min(1, "Status ou ano de conclusão é obrigatório"), // Ex: "concluído em 2021" ou "em andamento (previsão dez/2026)"
});

export const CertificationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Nome da certificação é obrigatório"),
  statusOrYear: z.string().min(1), // Ex: "Concluído (2025)" ou "66 horas - Alura"
  category: z.enum(["principal", "complementar"]).default("principal"),
});

export const SkillCategorySchema = z.object({
  id: z.string().uuid(),
  categoryName: z.string().min(1), // Ex: "Suporte Técnico e Administração de Sistemas" ou "Front-end"
  skills: z.array(z.string().min(1)),
});

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  stack: z.string().min(1), // Ex: "Next.js" ou "Laravel + React.js"
  description: z.string().min(1),
});

export const ResumeDataSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(1, "Nome completo é obrigatório"),
    targetRoleOrTags: z.string().min(1), // Ex: "ANALISTA DE SUPORTE | INFRAESTRUTURA | MICROSOFT 365"
    city: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email("E-mail inválido"),
    age: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
  }),
  summary: z.string().min(1, "Resumo profissional é obrigatório"),
  experiences: z.array(ExperienceSchema),
  education: z.array(EducationSchema),
  certifications: z.array(CertificationSchema),
  skills: z.array(SkillCategorySchema),
  projects: z.array(ProjectSchema).default([]),
  languages: z.array(z.string()).default(["Inglês – Intermediário"]),
  additionalInfo: z.string().optional(),
});

export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ResumeData = z.infer<typeof ResumeDataSchema>;
