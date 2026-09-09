export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          application_no: string
          candidate_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          job_id: string
          kvkk_consent: boolean
          kvkk_consent_at: string | null
          last_activity_at: string
          linkedin_url: string | null
          match_score: number | null
          phone: string
          resume_mime: string | null
          resume_path: string | null
          screening_answers: Json
          source: string
          stage: Database["public"]["Enums"]["application_stage"]
        }
        Insert: {
          application_no: string
          candidate_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          job_id: string
          kvkk_consent?: boolean
          kvkk_consent_at?: string | null
          last_activity_at?: string
          linkedin_url?: string | null
          match_score?: number | null
          phone: string
          resume_mime?: string | null
          resume_path?: string | null
          screening_answers?: Json
          source?: string
          stage?: Database["public"]["Enums"]["application_stage"]
        }
        Update: {
          application_no?: string
          candidate_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          job_id?: string
          kvkk_consent?: boolean
          kvkk_consent_at?: string | null
          last_activity_at?: string
          linkedin_url?: string | null
          match_score?: number | null
          phone?: string
          resume_mime?: string | null
          resume_path?: string | null
          screening_answers?: Json
          source?: string
          stage?: Database["public"]["Enums"]["application_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applicant_count: number
          department: string
          description: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          id: string
          is_active: boolean
          job_no: string
          location: string
          posted_at: string
          requirements: string[]
          screening_questions: Json
          title: string
        }
        Insert: {
          applicant_count?: number
          department: string
          description: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          is_active?: boolean
          job_no: string
          location: string
          posted_at?: string
          requirements?: string[]
          screening_questions?: Json
          title: string
        }
        Update: {
          applicant_count?: number
          department?: string
          description?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          is_active?: boolean
          job_no?: string
          location?: string
          posted_at?: string
          requirements?: string[]
          screening_questions?: Json
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          username: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          username: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      application_stage:
        | "ilk_basvuru"
        | "telefon_gorusmesi"
        | "teknik_mulakat"
        | "teklif"
        | "ise_alindi"
      employment_type:
        | "tam_zamanli"
        | "yari_zamanli"
        | "uzaktan"
        | "hibrit"
        | "staj"
      user_role: "aday" | "uzman" | "yonetici" | "mudur"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]
