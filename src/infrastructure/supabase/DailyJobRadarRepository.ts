import { supabase } from "./client";
import type {
  DailyRadarItem,
  DailyRadarRun,
  RadarTriggerMode,
  RadarTriggerResponse,
} from "../../domain/entities/DailyJobRadar";
import type { RadarTriageStatus } from "../../shared/types/database.types";

/**
 * Retorna a data civil atual (YYYY-MM-DD) no fuso America/Sao_Paulo.
 */
function getTodayDateSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

/**
 * Repositório Supabase para leitura de cache, disparo da Edge Function e triagem do Radar Diário IA.
 */
export const DailyJobRadarRepository = {
  async listActiveItems(userId: string): Promise<DailyRadarItem[]> {
    const { data, error } = await supabase
      .from("daily_job_radar_items")
      .select("*")
      .eq("user_id", userId)
      .neq("triage_status", "descartada")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data as DailyRadarItem[] | null) ?? [];
  },

  async getTodayRun(userId: string): Promise<DailyRadarRun | null> {
    const today = getTodayDateSaoPaulo();
    const { data, error } = await supabase
      .from("daily_job_radar_runs")
      .select("*")
      .eq("user_id", userId)
      .eq("run_date", today)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as DailyRadarRun | null) ?? null;
  },

  async triggerDailyRadar(mode: RadarTriggerMode = "auto"): Promise<RadarTriggerResponse> {
    const { data, error } = await supabase.functions.invoke<RadarTriggerResponse>(
      "daily-ai-jobs-radar",
      {
        body: { mode },
      }
    );

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Resposta vazia da Edge Function daily-ai-jobs-radar.");
    }

    return data;
  },

  async updateTriageStatus(itemId: string, status: RadarTriageStatus): Promise<void> {
    const { error } = await supabase
      .from("daily_job_radar_items")
      .update({ triage_status: status } as never)
      .eq("id", itemId);

    if (error) {
      throw error;
    }
  },

  async linkApplication(itemId: string, applicationId: string): Promise<void> {
    const { error } = await supabase
      .from("daily_job_radar_items")
      .update({
        linked_application_id: applicationId,
        triage_status: "salva_kanban",
      } as never)
      .eq("id", itemId);

    if (error) {
      throw error;
    }
  },
};
