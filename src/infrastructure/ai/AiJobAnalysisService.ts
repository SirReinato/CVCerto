import { supabase } from "../supabase/client";
import type { ResumeData } from "../../domain/entities/Resume";
import type { JobAnalysis, FullInterviewDossier } from "../../domain/entities/JobAnalysis";

export interface AnalyzeJobParams {
  jobTitle?: string;
  companyName?: string;
  jobDescription: string;
  masterProfile: ResumeData;
}

export const AiJobAnalysisService = {
  /**
   * Envia o texto da vaga para análise estruturada pela Edge Function / Gemini
   */
  async analyzeJob(params: AnalyzeJobParams): Promise<JobAnalysis> {
    const { data, error } = await supabase.functions.invoke("analyze-job", {
      body: params,
    });

    if (error) {
      console.warn(
        "[AiJobAnalysisService] Edge Function falhou ou não implantada. Tentando chamada direta via Gemini API..."
      );
      return this.analyzeJobDirectWithGemini(params);
    }

    return data as JobAnalysis;
  },

  /**
   * Chamada direta à API do Gemini pelo frontend caso a Edge Function não esteja disponível
   */
  async analyzeJobDirectWithGemini(params: AnalyzeJobParams): Promise<JobAnalysis> {
    const apiKey =
      import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn(
        "[AiJobAnalysisService] VITE_GEMINI_API_KEY não configurada. Utilizando fallback determinístico."
      );
      return this.fallbackLocalAnalysis(params);
    }

    const prompt = `
Você é um Tech Recruiter Sênior e Career Coach Executivo especializado na área de Tecnologia.
Sua missão é receber:
1. Perfil Mestre (Base da Verdade do Candidato): Experiências reais, formações, certificações e projetos.
2. Descrição Completa da Vaga (Job Description): Requisitos, escopo, cultura e desafios da empresa contratante.

A partir desses dados, você deve gerar um dossiê ultra-completo e acionável para a Modal de Preparação para Entrevista e Análise da Vaga.

REGRA DE OURO (SEM ALUCINAÇÃO):
As respostas prontas e argumentos devem usar estritamente fatos reais presentes no Perfil Mestre do candidato. Se a vaga exigir algo que o candidato não possui diretamente, trace paralelos de adaptabilidade rápida com as tecnologias que ele já domina, sem mentir.

DADOS DA VAGA:
Cargo informado: ${params.jobTitle || "Não informado"}
Empresa informada: ${params.companyName || "Não informada"}
Descrição Completa:
"""
${params.jobDescription}
"""

PERFIL MESTRE DO CANDIDATO (FATOS REAIS):
"""
${JSON.stringify(params.masterProfile, null, 2)}
"""

Retorne OBRIGATORIAMENTE um JSON estritamente válido seguindo este formato exato:
{
  "jobTitle": "Cargo Alvo identificado",
  "companyName": "Nome da Empresa identificado",
  "technicalRequirements": ["hard skill 1", "hard skill 2"],
  "softSkills": ["soft skill 1", "soft skill 2"],
  "atsKeywords": ["palavra-chave ATS 1", "palavra-chave ATS 2"],
  "desiredCertifications": ["certificação solicitada"],
  "differentials": ["diferencial solicitado"],
  "matchScores": {
    "overall": 88,
    "technical": 90,
    "behavioral": 86
  },
  "matchedFacts": [
    {
      "factId": "id-do-fato",
      "description": "descrição do fato real no perfil",
      "justification": "por que atende ao requisito da vaga"
    }
  ],
  "gaps": ["requisito não atendido 100%"],
  "recommendedHighlight": "Orientação de quais experiências reais priorizar no currículo.",
  "interviewDossier": {
    "executiveDiagnosis": {
      "targetRole": "${params.jobTitle || "Cargo Alvo"}",
      "companyName": "${params.companyName || "Empresa Contratante"}",
      "overallMatchScore": 88,
      "culturalAndTechnicalFit": {
        "immediateStrengths": [
          "Requisito 1 onde o candidato se destaca com folga com base no histórico real",
          "Requisito 2 onde o candidato se destaca com folga",
          "Requisito 3 onde o candidato se destaca com folga"
        ],
        "gapsAndOvercomingStrategy": [
          {
            "gap": "Requisito da vaga não atendido 100%",
            "strategy": "Estratégia exata para justificar na conversa traçando paralelos de adaptabilidade rápida com as tecnologias que ele já domina"
          }
        ],
        "jobSummaryVision": "Síntese em 3 linhas dos reais desafios que a empresa quer resolver ao contratar essa pessoa (leitura nas entrelinhas do anúncio)."
      }
    },
    "salaryAnalysis": {
      "suggestedCLT": "R$ X.XXX a R$ Y.YYY",
      "suggestedPJ": "R$ X.XXX a R$ Y.YYY",
      "pricingJustification": "Argumento fundamentado na senioridade do candidato, certificações chave e escopo da função.",
      "flexibilityTrigger": "Frase pronta para negociar considerando benefícios corporativos (VR/VA, plano de saúde, auxílio home office, PLR)."
    },
    "screeningScripts": {
      "elevatorPitch": "Fale sobre você e sua trajetória profissional (Elevator Pitch de 90 segundos em 1ª pessoa: Passado consolidado + Momento atual de entrega + Motivo pelo qual esta vaga é o próximo passo ideal).",
      "helpCompanyChallenge": "Como você pode ajudar a empresa no desafio descrito nesta vaga? (Resposta conectando diretamente a maior dor descrita no anúncio com um caso/habilidade real do candidato em 1ª pessoa).",
      "motivation": "O que motivou você a se candidatar a esta oportunidade? (Justificativa citando a atuação e impacto do produto/serviço da empresa em 1ª pessoa).",
      "transitionReason": "Por que você quer sair da sua posição atual / fazer essa transição? (Resposta segura sem falar mal de experiências anteriores, focada em expansão técnica em 1ª pessoa)."
    },
    "behavioralStarQuestions": [
      {
        "question": "Conte sobre uma situação de incidente crítico sob pressão/crise e como você lidou.",
        "situation": "Contexto do problema real enfrentado no histórico do candidato.",
        "task": "O que era responsabilidade dele resolver.",
        "action": "O que ele fez tecnicamente ou metodologicamente.",
        "result": "Impacto positivo mensurável ou aprendizado.",
        "appliedDifferentials": ["✓ ITIL 4 Incident Management", "✓ SLA cumprido", "✓ Resolução sem reincidência"]
      },
      {
        "question": "Descreva uma situação em que teve divergência com colegas ou clientes sobre uma solução técnica.",
        "situation": "Contexto do conflito de ideias.",
        "task": "Garantir alinhamento sem comprometer a qualidade do suporte ou do projeto.",
        "action": "Comunicação empática baseada em dados e testes de causa-raiz.",
        "result": "Consenso estabelecido e operação mantida estável.",
        "appliedDifferentials": ["✓ Empatia e escuta ativa", "✓ Decisão orientada a fatos"]
      },
      {
        "question": "Como você prioriza suas tarefas quando surgem múltiplas demandas simultâneas de alta prioridade?",
        "situation": "Múltiplos chamados ou projetos concorrentes com prazos apertados.",
        "task": "Classificar impacto e urgência para atender aos SLAs.",
        "action": "Aplicação da matriz de priorização ITIL e comunicação preventiva com os usuários impactados.",
        "result": "Zero chamados violados e transparência total com a liderança.",
        "appliedDifferentials": ["✓ Matriz Gravidade x Urgência", "✓ Comunicação proativa"]
      }
    ],
    "technicalSabatina": [
      {
        "question": "Pergunta conceitual ou arquitetural provável 1 que o Tech Lead/Gerente vai fazer com base na stack da vaga",
        "idealAnswer": "Explicação direta e com vocabulário técnico afiado para o candidato estudar antes da chamada.",
        "redFlagsToAvoid": "O que nunca dizer nessa resposta para não parecer inexperiente."
      },
      {
        "question": "Pergunta técnica provável 2",
        "idealAnswer": "Explicação técnica detalhada.",
        "redFlagsToAvoid": "Evitar termos vagos ou respostas evasivas."
      },
      {
        "question": "Pergunta técnica provável 3",
        "idealAnswer": "Explicação técnica detalhada.",
        "redFlagsToAvoid": "Evitar confusão entre conceitos fundamentais."
      },
      {
        "question": "Pergunta técnica provável 4",
        "idealAnswer": "Explicação técnica detalhada.",
        "redFlagsToAvoid": "Evitar demonstração de desconhecimento de boas práticas."
      },
      {
        "question": "Pergunta técnica provável 5",
        "idealAnswer": "Explicação técnica detalhada.",
        "redFlagsToAvoid": "Evitar focar apenas na ferramenta sem explicar a arquitetura."
      }
    ],
    "maximumSharpness": {
      "realCasesToRemember": [
        "Caso/projeto 1 do histórico do candidato que deve ter na ponta da língua",
        "Caso/projeto 2 do histórico do candidato que deve ter na ponta da língua",
        "Caso/projeto 3 do histórico do candidato que deve ter na ponta da língua"
      ],
      "keyConceptsToReview": [
        "Termo técnico / sigla 1",
        "Termo técnico / sigla 2",
        "Termo técnico / sigla 3",
        "Termo técnico / sigla 4"
      ],
      "mindsetAndPostureTip": "Dica comportamental personalizada para o perfil do entrevistador (RH vs. Gestor de TI)."
    },
    "smartQuestionsToAsk": {
      "architectureAndProcesses": "Pergunta de alto nível sobre a arquitetura e processos do time.",
      "first90DaysSuccessCriteria": "Pergunta sobre os critérios de sucesso e entregas esperadas nos primeiros 90 dias.",
      "teamAutonomyAndGrowth": "Pergunta sobre a visão de crescimento, ritos de engenharia ou autonomia da equipe."
    }
  },
  "suggestedCoverLetter": "Apresentação executiva concisa personalizada para e-mail da vaga."
}
`;

    const modelsToTry = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest"];

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
              },
            }),
          }
        );

        if (!response.ok) {
          const errBody = await response.text();
          console.warn(`[AiJobAnalysisService] Modelo ${model} retornou status ${response.status}:`, errBody);
          continue; // Tenta o próximo modelo
        }

        const geminiData = await response.json();
        let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) continue;

        // Limpeza preventiva de blocos markdown se o modelo envolver em ```json
        text = text.trim();
        if (text.startsWith("```json")) {
          text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
        } else if (text.startsWith("```")) {
          text = text.replace(/^```\s*/, "").replace(/```\s*$/, "");
        }

        const parsed = JSON.parse(text) as JobAnalysis;
        console.log(`[AiJobAnalysisService] Vaga analisada com sucesso via ${model}!`);
        return parsed;
      } catch (err) {
        console.warn(`[AiJobAnalysisService] Falha ao tentar modelo ${model}:`, err);
      }
    }

    console.warn(
      "[AiJobAnalysisService] Todos os modelos Gemini online falharam. Utilizando fallback determinístico estruturado."
    );
    return this.fallbackLocalAnalysis(params);
  },

  /**
   * Fallback inteligente local caso a Edge Function ainda não esteja implantada no Supabase Cloud
   * ou em ambiente de testes offline. Realiza parsing determinístico real cruzando com o perfil do Renato.
   */
  fallbackLocalAnalysis(params: AnalyzeJobParams): JobAnalysis {
    const text = params.jobDescription.toLowerCase();

    // Palavras-chave conhecidas no universo de TI / Suporte / Front-end
    const keywordsPool = [
      "microsoft 365", "office 365", "active directory", "azure", "sla",
      "itil", "hardware", "vpn", "suporte n1", "suporte n2", "suporte n3", "troubleshooting",
      "react", "typescript", "javascript", "next.js", "sql", "mysql", "api rest", "git"
    ];

    const detectedKeywords = keywordsPool.filter((kw) => text.includes(kw));

    // Identifica quais certificações do perfil atendem
    const desiredCerts: string[] = [];
    if (text.includes("az-900") || text.includes("azure fundamentals")) desiredCerts.push("Microsoft Azure (AZ-900)");
    if (text.includes("itil")) desiredCerts.push("ITIL 4 Foundation");
    if (text.includes("md-102") || text.includes("endpoint")) desiredCerts.push("Microsoft MD-102");

    // Identifica cruzamento com experiências reais do Renato
    const matchedFacts = params.masterProfile.experiences.map((exp) => ({
      factId: exp.id,
      description: `${exp.role} na ${exp.company}`,
      justification: `Experiência comprovada em ${exp.company} cobrindo rotinas e SLAs da vaga.`,
    }));

    const isN3 = /n3|n-3|pleno|avançad|senior|especialista/i.test(params.jobTitle || "") || text.includes("n3") || text.includes("pleno");
    const roleName = params.jobTitle || "Analista de Suporte N2/N3";
    const compName = params.companyName || "Empresa Contratante";

    const interviewDossier: FullInterviewDossier = {
      executiveDiagnosis: {
        targetRole: roleName,
        companyName: compName,
        overallMatchScore: isN3 ? 92 : 88,
        culturalAndTechnicalFit: {
          immediateStrengths: [
            "Sustentação corporativa com governança Microsoft 365 e Active Directory (Brasfort e Truly Informática).",
            "Certificações oficiais reconhecidas pelo mercado: Microsoft Azure Fundamentals (AZ-900) e ITIL 4 Foundation.",
            "Cumprimento rigoroso de SLAs críticos e resolução de incidentes complexos de hardware, redes e estações.",
            "Formação superior em Análise e Desenvolvimento de Sistemas com Pós-Graduação em Inteligência Artificial em andamento."
          ],
          gapsAndOvercomingStrategy: [
            {
              gap: text.includes("linux") ? "Administração de servidores Linux" : "Requisitos específicos de automação com PowerShell avançado",
              strategy: "Destacar a facilidade e velocidade de aprendizado comprovadas pela transição bem-sucedida entre ambientes corporativos e a familiaridade sólida com scripts e linha de comando."
            }
          ],
          jobSummaryVision: `A ${compName} busca um profissional com maturidade técnica para estabilizar a operação de TI, reduzir o tempo médio de atendimento (MTTR) e garantir conformidade de segurança e identidade corporativa sem ruídos na experiência dos usuários.`
        }
      },
      salaryAnalysis: {
        suggestedCLT: isN3 ? "R$ 5.200 a R$ 6.800" : "R$ 4.200 a R$ 5.500",
        suggestedPJ: isN3 ? "R$ 7.500 a R$ 9.500" : "R$ 6.000 a R$ 7.800",
        pricingJustification: "Fundamentado na senioridade N2/N3 com vivência em suporte avançado, domínio prático do ecossistema Microsoft 365/Azure, certificações AZ-900 e ITIL 4 e pós em IA.",
        flexibilityTrigger: "Minha pretensão salarial é flexível em função do pacote de benefícios oferecido, como modelo de trabalho (híbrido/remoto), auxílio home office, plano de saúde e participação nos lucros."
      },
      screeningScripts: {
        elevatorPitch: `Sou graduado em Análise e Desenvolvimento de Sistemas e especialista em sustentação de ambientes de TI corporativos. Ao longo da minha carreira na Brasfort e Truly Informática, gerenciei centenas de incidentes críticos de infraestrutura, com foco contínuo na administração do Microsoft 365, Active Directory e automação na plataforma Neppo. Possuo certificações Microsoft AZ-900 e ITIL 4 Foundation, e atualmente curso pós-graduação em Inteligência Artificial. Busco esta oportunidade na ${compName} justamente para aplicar essa maturidade operacional e impulsionar a estabilidade e eficiência tecnológica do time.`,
        helpCompanyChallenge: `Entendo que o principal desafio da ${compName} é manter alta disponibilidade com rigor em governança e SLAs. Minha vivência em atender centenas de usuários corporativos com playbooks ITIL 4 e resolução na causa-raiz permite assumir a demanda com curva zero de adaptação, reduzindo reincidências desde a primeira semana.`,
        motivation: `O que me motivou a me candidatar à ${compName} foi a solidez da atuação da empresa e a oportunidade de atuar em projetos com padrões elevados de qualidade e impacto direto na produtividade dos colaboradores.`,
        transitionReason: `Busco uma transição para expandir meu escopo de atuação e contribuir em um ambiente estruturado que valorize boas práticas de governança em nuvem, melhoria contínua e inovação tecnológica.`
      },
      behavioralStarQuestions: [
        {
          question: "Conte sobre uma situação de incidente crítico sob pressão e como você agiu.",
          situation: "Durante um pico de operação na Truly Informática, um grupo de usuários corporativos perdeu acesso a serviços essenciais do Microsoft 365 devido a uma inconsistência de sincronização no Active Directory.",
          task: "Restabelecer o acesso com urgência máxima, contornando o impacto operacional dentro da janela de SLA.",
          action: "Identifiquei a falha de sincronização de credenciais, apliquei o procedimento de contingência e restabeleci a integridade dos grupos no AD em comunicação transparente com os gestores.",
          result: "Serviço normalizado em menos de 30 minutos sem perda de dados, com criação de um procedimento operacional padrão para blindar futuras ocorrências.",
          appliedDifferentials: ["✓ ITIL 4 Incident Management", "✓ SLA rigoroso cumprido", "✓ Criação de POP preventivo"]
        },
        {
          question: "Como você resolve divergências técnicas ou expectativas frustradas com usuários e colegas?",
          situation: "Um cliente interno solicitou a liberação de privilégios de administrador local que violavam as políticas de segurança corporativa vigentes.",
          task: "Negociar a recusa do privilégio sem gerar atrito, viabilizando o trabalho do colaborador com segurança.",
          action: "Apresentei de forma consultiva e empática os riscos de segurança, mapeei a real necessidade da tarefa e criei uma exceção controlada via política segura no Azure/GPO.",
          result: "O usuário concluiu a tarefa com sucesso e a integridade da estação foi preservada sem violação das diretrizes de TI.",
          appliedDifferentials: ["✓ Comunicação empática", "✓ Segurança da Informação", "✓ Resolução consultiva"]
        },
        {
          question: "Como você prioriza demandas quando chegam múltiplos chamados com prioridade alta simultaneamente?",
          situation: "Em dias de alta demanda, surgiam simultaneamente solicitações de diretoria e falhas de rede em setores operacionais.",
          task: "Gerenciar a fila de chamados sem estourar SLAs e mantendo a calma técnica.",
          action: "Utilizei a matriz de gravidade e urgência do ITIL 4, delegando ações preliminares aos níveis de suporte e comunicando proativamente os solicitantes sobre a previsão de entrega.",
          result: "100% dos chamados críticos atendidos dentro do tempo contratado com avaliação positiva de satisfação dos usuários.",
          appliedDifferentials: ["✓ Matriz ITIL de Impacto x Urgência", "✓ Comunicação proativa"]
        }
      ],
      technicalSabatina: [
        {
          question: "Qual a diferença entre Azure Active Directory (Microsoft Entra ID) e Active Directory Domain Services (AD DS) local?",
          idealAnswer: "O AD DS local baseia-se em protocolos legados como Kerberos, NTLM e LDAP organizados em florestas e OUs. Já o Entra ID é uma solução de gerenciamento de identidades baseada em nuvem com protocolos web modernos (OAuth 2.0, SAML, OpenID Connect) e recursos avançados de Acesso Condicional e MFA.",
          redFlagsToAvoid: "Dizer que o Entra ID é apenas uma cópia virtualizada do AD em um servidor na nuvem."
        },
        {
          question: "Como você investiga e diagnostica um erro de inicialização ou tela azul (BSOD) em uma estação de trabalho?",
          idealAnswer: "Coleto o minidump (.dmp) para análise de causa-raiz via WinDbg ou BlueScreenView, verifico os logs de eventos do Windows (Event Viewer) sob 'Sistema' e testo memória RAM e integridade de disco com chkdsk/sfc antes de qualquer reinstalação.",
          redFlagsToAvoid: "Sugerir formatar o computador imediatamente sem antes analisar os logs e identificar a falha."
        },
        {
          question: "O que são Group Policy Objects (GPOs) e qual a ordem de precedência de aplicação (LSDOU)?",
          idealAnswer: "GPOs são conjuntos de configurações de segurança e preferências centralizadas no domínio. A ordem de precedência é Local, Site, Domínio e Unidade Organizacional (LSDOU), sendo que as políticas aplicadas por último na OU sobrescrevem as anteriores a menos que haja 'No Override'/'Enforced'.",
          redFlagsToAvoid: "Esquecer a ordem de precedência ou dizer que a política local tem maior prioridade que a da OU."
        },
        {
          question: "Explique como funciona o processo de triagem e escalonamento de incidentes segundo o ITIL 4.",
          idealAnswer: "No ITIL 4, o foco é a cadeia de valor de serviço. Um incidente é registrado, categorizado por impacto e urgência, priorizado na matriz de SLA e tratado para restauração do serviço o mais rápido possível. Caso a causa-raiz seja desconhecida ou recorrente, abre-se um Gerenciamento de Problemas (Problem Management).",
          redFlagsToAvoid: "Confundir Gestão de Incidentes (restauração rápida do serviço) com Gestão de Problemas (investigação da causa-raiz definitiva)."
        },
        {
          question: "Como você gerencia o licenciamento e permissões de caixas compartilhadas (Shared Mailboxes) no Microsoft 365?",
          idealAnswer: "Shared Mailboxes não exigem licença atribuída caso o volume seja inferior a 50GB. O acesso é delegado atribuindo permissões 'Full Access' (acesso total) e 'Send As' ou 'Send on Behalf' aos usuários licenciados através do Centro de Administração do Exchange (EAC) ou PowerShell.",
          redFlagsToAvoid: "Afirmar que toda caixa compartilhada obrigatoriamente precisa de uma licença paga do M365 Business Standard."
        }
      ],
      maximumSharpness: {
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
      },
      smartQuestionsToAsk: {
        architectureAndProcesses: "Como está estruturada a governança de identidades e nuvem híbrida da empresa hoje, e quais são os maiores gargalos que vocês pretendem sanar neste trimestre?",
        first90DaysSuccessCriteria: "Quais seriam as principais entregas ou métricas de atendimento que fariam vocês considerarem essa contratação um grande sucesso nos primeiros 90 dias?",
        teamAutonomyAndGrowth: "Qual é o nível de autonomia do time de sustentação para propor melhorias de processo, automações de rotina e projetos de modernização tecnológica?"
      }
    };

    return {
      jobTitle: roleName,
      companyName: compName,
      technicalRequirements: detectedKeywords.slice(0, 5),
      softSkills: ["Comunicação Clara", "Resolução de Problemas Críticos", "Trabalho em Equipe", "Foco em SLA e Qualidade"],
      atsKeywords: detectedKeywords,
      desiredCertifications: desiredCerts.length > 0 ? desiredCerts : ["Microsoft Azure / ITIL"],
      differentials: ["Conhecimentos em nuvem híbrida, automação de fluxos e pós-graduação em IA"],
      matchScores: {
        overall: Math.min(95, 65 + detectedKeywords.length * 5),
        technical: Math.min(98, 70 + detectedKeywords.length * 4),
        behavioral: 88,
      },
      matchedFacts: matchedFacts.slice(0, 3),
      gaps: text.includes("linux") ? ["Linux Avançado"] : ["Sem lacunas impeditivas para a função"],
      recommendedHighlight:
        "Destacar a atuação sólida na Brasfort e Truly Informática com administração de Microsoft 365, Active Directory, fluxos na Neppo e certificações AZ-900 e ITIL 4.",
      interviewDossier,
      suggestedCoverLetter: `Prezado(a) Recrutador(a),\n\nIdentifiquei grande aderência entre os desafios da oportunidade de ${roleName} na ${compName} e minha trajetória profissional. Atuo na sustentação e suporte técnico corporativo avançado, com experiência prática na administração do ecossistema Microsoft 365, Active Directory, automação de fluxos e resolução de incidentes críticos com cumprimento rigoroso de SLAs e governança ITIL 4.\n\nPossuo certificações Microsoft Azure Fundamentals (AZ-900) e ITIL 4 Foundation, graduação em ADS e pós-graduação em Inteligência Artificial em andamento. Compartilho em anexo meu currículo profissional detalhado e fico à disposição para conversarmos!\n\nAtenciosamente,\nRenato de França Lima\n(61) 9935-3163 | rfranca.lima@outlook.com`,
    };
  },

  /**
   * Avalia a resposta do candidato a uma pergunta da entrevista com IA
   */
  async evaluateMockInterviewAnswer(params: {
    roleTitle: string;
    companyName: string;
    question: string;
    answer: string;
    idealContext?: string;
  }): Promise<MockInterviewFeedback> {
    const apiKey =
      import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

    if (!apiKey) {
      return this.fallbackEvaluateAnswer(params.answer, params.question);
    }

    const prompt = `
Você é um Tech Recruiter e Gestor de Engenharia Sênior especializado em simulação de entrevistas de emprego.
Analise a resposta dada pelo candidato para a seguinte pergunta de entrevista referente à vaga:
Cargo: ${params.roleTitle}
Empresa: ${params.companyName}
Pergunta da Entrevista: "${params.question}"
${params.idealContext ? `Contexto/Gabarito esperado: "${params.idealContext}"` : ""}

Resposta formulada pelo candidato:
"""
${params.answer}
"""

Avalie a resposta sob os critérios:
1. Clareza, concisão e vocabulário técnico de especialista.
2. Aplicação de método estruturado (ex: STAR - Situação, Tarefa, Ação, Resultado, ou lógica clara de troubleshooting).
3. Postura profissional e menção a impacto/SLA/boas práticas.

Retorne EXCLUSIVAMENTE um objeto JSON no formato:
{
  "score": 85,
  "verdict": "Excelente",
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "improvements": ["o que faltou mencionar ou melhorar 1", "sugestão 2"],
  "seniorRefinement": "Exemplo de como responder essa mesma pergunta como um profissional Sênior refinado, em 1ª pessoa."
}
`;

    const modelsToTry = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest"];
    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.3,
              },
            }),
          }
        );

        if (!response.ok) continue;

        const geminiData = await response.json();
        let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) continue;

        text = text.trim();
        if (text.startsWith("```json")) {
          text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
        } else if (text.startsWith("```")) {
          text = text.replace(/^```\s*/, "").replace(/```\s*$/, "");
        }

        const parsed = JSON.parse(text) as MockInterviewFeedback;
        return parsed;
      } catch (e) {
        console.warn(`[evaluateMockInterviewAnswer] Falha com modelo ${model}:`, e);
      }
    }

    return this.fallbackEvaluateAnswer(params.answer, params.question);
  },

  fallbackEvaluateAnswer(answer: string, _question: string): MockInterviewFeedback {
    const wordCount = answer.trim().split(/\s+/).length;
    const lower = answer.toLowerCase();

    let score = 70;
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (wordCount >= 30) {
      score += 10;
      strengths.push("Bom nível de detalhamento e contexto fornecido.");
    } else {
      score -= 15;
      improvements.push("Resposta muito sucinta. Em entrevistas reais, estruture com mais contexto sobre a sua ação e o resultado.");
    }

    if (lower.includes("sla") || lower.includes("itil") || lower.includes("processo") || lower.includes("metodologia") || lower.includes("métrica")) {
      score += 10;
      strengths.push("Excelente citação de processos, conformidade ou métricas operacionais.");
    } else {
      improvements.push("Tente conectar sua resposta com impacto operacional real (ex: cumprimento de SLA, satisfação do usuário ou prevenção de reincidência).");
    }

    if (lower.includes("equipe") || lower.includes("time") || lower.includes("comunicação") || lower.includes("usuário")) {
      strengths.push("Demonstrou empatia e foco na comunicação com as partes interessadas.");
    }

    const finalScore = Math.max(45, Math.min(95, score));
    const verdict = finalScore >= 80 ? "Excelente" : finalScore >= 60 ? "Bom" : "Precisa Melhorar";

    return {
      score: finalScore,
      verdict,
      strengths: strengths.length > 0 ? strengths : ["Disposição e clareza direta na comunicação."],
      improvements: improvements.length > 0 ? improvements : ["Mantenha o tom confiante e use exemplos reais de incidentes solucionados com sucesso."],
      seniorRefinement: `Na minha experiência com cenários dessa complexidade, sempre abordo a questão priorizando estabilidade e método. Primeiro, realizo a contenção imediata e alinho as expectativas com os envolvidos. Em seguida, analiso a causa-raiz para evitar qualquer reincidência, registrando o procedimento na base de conhecimento e seguindo as melhores práticas ITIL.`
    };
  }
};

export interface MockInterviewFeedback {
  score: number;
  verdict: "Excelente" | "Bom" | "Precisa Melhorar";
  strengths: string[];
  improvements: string[];
  seniorRefinement: string;
}
