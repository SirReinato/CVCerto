import React, { useState } from "react";
import styled from "styled-components";
import { Mail, Send, CheckCircle2, Paperclip } from "lucide-react";
import { OutlookGraphMailService } from "../../infrastructure/mail/OutlookGraphMailService";

interface EmailSenderModalProps {
  userId: string;
  applicationId?: string;
  defaultEmail?: string;
  candidateName: string;
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
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  width: fit-content;
  border: 1px dashed #b3d7ff;
`;

export const EmailSenderModal: React.FC<EmailSenderModalProps> = ({
  userId,
  applicationId,
  defaultEmail,
  candidateName,
  onSent,
}) => {
  const [toEmail, setToEmail] = useState(defaultEmail || "");
  const [subject, setSubject] = useState(`Candidatura - ${candidateName} (Currículo Anexo)`);
  const [body, setBody] = useState(
    `Prezado(a) Recrutador(a),\n\nCompartilho em anexo meu currículo profissional atualizado com foco e certificações alinhadas à vaga.\n\nFico à disposição para uma conversa!\n\nAtenciosamente,\n${candidateName}\n(61) 9935-3163 | rfranca.lima@outlook.com`
  );
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim()) return;

    setIsSending(true);
    try {
      await OutlookGraphMailService.sendResumeEmail({
        userId,
        applicationId,
        toEmail,
        subject,
        body,
        fileName: `Curriculo_${candidateName.replace(/\s+/g, "_")}.pdf`,
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
          O envio fica registrado no histórico de candidaturas.
        </p>
      </div>

      <AttachmentBadge>
        <Paperclip size={14} /> Anexo: Curriculo_Renato_Franca_Lima.pdf (Pronto)
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
