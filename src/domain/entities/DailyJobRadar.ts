import type {
  DailyRadarRunStatus,
  RadarFitCategory,
  RadarTriageStatus,
  WorkModel,
} from "../../shared/types/database.types";

export interface DailyRadarRun {
  id: string;
  user_id: string;
  run_date: string;
  status: DailyRadarRunStatus;
  source: string;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface DailyRadarItem {
  id: string;
  user_id: string;
  run_id: string | null;
  source: string;
  external_id: string;
  fingerprint: string;
  title: string;
  company_name: string;
  location_raw: string;
  work_model: WorkModel;
  is_brasilia_df: boolean;
  summary_snippet: string;
  source_url: string;
  published_at: string | null;
  direct_fit_score: number;
  adaptability_score: number;
  fit_category: RadarFitCategory;
  matched_facts: string[];
  adaptability_notes: string;
  triage_status: RadarTriageStatus;
  linked_application_id: string | null;
  created_at: string;
  updated_at: string;
}

export type RadarTriggerMode = "auto" | "retry";

export type RadarTriggerStatus =
  | "completed"
  | "already_ran"
  | "running"
  | "failed"
  | "missing_profile";

export interface RadarTriggerResponse {
  status: RadarTriggerStatus;
  run: DailyRadarRun | null;
  items: DailyRadarItem[];
  error?: string;
}

export interface RadarJobDraft {
  radarItemId: string;
  jobTitle: string;
  companyName: string;
  sourceUrl: string;
  jobDescription: string;
  workModel: WorkModel;
}
