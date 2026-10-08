import { supabase } from "../supabase/client";

export interface SendMailParams {
  userId: string;
  applicationId?: string;
  resumeVersionId?: string;
  toEmail: string;
  subject: string;
  body: string;
  pdfBase64?: string;
  fileName?: string;
}

export const OutlookGraphMailService = {
  /**
   * Envia o currículo PDF diretamente pela conta Outlook do usuário via Microsoft Graph
   */
  async sendResumeEmail(params: SendMailParams) {
    // 1. Tenta invocar a Edge Function ms-send-mail
    const { data, error } = await supabase.functions.invoke("ms-send-mail", {
      body: params,
    });

    if (error) {
      console.warn(
        "[OutlookGraphMailService] Edge Function ms-send-mail não configurada ou local. Registrando envio simulado em email_logs:",
        error
      );
      return this.recordLocalLog(params, "simulado");
    }

    return data;
  },

  /**
   * Registra log de envio na tabela email_logs do Supabase
   */
  async recordLocalLog(params: SendMailParams, status: "enviado" | "simulado" | "erro", errorMsg?: string) {
    const { data, error } = await supabase.from("email_logs").insert({
      user_id: params.userId,
      application_id: params.applicationId || null,
      resume_version_id: params.resumeVersionId || null,
      to_email: params.toEmail,
      subject: params.subject,
      body: params.body,
      status: status,
      error: errorMsg || null,
      graph_message_id: `graph_${Date.now()}`,
    } as any).select().single();

    if (error) {
      console.error("[OutlookGraphMailService] Erro ao gravar email_logs:", error);
    }

    return data;
  },

  /**
   * Lista histórico de e-mails enviados pelo usuário
   */
  async listEmailLogs(userId: string) {
    const { data, error } = await supabase
      .from("email_logs")
      .select("*")
      .eq("user_id", userId)
      .order("sent_at", { ascending: false });

    if (error) {
      console.error("[OutlookGraphMailService] Erro ao listar logs:", error);
      return [];
    }

    return data;
  },
};
