import React, { useState } from "react";
import styled from "styled-components";
import { Mail, Send, CheckCircle2, Paperclip } from "lucide-react";
import { OutlookGraphMailService } from "../../infrastructure/mail/OutlookGraphMailService";
import type { ResumeData } from "../../domain/entities/Resume";
import type { ApplicationItem } from "../../infrastructure/supabase/JobApplicationsRepository";


interface EmailSenderModalProps {
  userId: string;
  applicationId?: string;
  defaultEmail?: string;
  candidateName: string;
  masterProfile: ResumeData;
  availableApplications?: ApplicationItem[];
  selectedApp?: ApplicationItem | null;
  onSent?: () => void;
}

const Card = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #333333;
  }

  input,
  select,
  textarea {
    padding: 10px 12px;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    font-size: 0.88rem;
    outline: none;
    font-family: inherit;

    &:focus {
      border-color: #1e1e1e;
    }
  }

  textarea {
    min-height: 120px;
    resize: vertical;
  }
`;

const SubmitButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #0078d4; // Microsoft Outlook Blue
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;

  &:hover {
    background-color: #106ebe;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AttachmentBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #f0f4f8;
  color: #0078d4;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  width: 100%;
  border: 1px dashed #b3d7ff;
`;

export const EmailSenderModal: React.FC<EmailSenderModalProps> = ({
  userId,
  applicationId,
  defaultEmail,
  candidateName,
  masterProfile,
  availableApplications = [],
  selectedApp,
  onSent,
}) => {
  const [selectedAttachmentType, setSelectedAttachmentType] = useState<string>(
    selectedApp?.id ? selectedApp.id : "master"
  );
  const getInitialSubject = () => {
    if (selectedApp?.jobs?.title) {
      return `Candidatura: ${selectedApp.jobs.title}`;
    }
    return `Candidatura: Analista de Suporte N2/N3`;
  };

  const getInitialBody = () => {
    if (selectedApp?.cover_letter) {
      return selectedApp.cover_letter;
    }
    const role = selectedApp?.jobs?.title || "Analista de Suporte";
    const company = selectedApp?.jobs?.companies?.name || "sua empresa";
    return `Prezado(a) Recrutador(a),\n\nIdentifiquei grande aderência entre os desafios da oportunidade de ${role} na ${company} e minha trajetória profissional. Atuo na sustentação e suporte técnico corporativo avançado (N2/N3), com sólida experiência na administração do ecossistema Microsoft 365, Active Directory, automação de fluxos e resolução de incidentes críticos orientados a rigorosos SLAs e práticas ITIL 4.\n\nPossuo certificações Microsoft Azure Fundamentals (AZ-900) e ITIL 4 Foundation, graduação em Análise e Desenvolvimento de Sistemas e pós-graduação em Inteligência Artificial em andamento. Compartilho em anexo meu currículo profissional detalhado e coloco-me à inteira disposição para conversarmos!\n\nAtenciosamente,\n${candidateName}\n(61) 9935-3163 | rfranca.lima@outlook.com`;
  };

  const [toEmail, setToEmail] = useState(defaultEmail || "");
  const [subject, setSubject] = useState(getInitialSubject());
  const [body, setBody] = useState(getInitialBody());
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Calcula o anexo atualmente selecionado (O nome do arquivo é OBRIGATORIAMENTE cv-renato-de-franca-lima.pdf)
  const activeAttachment = React.useMemo(() => {
    if (selectedAttachmentType === "master") {
      return {
        label: "Currículo Base Mais Forte (Nível N2/N3 Oficial)",
        fileName: "cv-renato-de-franca-lima.pdf",
        data: masterProfile,
      };
    }
    const foundApp = availableApplications.find((a) => a.id === selectedAttachmentType);
    if (foundApp) {
      return {
        label: `CV Personalizado da Vaga: ${foundApp.jobs?.title || "Vaga"} (${foundApp.jobs?.companies?.name || "Empresa"})`,
        fileName: "cv-renato-de-franca-lima.pdf",
        data: foundApp.tailored_resume || masterProfile,
      };
    }
    return {
      label: "Currículo Base Mais Forte (Nível N2/N3 Oficial)",
      fileName: "cv-renato-de-franca-lima.pdf",
      data: masterProfile,
    };
  }, [selectedAttachmentType, masterProfile, availableApplications]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim()) return;

    setIsSending(true);
    try {
      await OutlookGraphMailService.sendResumeEmail({
        userId,
        applicationId: selectedAttachmentType !== "master" ? selectedAttachmentType : applicationId,
        toEmail,
        subject,
        body,
        fileName: activeAttachment.fileName,
      });

      setIsSuccess(true);
      if (onSent) onSent();
    } catch {
      alert("Erro ao disparar e-mail via Outlook.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <div>
        <h2 style={{ margin: "0 0 6px 0", fontSize: "1.2rem", color: "#1e1e1e", display: "flex", alignItems: "center", gap: 8 }}>
          <Mail size={22} color="#0078D4" /> Disparo Direto pelo Outlook (Microsoft Graph)
        </h2>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#666666" }}>
          Envie o currículo PDF gerado diretamente pela sua conta pessoal (<code>rfranca.lima@outlook.com</code>).
          Escolha anexar o <strong>Currículo Base Mais Forte</strong> ou o <strong>Currículo Específico Otimizado da Vaga</strong>.
        </p>
      </div>

      <FormGroup>
        <label>Selecione qual Currículo Anexar ao Disparo:</label>
        <select
          value={selectedAttachmentType}
          onChange={(e) => {
            setSelectedAttachmentType(e.target.value);
            const found = availableApplications.find((a) => a.id === e.target.value);
            if (found?.jobs?.title) {
              setSubject(`Candidatura: ${found.jobs.title}`);
              if (found.cover_letter) {
                setBody(found.cover_letter);
              } else {
                setBody(
                  `Prezado(a) Recrutador(a),\n\nIdentifiquei grande aderência entre os desafios da oportunidade de ${found.jobs.title} na ${found.jobs.companies?.name || "sua empresa"} e minha trajetória profissional. Atuo na sustentação e suporte técnico corporativo avançado (N2/N3), com sólida experiência na administração do ecossistema Microsoft 365, Active Directory, automação de fluxos e resolução de incidentes críticos com cumprimento rigoroso de SLAs e práticas ITIL 4.\n\nPossuo certificações Microsoft Azure Fundamentals (AZ-900) e ITIL 4 Foundation, graduação em Análise e Desenvolvimento de Sistemas e pós-graduação em Inteligência Artificial em andamento. Compartilho em anexo meu currículo profissional detalhado e fico à disposição para conversarmos!\n\nAtenciosamente,\nRenato de França Lima\n(61) 9935-3163 | rfranca.lima@outlook.com`
                );
              }
            } else if (e.target.value === "master") {
              setSubject(`Candidatura: Analista de Suporte N2/N3`);
              setBody(
                `Prezado(a) Recrutador(a),\n\nCompartilho em anexo meu currículo profissional atualizado com foco em Suporte Técnico Avançado (N2/N3), Infraestrutura Corporativa, Microsoft 365, Active Directory e certificações AZ-900 e ITIL 4.\n\nFico à disposição para uma conversa!\n\nAtenciosamente,\nRenato de França Lima\n(61) 9935-3163 | rfranca.lima@outlook.com`
              );
            }
          }}
        >
          <option value="master">
            ⭐ Currículo Base Mais Forte (Nível N2/N3 Oficial - Padrão Otimizado)
          </option>
          {availableApplications.map((app) => (
            <option key={app.id} value={app.id}>
              🎯 CV Personalizado: {app.jobs?.title || "Vaga"} - {app.jobs?.companies?.name || "Empresa"} (Match: {app.match_overall || 85}%)
            </option>
          ))}
        </select>
      </FormGroup>

      <AttachmentBadge>
        <Paperclip size={16} />
        <div>
          <div><strong>Anexo Selecionado:</strong> {activeAttachment.fileName}</div>
          <div style={{ fontSize: "0.75rem", color: "#555" }}>{activeAttachment.label}</div>
        </div>
      </AttachmentBadge>

      <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormGroup>
          <label>Destinatário (E-mail do RH / Recrutador) *</label>
          <input
            type="email"
            placeholder="recrutador@empresa.com.br"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            required
          />
        </FormGroup>

        <FormGroup>
          <label>Assunto</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </FormGroup>

        <FormGroup>
          <label>Mensagem</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            required
          />
        </FormGroup>

        <SubmitButton type="submit" disabled={isSending}>
          <Send size={16} />
          {isSending ? "Disparando via Outlook..." : "Enviar Candidatura com Anexo"}
        </SubmitButton>
      </form>

      {isSuccess && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#2e7d32", fontSize: "0.88rem", fontWeight: 600 }}>
          <CheckCircle2 size={18} />
          <span>E-mail enviado e registrado no CRM com sucesso!</span>
        </div>
      )}
    </Card>
  );
};
