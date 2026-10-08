export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = 'user' | 'admin';
export type WorkModel = 'presencial' | 'hibrido' | 'remoto';
export type ApplicationStatus =
  | 'rascunho'
  | 'curriculo_gerado'
  | 'curriculo_enviado'
  | 'triagem_inicial'
  | 'contato_rh'
  | 'entrevista_tecnica'
  | 'entrevista_gestor'
  | 'aguardando_retorno'
  | 'aprovado'
  | 'reprovado'
  | 'desistencia';

export type FactType =
  | 'experience'
  | 'education'
  | 'certification'
  | 'skill'
  | 'project'
  | 'language'
  | 'personal_info';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          target_role: string | null;
          phone: string | null;
          city: string | null;
          age: string | null;
          linkedin_url: string | null;
          github_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          target_role?: string | null;
          phone?: string | null;
          city?: string | null;
          age?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      master_facts: {
        Row: {
          id: string;
          user_id: string;
          type: FactType;
          data: Json;
          source_resume_id: string | null;
          position: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: FactType;
          data: Json;
          source_resume_id?: string | null;
          position?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['master_facts']['Insert']>;
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          title: string;
          source_url: string | null;
          raw_description: string;
          analysis: Json | null;
          is_open: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id?: string | null;
          title: string;
          source_url?: string | null;
          raw_description: string;
          analysis?: Json | null;
          is_open?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
      };
      job_applications: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          recruiter_id: string | null;
          status: ApplicationStatus;
          match_overall: number | null;
          match_technical: number | null;
          match_behavioral: number | null;
          salary_range_min: number | null;
          salary_range_max: number | null;
          salary_offered: number | null;
          work_schedule: string | null;
          work_model: WorkModel | null;
          benefits: string | null;
          notes: string | null;
          applied_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id: string;
          recruiter_id?: string | null;
          status?: ApplicationStatus;
          match_overall?: number | null;
          match_technical?: number | null;
          match_behavioral?: number | null;
          salary_range_min?: number | null;
          salary_range_max?: number | null;
          salary_offered?: number | null;
          work_schedule?: string | null;
          work_model?: WorkModel | null;
          benefits?: string | null;
          notes?: string | null;
          applied_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['job_applications']['Insert']>;
      };
      resume_versions: {
        Row: {
          id: string;
          user_id: string;
          application_id: string | null;
          template_id: string | null;
          version: number;
          content: Json;
          pdf_path: string | null;
          ats_score: number | null;
          validation_report: Json | null;
          status: string;
          was_sent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          application_id?: string | null;
          template_id?: string | null;
          version?: number;
          content: Json;
          pdf_path?: string | null;
          ats_score?: number | null;
          validation_report?: Json | null;
          status?: string;
          was_sent?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['resume_versions']['Insert']>;
      };
      email_logs: {
        Row: {
          id: string;
          user_id: string;
          application_id: string | null;
          resume_version_id: string | null;
          to_email: string;
          subject: string;
          body: string;
          status: string;
          error: string | null;
          graph_message_id: string | null;
          sent_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          application_id?: string | null;
          resume_version_id?: string | null;
          to_email: string;
          subject: string;
          body: string;
          status: string;
          error?: string | null;
          graph_message_id?: string | null;
          sent_at?: string;
        };
        Update: Partial<Database['public']['Tables']['email_logs']['Insert']>;
      };
    };
  };
}
