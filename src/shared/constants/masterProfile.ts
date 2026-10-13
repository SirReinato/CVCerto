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
      "ANALISTA DE SUPORTE N2/N3 | INFRAESTRUTURA | MICROSOFT 365 | ACTIVE DIRECTORY | AZURE",
    city: "SAMAMBAIA, DF.",
    phone: "(61) 9935-3163",
    email: "RFRANCA.LIMA@OUTLOOK.COM",
    age: "28 ANOS",
  },
  summary:
    "Profissional de TI sênior/pleno especializado em Suporte Técnico Avançado (N2/N3), Infraestrutura Corporativa, Microsoft 365 e Active Directory. Sólida experiência em administração e sustentação de ambientes de missão crítica, resolução de incidentes complexos escalados, implementação de automações de processos digitais e atendimento rigorosamente alinhado às melhores práticas ITIL 4 com gestão rigorosa de SLAs. Vivência em troubleshooting avançado de conectividade, redes híbridas, VPNs corporativas e governança de identidades e acessos. Certificado Microsoft Azure Fundamentals (AZ-900) e ITIL 4 Foundation, com bacharelado em Análise e Desenvolvimento de Sistemas e especialização em IA.",
  experiences: [
    {
      id: "f1a23456-7890-4abc-def1-000000000001",
      company: "Brasfort",
      role: "ANALISTA DE SUPORTE",
      period: "Maio de 2026 - Atual",
      activities: [
        "Atuação no suporte técnico corporativo avançado e resolução de incidentes complexos (N2/N3) com foco em alta disponibilidade e cumprimento estrito de SLAs críticos.",
        "Administração centralizada do ecossistema Microsoft 365: gestão de identidades no Microsoft Entra ID (Azure AD), políticas de acesso condicional, licenciamento, segurança de caixas compartilhadas e suporte a aplicações corporativas.",
        "Administração de infraestrutura de domínio Active Directory: gerenciamento de floresta/árvore, Group Policy Objects (GPOs), segurança de grupos de segurança e controle de delegações.",
        "Troubleshooting avançado de conectividade, roteamento corporativo, túneis VPN, estabilidade de rede e infraestrutura de servidores locais e em nuvem.",
        "Administração, parametrização e integração da plataforma Neppo: implementação de fluxos automatizados de atendimento, regras de roteamento inteligente e otimização de jornadas digitais corporativas.",
        "Configuração, padronização e gestão de ciclo de vida de equipamentos e recursos corporativos de TI.",
        "Elaboração de documentação técnica detalhada, playbooks operacionais e procedimentos de contingência para disseminação de conhecimento e padronização operacional.",
        "Atuação como ponto focal técnico junto à engenharia e infraestrutura para escalonamento, diagnóstico e resolução definitiva de incidentes de alto impacto (P1/P2).",
        "Liderança técnica e proposição de melhorias contínuas em automação de tarefas repetitivas e canais de atendimento digital.",
      ],
    },
    {
      id: "f1a23456-7890-4abc-def1-000000000002",
      company: "Truly Informática",
      role: "TÉCNICO DE INFORMÁTICA N1",
      period: "Abril 2024 - Maio 2026",
      activities: [
        "Gestão e governança de identidades e acessos em Active Directory corporativo, atuando na estruturação de OUs, usuários, controle de permissões em pastas de rede e auditoria de acessos.",
        "Administração e suporte a ambientes corporativos Microsoft 365, provisionamento de contas, políticas de caixas postais compartilhadas e suporte colaborativo.",
        "Execução de projetos de migração de contas e infraestrutura de e-mails para nuvem Microsoft 365, com acompanhamento de cutover e homologação pós-implantação.",
        "Diagnóstico técnico aprofundado e resolução de chamados escalados, atuando na causa-raiz de incidentes recorrentes de hardware, sistemas operacionais e rede.",
        "Produção de bases de conhecimento, scripts de apoio e documentação técnica para suporte e atendimento ao usuário.",
        "Interface com fornecedores e áreas de sustentação para escalonamento de incidentes baseado em criticidade, matriz de impacto e métricas de SLA.",
      ],
    },
    {
      id: "f1a23456-7890-4abc-def1-000000000003",
      company: "Forças Armadas",
      role: "Auxiliar da Sargenteação",
      period: "Março de 2016 - Março de 2024",
      activities: [
        "Diagnóstico, montagem, manutenção e sustentação de hardware e software em estações de trabalho, assegurando prontidão e máxima disponibilidade dos recursos computacionais.",
        "Gestão e organização de bases de dados operacionais e registros estratégicos com Microsoft Excel avançado, garantindo conformidade e proteção de dados confidenciais.",
        "Elaboração de pareceres técnicos, procedimentos operacionais padrão (POPs) e relatórios administrativos sob rígidos padrões militares de conformidade.",
        "Operação de rotinas sob estrita disciplina de processos, hierarquia técnica e cumprimento impreterível de prazos e normas de segurança institucional.",
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
      link: "https://github.com/SirReinato",
    },
    {
      id: "p1a23456-7890-4abc-def1-000000000002",
      name: "Sistema de Ocorrências Rodoviárias",
      stack: "Laravel + React.js",
      description:
        "Desenvolvimento de componentes, correção de bugs, integração com APIs e organização do código em componentes reutilizáveis.",
      link: "https://github.com/SirReinato",
    },
    {
      id: "p1a23456-7890-4abc-def1-000000000003",
      name: "King of Case: Loja de Capinhas de Celular",
      stack: "React.js",
      description:
        "Criação de interface responsiva, estados e consumo de API. Aprimoramento contínuo com foco em boas práticas.",
      link: "https://github.com/SirReinato",
    },
    {
      id: "p1a23456-7890-4abc-def1-000000000004",
      name: "Livro de Receitas",
      stack: "React.js",
      description: "Criação de interface responsiva, estados e consumo de API.",
      link: "https://github.com/SirReinato",
    },
  ],
  languages: ["Inglês – Intermediário"],
  additionalInfo: "Disponibilidade para início imediato e atuação híbrida/remota.",
};
