import type { ResumeData } from "../../domain/entities/Resume";

/**
 * Base de fatos reais extraída diretamente dos currículos oficiais
 * fornecidos por Renato de França Lima.
 * Nenhuma informação além destas pode ser inventada.
 */
export const MASTER_PROFILE: ResumeData = {
  personalInfo: {
    fullName: "R E N A T O  D E  F R A N Ç A  L I M A",
    targetRoleOrTags:
      "ANALISTA DE SUPORTE | INFRAESTRUTURA | MICROSOFT 365 | ACTIVE DIRECTORY | AZURE",
    city: "SAMAMBAIA, DF.",
    phone: "(61) 9935-3163",
    email: "RFRANCA.LIMA@OUTLOOK.COM",
    age: "28 ANOS",
  },
  summary:
    "Profissional de TI com experiência em suporte técnico corporativo, administração de ambientes Microsoft 365, Active Directory e infraestrutura de TI. Atuação em gestão de acessos, resolução de incidentes, suporte a sistemas críticos, documentação técnica e atendimento orientado por SLA. Experiência na interação com equipes de infraestrutura, suporte a ambientes corporativos, configuração de equipamentos e administração de recursos Microsoft. Certificado Microsoft Azure Fundamentals (AZ-900) e ITIL 4 Foundation, com foco em infraestrutura, Modern Workplace e melhoria contínua.",
  experiences: [
    {
      id: "f1a23456-7890-4abc-def1-000000000001",
      company: "Brasfort",
      role: "ANALISTA DE SUPORTE",
      period: "Maio de 2026 - Atual",
      activities: [
        "Atuação no suporte técnico corporativo a usuários, realizando atendimento remoto e presencial com foco na continuidade operacional e cumprimento de SLA.",
        "Administração de ambientes Microsoft 365, incluindo criação de usuários, licenciamento, gerenciamento de caixas compartilhadas e suporte às aplicações corporativas.",
        "Administração de contas, grupos e permissões em Active Directory.",
        "Diagnóstico e resolução de incidentes envolvendo hardware, software, VPN, conectividade e sistemas corporativos.",
        "Administração e parametrização da plataforma Neppo, realizando configuração de fluxos automatizados, regras de atendimento e validação de jornadas digitais.",
        "Configuração e manutenção de equipamentos corporativos e recursos de TI.",
        "Documentação técnica de incidentes, procedimentos e soluções aplicadas, contribuindo para a padronização dos processos.",
        "Interação com equipes de infraestrutura para escalonamento e resolução de incidentes críticos.",
        "Apoio na melhoria de processos de automação e atendimento digital, visando otimização operacional.",
      ],
    },
    {
      id: "f1a23456-7890-4abc-def1-000000000002",
      company: "Truly Informática",
      role: "TÉCNICO DE INFORMÁTICA N1",
      period: "Abril 2024 - Maio 2026",
      activities: [
        "Atuação no gerenciamento de contas e acessos em Active Directory, incluindo criação de usuários, redefinição de senhas, desbloqueios e atribuição de permissões.",
        "Suporte e administração básica de ambientes Microsoft 365, com criação de e-mails corporativos, licenciamento e configuração de caixas compartilhadas.",
        "Atuação em migração de contas para Microsoft 365, com acompanhamento do usuário e validação pós-implantação.",
        "Análise e resolução de chamados escalados, realizando diagnóstico técnico detalhado e validação das soluções aplicadas.",
        "Registro e documentação de incidentes e procedimentos técnicos, contribuindo para padronização e melhoria contínua.",
        "Comunicação com áreas técnicas para escalonamento de incidentes, respeitando critérios de SLA, prioridade e impacto no negócio.",
      ],
    },
    {
      id: "f1a23456-7890-4abc-def1-000000000003",
      company: "Forças Armadas",
      role: "Auxiliar da Sargenteação",
      period: "Março de 2016 - Março de 2024",
      activities: [
        "Diagnóstico e manutenção de computadores (hardware e software), garantindo disponibilidade dos recursos de TI.",
        "Organização e gestão de dados administrativos e operacionais, com uso de Microsoft Excel e controle de informações sensíveis.",
        "Elaboração e padronização de documentos administrativos, seguindo normas e prazos institucionais.",
        "Apoio a rotinas administrativas com foco em organização, confidencialidade e cumprimento de processos.",
      ],
    },
  ],
  education: [
    {
      id: "e1a23456-7890-4abc-def1-000000000001",
      degree: "Graduação em Análise e Desenvolvimento de Sistemas",
      institution: "Universidade Católica de Brasília - UCB",
      status: "concluído em 2021",
    },
    {
      id: "e1a23456-7890-4abc-def1-000000000002",
      degree: "Pós-Graduação em Inteligência Artificial e Machine Learning",
      institution: "UniCesumar",
      status: "em andamento (conclusão prevista para dezembro de 2026)",
    },
  ],
  certifications: [
    {
      id: "c1a23456-7890-4abc-def1-000000000001",
      name: "ITIL 4 Foundation",
      statusOrYear: "Concluído (2025)",
      category: "principal",
    },
    {
      id: "c1a23456-7890-4abc-def1-000000000002",
      name: "Microsoft Azure Fundamentals (AZ-900)",
      statusOrYear: "Concluído (2026)",
      category: "principal",
    },
    {
      id: "c1a23456-7890-4abc-def1-000000000003",
      name: "Microsoft Endpoint Administrator (MD-102)",
      statusOrYear: "previsto abr/2026",
      category: "principal",
    },
    {
      id: "c1a23456-7890-4abc-def1-000000000004",
      name: "JavaScript",
      statusOrYear: "60 horas - Alura (2023)",
      category: "complementar",
    },
    {
      id: "c1a23456-7890-4abc-def1-000000000005",
      name: "React.js",
      statusOrYear: "66 horas - Alura (2024)",
      category: "complementar",
    },
    {
      id: "c1a23456-7890-4abc-def1-000000000006",
      name: "TypeScript",
      statusOrYear: "31 horas - Alura (2022)",
      category: "complementar",
    },
    {
      id: "c1a23456-7890-4abc-def1-000000000007",
      name: "Web Design",
      statusOrYear: "44 horas - Origamid (2021)",
      category: "complementar",
    },
    {
      id: "c1a23456-7890-4abc-def1-000000000008",
      name: "Figma",
      statusOrYear: "8 horas - Alura (2023)",
      category: "complementar",
    },
  ],
  skills: [
    {
      id: "s1a23456-7890-4abc-def1-000000000001",
      categoryName: "Cloud e Microsoft Azure",
      skills: [
        "Conceitos de nuvem, modelos de serviço (Iaas, Paas, Saas) e modelos de implantação (pública, privada e híbrida)",
        "Gerenciamento de recursos no Azure Portal, incluindo criação e configuração de máquinas virtuais, redes virtuais e armazenamento.",
        "Noções de segurança e conformidade em ambientes Azure, com foco em identidade, governança e políticas de acesso.",
        "Monitoramento e análise de custos em Azure, aplicando boas práticas de otimização",
      ],
    },
    {
      id: "s1a23456-7890-4abc-def1-000000000002",
      categoryName: "Suporte Técnico e Administração de Sistemas",
      skills: [
        "Gestão de contas e acessos em Active Directory (criação, desbloqueio, reset de senhas, permissões).",
        "Administração e suporte em Office 365 (migração de contas, caixas de correio compartilhadas, licenciamento, e-mails corporativos).",
        "Instalação, configuração e manutenção de sistemas operacionais Windows e softwares corporativos.",
        "Configuração remota de sistemas e aplicativos, incluindo troubleshooting avançado.",
        "Monitoramento e atendimento de chamados com foco em SLA, prioridade e impacto no negócio.",
      ],
    },
    {
      id: "s1a23456-7890-4abc-def1-000000000003",
      categoryName: "Infraestrutura e Ferramentas de TI",
      skills: [
        "Acesso remoto e suporte a usuários em ambientes corporativos.",
        "Documentação técnica de incidentes e soluções aplicadas.",
        "Testes de correções e validação de soluções antes da liberação ao usuário.",
        "Escalonamento de incidentes para áreas técnicas especializadas.",
        "Gestão de permissões em ambientes corporativos e pastas compartilhadas.",
      ],
    },
    {
      id: "s1a23456-7890-4abc-def1-000000000004",
      categoryName: "Banco de Dados e Integrações",
      skills: [
        "Conhecimentos em SQL/MySQL para consultas e suporte a sistemas.",
        "Integrações simples com APIs REST para suporte técnico e análise de sistemas.",
      ],
    },
    {
      id: "s1a23456-7890-4abc-def1-000000000005",
      categoryName: "Metodologias e Boas Práticas",
      skills: [
        "Aplicação de conceitos de ITIL 4 Foundation",
        "Foco em melhoria contínua, gestão de serviços e comunicação clara com usuários e equipes técnicas.",
      ],
    },
  ],
  projects: [
    {
      id: "p1a23456-7890-4abc-def1-000000000001",
      name: "N1_GuidePro",
      stack: "Next.js",
      description:
        "Plataforma web desenvolvida para centralizar tutoriais e guias técnicos voltados para equipes de suporte N1.",
    },
    {
      id: "p1a23456-7890-4abc-def1-000000000002",
      name: "Sistema de Ocorrências Rodoviárias",
      stack: "Laravel + React.js",
      description:
        "Desenvolvimento de componentes, correção de bugs, integração com APIs e organização do código em componentes reutilizáveis.",
    },
    {
      id: "p1a23456-7890-4abc-def1-000000000003",
      name: "King of Case: Loja de Capinhas de Celular",
      stack: "React.js",
      description:
        "Criação de interface responsiva, estados e consumo de API. Aprimoramento contínuo com foco em boas práticas.",
    },
    {
      id: "p1a23456-7890-4abc-def1-000000000004",
      name: "Livro de Receitas",
      stack: "React.js",
      description: "Criação de interface responsiva, estados e consumo de API.",
    },
  ],
  languages: ["Inglês – Intermediário"],
  additionalInfo: "Disponibilidade para início imediato e atuação híbrida/remota.",
};
