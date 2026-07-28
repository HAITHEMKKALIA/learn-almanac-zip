export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          school_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generation_logs: {
        Row: {
          created_at: string
          id: string
          model: string | null
          prompt: string | null
          result_json: Json | null
          school_id: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          validated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          model?: string | null
          prompt?: string | null
          result_json?: Json | null
          school_id?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
          validated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          model?: string | null
          prompt?: string | null
          result_json?: Json | null
          school_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_quotas: {
        Row: {
          created_at: string
          daily_generation_cap: number
          id: string
          max_tokens_per_call: number
          per_user_daily_cap: number
          school_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_generation_cap?: number
          id?: string
          max_tokens_per_call?: number
          per_user_daily_cap?: number
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_generation_cap?: number
          id?: string
          max_tokens_per_call?: number
          per_user_daily_cap?: number
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_quotas_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          body: string
          class_id: string | null
          created_at: string
          id: string
          pinned: boolean
          school_id: string | null
          scope: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          class_id?: string | null
          created_at?: string
          id?: string
          pinned?: boolean
          school_id?: string | null
          scope?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          class_id?: string | null
          created_at?: string
          id?: string
          pinned?: boolean
          school_id?: string | null
          scope?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_questions: {
        Row: {
          assignment_id: string
          id: string
          points_override: number | null
          position: number
          question_id: string
        }
        Insert: {
          assignment_id: string
          id?: string
          points_override?: number | null
          position?: number
          question_id: string
        }
        Update: {
          assignment_id?: string
          id?: string
          points_override?: number | null
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_questions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          available_from: string | null
          available_until: string | null
          class_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          level: Database["public"]["Enums"]["cefr_level"]
          lockdown_strict: boolean
          max_attempts: number
          passing_score: number
          proctor_settings: Json
          shuffle_questions: boolean
          status: Database["public"]["Enums"]["assignment_status"]
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          class_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          level: Database["public"]["Enums"]["cefr_level"]
          lockdown_strict?: boolean
          max_attempts?: number
          passing_score?: number
          proctor_settings?: Json
          shuffle_questions?: boolean
          status?: Database["public"]["Enums"]["assignment_status"]
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          class_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          lockdown_strict?: boolean
          max_attempts?: number
          passing_score?: number
          proctor_settings?: Json
          shuffle_questions?: boolean
          status?: Database["public"]["Enums"]["assignment_status"]
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          created_at: string
          id: string
          note: string | null
          session_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          session_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          session_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          class_id: string
          created_at: string
          end_time: string | null
          id: string
          school_id: string
          session_date: string
          start_time: string | null
          status: string
          teacher_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          end_time?: string | null
          id?: string
          school_id: string
          session_date: string
          start_time?: string | null
          status?: string
          teacher_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          end_time?: string | null
          id?: string
          school_id?: string
          session_date?: string
          start_time?: string | null
          status?: string
          teacher_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          school_id: string | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          school_id?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          school_id?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          active: boolean
          code: string
          created_at: string
          criteria: Json
          description_ar: string | null
          description_de: string | null
          description_fr: string | null
          icon: string | null
          id: string
          name_ar: string | null
          name_de: string
          name_fr: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          criteria?: Json
          description_ar?: string | null
          description_de?: string | null
          description_fr?: string | null
          icon?: string | null
          id?: string
          name_ar?: string | null
          name_de: string
          name_fr: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          criteria?: Json
          description_ar?: string | null
          description_de?: string | null
          description_fr?: string | null
          icon?: string | null
          id?: string
          name_ar?: string | null
          name_de?: string
          name_fr?: string
          xp_reward?: number
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          author_id: string
          class_id: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          kind: string
          school_id: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          school_id?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          school_id?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_kind: string
          certificate_number: string
          class_id: string | null
          created_at: string
          final_score: number | null
          id: string
          issued_at: string
          issued_by: string | null
          issuer_type: string
          mention: string | null
          pdf_url: string | null
          school_id: string
          status: string
          student_id: string
          sub_level_id: string | null
          updated_at: string
        }
        Insert: {
          certificate_kind?: string
          certificate_number: string
          class_id?: string | null
          created_at?: string
          final_score?: number | null
          id?: string
          issued_at?: string
          issued_by?: string | null
          issuer_type?: string
          mention?: string | null
          pdf_url?: string | null
          school_id: string
          status?: string
          student_id: string
          sub_level_id?: string | null
          updated_at?: string
        }
        Update: {
          certificate_kind?: string
          certificate_number?: string
          class_id?: string | null
          created_at?: string
          final_score?: number | null
          id?: string
          issued_at?: string
          issued_by?: string | null
          issuer_type?: string
          mention?: string | null
          pdf_url?: string | null
          school_id?: string
          status?: string
          student_id?: string
          sub_level_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_sub_level_id_fkey"
            columns: ["sub_level_id"]
            isOneToOne: false
            referencedRelation: "sub_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participations: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          id: string
          joined_at: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          joined_at?: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          joined_at?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participations_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          scenario_id: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          scenario_id?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          scenario_id?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      class_attendance: {
        Row: {
          class_id: string
          created_at: string
          id: string
          marked_by: string | null
          note: string | null
          session_date: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          marked_by?: string | null
          note?: string | null
          session_date?: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          marked_by?: string | null
          note?: string | null
          session_date?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year_id: string | null
          created_at: string
          current_students_count: number
          description: string | null
          end_date: string | null
          id: string
          invite_code: string
          level: Database["public"]["Enums"]["cefr_level"]
          max_students: number | null
          name: string
          room: string | null
          schedule_json: Json
          school_id: string
          start_date: string | null
          status: string
          sub_level_id: string | null
          teacher_id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          created_at?: string
          current_students_count?: number
          description?: string | null
          end_date?: string | null
          id?: string
          invite_code?: string
          level: Database["public"]["Enums"]["cefr_level"]
          max_students?: number | null
          name: string
          room?: string | null
          schedule_json?: Json
          school_id: string
          start_date?: string | null
          status?: string
          sub_level_id?: string | null
          teacher_id: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          created_at?: string
          current_students_count?: number
          description?: string | null
          end_date?: string | null
          id?: string
          invite_code?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          max_students?: number | null
          name?: string
          room?: string | null
          schedule_json?: Json
          school_id?: string
          start_date?: string | null
          status?: string
          sub_level_id?: string | null
          teacher_id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_sub_level_id_fkey"
            columns: ["sub_level_id"]
            isOneToOne: false
            referencedRelation: "sub_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "school_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_logs: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
          version: string | null
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted: boolean
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
          version?: string | null
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      content_libraries: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          school_id: string | null
          source_library_id: string | null
          status: string
          type: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          school_id?: string | null
          source_library_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          version?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          school_id?: string | null
          source_library_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_libraries_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_libraries_source_library_id_fkey"
            columns: ["source_library_id"]
            isOneToOne: false
            referencedRelation: "content_libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      course_units: {
        Row: {
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          kapitel_number: number | null
          level_id: string | null
          library_id: string
          order_index: number
          status: string
          sub_level_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          kapitel_number?: number | null
          level_id?: string | null
          library_id: string
          order_index?: number
          status?: string
          sub_level_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          kapitel_number?: number | null
          level_id?: string | null
          library_id?: string
          order_index?: number
          status?: string
          sub_level_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_units_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_units_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "content_libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_units_sub_level_id_fkey"
            columns: ["sub_level_id"]
            isOneToOne: false
            referencedRelation: "sub_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          body: string | null
          created_at: string
          deleted_at: string | null
          delivered_at: string | null
          edited_at: string | null
          id: string
          read_at: string | null
          recipient_id: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          delivered_at?: string | null
          edited_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          delivered_at?: string | null
          edited_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          certificate_status: string
          class_id: string
          completed_at: string | null
          created_at: string
          final_score: number | null
          id: string
          joined_at: string
          school_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          certificate_status?: string
          class_id: string
          completed_at?: string | null
          created_at?: string
          final_score?: number | null
          id?: string
          joined_at?: string
          school_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          certificate_status?: string
          class_id?: string
          completed_at?: string | null
          created_at?: string
          final_score?: number | null
          id?: string
          joined_at?: string
          school_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          meta: Json | null
          submission_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          meta?: Json | null
          submission_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_events_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_predictions: {
        Row: {
          advice: string | null
          computed_at: string
          factors: Json
          id: string
          probability: number
          sub_level_id: string | null
          target_level: string | null
          user_id: string
        }
        Insert: {
          advice?: string | null
          computed_at?: string
          factors?: Json
          id?: string
          probability: number
          sub_level_id?: string | null
          target_level?: string | null
          user_id: string
        }
        Update: {
          advice?: string | null
          computed_at?: string
          factors?: Json
          id?: string
          probability?: number
          sub_level_id?: string | null
          target_level?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_predictions_sub_level_id_fkey"
            columns: ["sub_level_id"]
            isOneToOne: false
            referencedRelation: "sub_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          correct_answer_json: Json | null
          created_at: string
          difficulty: number | null
          explanation: string | null
          id: string
          lesson_id: string
          options_json: Json | null
          order_index: number
          question: string
          skill: string | null
          type: string
          updated_at: string
        }
        Insert: {
          correct_answer_json?: Json | null
          created_at?: string
          difficulty?: number | null
          explanation?: string | null
          id?: string
          lesson_id: string
          options_json?: Json | null
          order_index?: number
          question: string
          skill?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          correct_answer_json?: Json | null
          created_at?: string
          difficulty?: number | null
          explanation?: string | null
          id?: string
          lesson_id?: string
          options_json?: Json | null
          order_index?: number
          question?: string
          skill?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_likes: {
        Row: {
          created_at: string
          reply_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          reply_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          reply_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          likes_count: number
          topic_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          topic_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          id: string
          last_activity_at: string
          locked: boolean
          pinned: boolean
          reply_count: number
          school_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string
          content: string
          created_at?: string
          id?: string
          last_activity_at?: string
          locked?: boolean
          pinned?: boolean
          reply_count?: number
          school_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          last_activity_at?: string
          locked?: boolean
          pinned?: boolean
          reply_count?: number
          school_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_topics_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_events: {
        Row: {
          actor_id: string
          actor_role: string
          awarded_points: number | null
          created_at: string
          id: string
          is_correct: boolean | null
          kind: string
          message: string | null
          meta: Json | null
          question_id: string | null
          submission_id: string
          teacher_comment: string | null
        }
        Insert: {
          actor_id: string
          actor_role?: string
          awarded_points?: number | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          kind: string
          message?: string | null
          meta?: Json | null
          question_id?: string | null
          submission_id: string
          teacher_comment?: string | null
        }
        Update: {
          actor_id?: string
          actor_role?: string
          awarded_points?: number | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          kind?: string
          message?: string | null
          meta?: Json | null
          question_id?: string | null
          submission_id?: string
          teacher_comment?: string | null
        }
        Relationships: []
      }
      guardian_links: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          guardian_id: string
          id: string
          relationship: string
          school_id: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          guardian_id: string
          id?: string
          relationship?: string
          school_id?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          guardian_id?: string
          id?: string
          relationship?: string
          school_id?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_links_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          audio_url: string | null
          category: string
          class_id: string
          created_at: string
          due_at: string | null
          id: string
          instructions: string | null
          kind: string
          level: string | null
          max_points: number
          pdf_url: string | null
          status: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          audio_url?: string | null
          category?: string
          class_id: string
          created_at?: string
          due_at?: string | null
          id?: string
          instructions?: string | null
          kind?: string
          level?: string | null
          max_points?: number
          pdf_url?: string | null
          status?: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          audio_url?: string | null
          category?: string
          class_id?: string
          created_at?: string
          due_at?: string | null
          id?: string
          instructions?: string | null
          kind?: string
          level?: string | null
          max_points?: number
          pdf_url?: string | null
          status?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      homework_question_answers: {
        Row: {
          answer: string | null
          awarded_points: number | null
          created_at: string
          id: string
          is_correct: boolean | null
          question_id: string
          submission_id: string
          teacher_comment: string | null
          updated_at: string
        }
        Insert: {
          answer?: string | null
          awarded_points?: number | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          submission_id: string
          teacher_comment?: string | null
          updated_at?: string
        }
        Update: {
          answer?: string | null
          awarded_points?: number | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          submission_id?: string
          teacher_comment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "homework_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_question_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "homework_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_questions: {
        Row: {
          created_at: string
          expected_answer: string | null
          homework_id: string
          id: string
          points: number
          position: number
          prompt: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expected_answer?: string | null
          homework_id: string
          id?: string
          points?: number
          position: number
          prompt: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expected_answer?: string | null
          homework_id?: string
          id?: string
          points?: number
          position?: number
          prompt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_questions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          ai_graded: boolean
          attachment_name: string | null
          attachment_url: string | null
          audio_url: string | null
          content: string | null
          graded_at: string | null
          homework_id: string
          id: string
          score: number | null
          status: string
          student_id: string
          submitted_at: string
          teacher_feedback: string | null
          updated_at: string
        }
        Insert: {
          ai_graded?: boolean
          attachment_name?: string | null
          attachment_url?: string | null
          audio_url?: string | null
          content?: string | null
          graded_at?: string | null
          homework_id: string
          id?: string
          score?: number | null
          status?: string
          student_id: string
          submitted_at?: string
          teacher_feedback?: string | null
          updated_at?: string
        }
        Update: {
          ai_graded?: boolean
          attachment_name?: string | null
          attachment_url?: string | null
          audio_url?: string | null
          content?: string | null
          graded_at?: string | null
          homework_id?: string
          id?: string
          score?: number | null
          status?: string
          student_id?: string
          submitted_at?: string
          teacher_feedback?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      kapitel: {
        Row: {
          color: string | null
          cover_url: string | null
          created_at: string
          icon: string | null
          id: string
          level: string
          number: number
          objectives: Json | null
          position: number
          published: boolean
          slug: string
          subtitle: string | null
          title_de: string
          title_fr: string | null
          updated_at: string
          vocab_themes: string[] | null
        }
        Insert: {
          color?: string | null
          cover_url?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          level: string
          number: number
          objectives?: Json | null
          position?: number
          published?: boolean
          slug: string
          subtitle?: string | null
          title_de: string
          title_fr?: string | null
          updated_at?: string
          vocab_themes?: string[] | null
        }
        Update: {
          color?: string | null
          cover_url?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          level?: string
          number?: number
          objectives?: Json | null
          position?: number
          published?: boolean
          slug?: string
          subtitle?: string | null
          title_de?: string
          title_fr?: string | null
          updated_at?: string
          vocab_themes?: string[] | null
        }
        Relationships: []
      }
      kapitel_progress: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          kapitel_id: string
          score: number | null
          section_id: string
          time_spent_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          kapitel_id: string
          score?: number | null
          section_id: string
          time_spent_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          kapitel_id?: string
          score?: number | null
          section_id?: string
          time_spent_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kapitel_progress_kapitel_id_fkey"
            columns: ["kapitel_id"]
            isOneToOne: false
            referencedRelation: "kapitel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kapitel_progress_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "kapitel_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      kapitel_sections: {
        Row: {
          content: Json
          created_at: string
          estimated_minutes: number | null
          id: string
          kapitel_id: string
          kind: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          kapitel_id: string
          kind: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          kapitel_id?: string
          kind?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kapitel_sections_kapitel_id_fkey"
            columns: ["kapitel_id"]
            isOneToOne: false
            referencedRelation: "kapitel"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_recommendations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kind: string
          metadata: Json | null
          priority: number
          status: string
          target_ref: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          metadata?: Json | null
          priority?: number
          status?: string
          target_ref?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json | null
          priority?: number
          status?: string
          target_ref?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_sections: {
        Row: {
          content_json: Json | null
          created_at: string
          id: string
          lesson_id: string
          media_url: string | null
          order_index: number
          title: string | null
          type: string
        }
        Insert: {
          content_json?: Json | null
          created_at?: string
          id?: string
          lesson_id: string
          media_url?: string | null
          order_index?: number
          title?: string | null
          type: string
        }
        Update: {
          content_json?: Json | null
          created_at?: string
          id?: string
          lesson_id?: string
          media_url?: string | null
          order_index?: number
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sections_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_source: string
          content_version: number
          course_unit_id: string
          created_at: string
          description: string | null
          difficulty: number | null
          estimated_minutes: number | null
          id: string
          order_index: number
          skill: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content_source?: string
          content_version?: number
          course_unit_id: string
          created_at?: string
          description?: string | null
          difficulty?: number | null
          estimated_minutes?: number | null
          id?: string
          order_index?: number
          skill?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content_source?: string
          content_version?: number
          course_unit_id?: string
          created_at?: string
          description?: string | null
          difficulty?: number | null
          estimated_minutes?: number | null
          id?: string
          order_index?: number
          skill?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_unit_id_fkey"
            columns: ["course_unit_id"]
            isOneToOne: false
            referencedRelation: "course_units"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          created_at: string
          id: string
          lesson_id: string | null
          metadata_json: Json | null
          owner_id: string | null
          school_id: string | null
          title: string | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id?: string | null
          metadata_json?: Json | null
          owner_id?: string | null
          school_id?: string | null
          title?: string | null
          type: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string | null
          metadata_json?: Json | null
          owner_id?: string | null
          school_id?: string | null
          title?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          metadata: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      placement_tests: {
        Row: {
          answers: Json
          completed_at: string | null
          created_at: string
          id: string
          questions: Json
          recommended_level: string | null
          school_id: string | null
          score: number | null
          status: string
          strengths: Json | null
          user_id: string
          weaknesses: Json | null
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          created_at?: string
          id?: string
          questions?: Json
          recommended_level?: string | null
          school_id?: string | null
          score?: number | null
          status?: string
          strengths?: Json | null
          user_id: string
          weaknesses?: Json | null
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          created_at?: string
          id?: string
          questions?: Json
          recommended_level?: string | null
          school_id?: string | null
          score?: number | null
          status?: string
          strengths?: Json | null
          user_id?: string
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "placement_tests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_prices: {
        Row: {
          active: boolean
          billing_period_months: number
          created_at: string
          id: string
          label: string
          notes: string | null
          plan_code: string
          price_tnd: number
          school_id: string | null
          scope: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing_period_months?: number
          created_at?: string
          id?: string
          label: string
          notes?: string | null
          plan_code: string
          price_tnd?: number
          school_id?: string | null
          scope: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing_period_months?: number
          created_at?: string
          id?: string
          label?: string
          notes?: string | null
          plan_code?: string
          price_tnd?: number
          school_id?: string | null
          scope?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_prices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          default_language: string
          default_timezone: string
          extra: Json
          global_ai_quota_daily: number
          id: string
          maintenance_mode: boolean
          platform_logo_url: string | null
          platform_name: string
          privacy_url: string | null
          support_email: string | null
          terms_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_language?: string
          default_timezone?: string
          extra?: Json
          global_ai_quota_daily?: number
          id?: string
          maintenance_mode?: boolean
          platform_logo_url?: string | null
          platform_name?: string
          privacy_url?: string | null
          support_email?: string | null
          terms_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_language?: string
          default_timezone?: string
          extra?: Json
          global_ai_quota_daily?: number
          id?: string
          maintenance_mode?: boolean
          platform_logo_url?: string | null
          platform_name?: string
          privacy_url?: string | null
          support_email?: string | null
          terms_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved: boolean
          avatar_style: string | null
          avatar_url: string | null
          birth_year: number | null
          created_at: string
          deletion_requested_at: string | null
          display_name: string | null
          email: string | null
          gender: string | null
          guardian_email: string | null
          id: string
          is_minor: boolean | null
          marketing_opt_in: boolean | null
          preferred_lang: string
          privacy_accepted_at: string | null
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          avatar_style?: string | null
          avatar_url?: string | null
          birth_year?: number | null
          created_at?: string
          deletion_requested_at?: string | null
          display_name?: string | null
          email?: string | null
          gender?: string | null
          guardian_email?: string | null
          id?: string
          is_minor?: boolean | null
          marketing_opt_in?: boolean | null
          preferred_lang?: string
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          avatar_style?: string | null
          avatar_url?: string | null
          birth_year?: number | null
          created_at?: string
          deletion_requested_at?: string | null
          display_name?: string | null
          email?: string | null
          gender?: string | null
          guardian_email?: string | null
          id?: string
          is_minor?: boolean | null
          marketing_opt_in?: boolean | null
          preferred_lang?: string
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_bank: {
        Row: {
          audio_text: string | null
          correct_answer: string
          created_at: string
          explanation_ar: string | null
          explanation_fr: string | null
          id: string
          is_public: boolean
          kind: Database["public"]["Enums"]["question_kind"]
          level: Database["public"]["Enums"]["cefr_level"]
          options_ar: Json | null
          options_de: Json | null
          options_fr: Json | null
          owner_id: string | null
          points: number
          prompt_ar: string | null
          prompt_de: string
          prompt_fr: string | null
          skill: Database["public"]["Enums"]["question_skill"]
          source: Database["public"]["Enums"]["question_source"]
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          audio_text?: string | null
          correct_answer: string
          created_at?: string
          explanation_ar?: string | null
          explanation_fr?: string | null
          id?: string
          is_public?: boolean
          kind: Database["public"]["Enums"]["question_kind"]
          level: Database["public"]["Enums"]["cefr_level"]
          options_ar?: Json | null
          options_de?: Json | null
          options_fr?: Json | null
          owner_id?: string | null
          points?: number
          prompt_ar?: string | null
          prompt_de: string
          prompt_fr?: string | null
          skill: Database["public"]["Enums"]["question_skill"]
          source?: Database["public"]["Enums"]["question_source"]
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          audio_text?: string | null
          correct_answer?: string
          created_at?: string
          explanation_ar?: string | null
          explanation_fr?: string | null
          id?: string
          is_public?: boolean
          kind?: Database["public"]["Enums"]["question_kind"]
          level?: Database["public"]["Enums"]["cefr_level"]
          options_ar?: Json | null
          options_de?: Json | null
          options_fr?: Json | null
          owner_id?: string | null
          points?: number
          prompt_ar?: string | null
          prompt_de?: string
          prompt_fr?: string | null
          skill?: Database["public"]["Enums"]["question_skill"]
          source?: Database["public"]["Enums"]["question_source"]
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          contact_name: string
          created_at: string
          email: string
          id: string
          internal_notes: string | null
          message: string | null
          organization: string | null
          phone: string | null
          plan: string
          status: string
          student_count: number | null
          updated_at: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          email: string
          id?: string
          internal_notes?: string | null
          message?: string | null
          organization?: string | null
          phone?: string | null
          plan: string
          status?: string
          student_count?: number | null
          updated_at?: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          internal_notes?: string | null
          message?: string | null
          organization?: string | null
          phone?: string | null
          plan?: string
          status?: string
          student_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      room_messages: {
        Row: {
          content: string
          created_at: string
          display_name: string | null
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          display_name?: string | null
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string | null
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "virtual_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      school_members: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          id: string
          joined_at: string
          requested_class_id: string | null
          review_reason: string | null
          reviewed_at: string | null
          role: Database["public"]["Enums"]["school_role"]
          school_id: string
          space_role: Database["public"]["Enums"]["app_role"] | null
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          joined_at?: string
          requested_class_id?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          role?: Database["public"]["Enums"]["school_role"]
          school_id: string
          space_role?: Database["public"]["Enums"]["app_role"] | null
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          joined_at?: string
          requested_class_id?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          role?: Database["public"]["Enums"]["school_role"]
          school_id?: string
          space_role?: Database["public"]["Enums"]["app_role"] | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_members_requested_class_id_fkey"
            columns: ["requested_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_members_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_rules: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          rule_key: string
          rule_value: Json
          school_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          rule_key: string
          rule_value?: Json
          school_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          rule_key?: string
          rule_value?: Json
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_rules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_settings: {
        Row: {
          allow_self_registration: boolean
          attendance_required_percentage: number
          auto_certificate: boolean
          certificate_template_id: string | null
          created_at: string
          extra: Json
          id: string
          language_default: string
          passing_score: number
          require_admin_approval: boolean
          school_id: string
          student_can_join_by_code: boolean
          teacher_can_create_content: boolean
          teacher_can_create_exam: boolean
          timezone: string
          updated_at: string
        }
        Insert: {
          allow_self_registration?: boolean
          attendance_required_percentage?: number
          auto_certificate?: boolean
          certificate_template_id?: string | null
          created_at?: string
          extra?: Json
          id?: string
          language_default?: string
          passing_score?: number
          require_admin_approval?: boolean
          school_id: string
          student_can_join_by_code?: boolean
          teacher_can_create_content?: boolean
          teacher_can_create_exam?: boolean
          timezone?: string
          updated_at?: string
        }
        Update: {
          allow_self_registration?: boolean
          attendance_required_percentage?: number
          auto_certificate?: boolean
          certificate_template_id?: string | null
          created_at?: string
          extra?: Json
          id?: string
          language_default?: string
          passing_score?: number
          require_admin_approval?: boolean
          school_id?: string
          student_can_join_by_code?: boolean
          teacher_can_create_content?: boolean
          teacher_can_create_exam?: boolean
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_terms: {
        Row: {
          academic_year_id: string
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          school_id: string
          start_date: string
          term_type: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          start_date: string
          term_type?: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          start_date?: string
          term_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_terms_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_terms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_independent: boolean
          legal_name: string | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          review_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          status: string
          tenant_type: string
          trial_ends_at: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_independent?: boolean
          legal_name?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          status?: string
          tenant_type?: string
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_independent?: boolean
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          status?: string
          tenant_type?: string
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      solo_student_settings: {
        Row: {
          ai_tutor_enabled: boolean
          created_at: string
          current_level: string | null
          id: string
          learning_goal: string | null
          public_progress_enabled: boolean
          school_id: string
          student_id: string
          target_level: string | null
          updated_at: string
          weekly_goal_minutes: number | null
        }
        Insert: {
          ai_tutor_enabled?: boolean
          created_at?: string
          current_level?: string | null
          id?: string
          learning_goal?: string | null
          public_progress_enabled?: boolean
          school_id: string
          student_id: string
          target_level?: string | null
          updated_at?: string
          weekly_goal_minutes?: number | null
        }
        Update: {
          ai_tutor_enabled?: boolean
          created_at?: string
          current_level?: string | null
          id?: string
          learning_goal?: string | null
          public_progress_enabled?: boolean
          school_id?: string
          student_id?: string
          target_level?: string | null
          updated_at?: string
          weekly_goal_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "solo_student_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_levels: {
        Row: {
          code: string
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          level_id: string
          name: string
          order_index: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          level_id: string
          name: string
          order_index?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          level_id?: string
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "sub_levels_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_answers: {
        Row: {
          ai_graded: boolean
          answer: string | null
          answered_at: string
          awarded_points: number | null
          grading_status: Database["public"]["Enums"]["grading_status"]
          id: string
          is_correct: boolean | null
          question_id: string
          submission_id: string
          teacher_comment: string | null
        }
        Insert: {
          ai_graded?: boolean
          answer?: string | null
          answered_at?: string
          awarded_points?: number | null
          grading_status?: Database["public"]["Enums"]["grading_status"]
          id?: string
          is_correct?: boolean | null
          question_id: string
          submission_id: string
          teacher_comment?: string | null
        }
        Update: {
          ai_graded?: boolean
          answer?: string | null
          answered_at?: string
          awarded_points?: number | null
          grading_status?: Database["public"]["Enums"]["grading_status"]
          id?: string
          is_correct?: boolean | null
          question_id?: string
          submission_id?: string
          teacher_comment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string
          attempt_no: number
          created_at: string
          expires_at: string | null
          id: string
          released_at: string | null
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submitted_at: string | null
          teacher_feedback: string | null
          total: number | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          attempt_no?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          released_at?: string | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submitted_at?: string | null
          teacher_feedback?: string | null
          total?: number | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          attempt_no?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          released_at?: string | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          student_id?: string
          submitted_at?: string | null
          teacher_feedback?: string | null
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          owner_user_id: string | null
          paid_at: string | null
          payment_method: string | null
          plan: string
          price_tnd: number
          school_id: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          owner_user_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          plan: string
          price_tnd: number
          school_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          owner_user_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          plan?: string
          price_tnd?: number
          school_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          assigned_at: string
          class_id: string
          id: string
          role: string
          school_id: string
          teacher_id: string
        }
        Insert: {
          assigned_at?: string
          class_id: string
          id?: string
          role?: string
          school_id: string
          teacher_id: string
        }
        Update: {
          assigned_at?: string
          class_id?: string
          id?: string
          role?: string
          school_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_studio_settings: {
        Row: {
          allow_certificates: boolean
          allow_online_classes: boolean
          allow_student_self_join: boolean
          created_at: string
          default_language: string | null
          default_level: string | null
          id: string
          max_students_per_class: number | null
          public_profile_enabled: boolean
          require_teacher_approval: boolean
          school_id: string
          studio_name: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          allow_certificates?: boolean
          allow_online_classes?: boolean
          allow_student_self_join?: boolean
          created_at?: string
          default_language?: string | null
          default_level?: string | null
          id?: string
          max_students_per_class?: number | null
          public_profile_enabled?: boolean
          require_teacher_approval?: boolean
          school_id: string
          studio_name: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          allow_certificates?: boolean
          allow_online_classes?: boolean
          allow_student_self_join?: boolean
          created_at?: string
          default_language?: string | null
          default_level?: string | null
          id?: string
          max_students_per_class?: number | null
          public_profile_enabled?: boolean
          require_teacher_approval?: boolean
          school_id?: string
          studio_name?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_studio_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          last_seen_at: string
          user_id: string
        }
        Insert: {
          last_seen_at?: string
          user_id: string
        }
        Update: {
          last_seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          lesson_id: string
          score: number | null
          session_id: string
          total: number | null
          unit_id: string
          updated_at: string
          user_id: string | null
          vocab_mastered: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          lesson_id: string
          score?: number | null
          session_id: string
          total?: number | null
          unit_id: string
          updated_at?: string
          user_id?: string | null
          vocab_mastered?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          lesson_id?: string
          score?: number | null
          session_id?: string
          total?: number | null
          unit_id?: string
          updated_at?: string
          user_id?: string | null
          vocab_mastered?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string
          current_streak: number
          last_activity_date: string | null
          level: number
          longest_streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      virtual_rooms: {
        Row: {
          class_id: string | null
          code: string
          created_at: string
          ended_at: string | null
          host_id: string
          id: string
          school_id: string | null
          started_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          code: string
          created_at?: string
          ended_at?: string | null
          host_id: string
          id?: string
          school_id?: string | null
          started_at?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          code?: string
          created_at?: string
          ended_at?: string | null
          host_id?: string
          id?: string
          school_id?: string | null
          started_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_rooms_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_rooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      vocab_entries: {
        Row: {
          article: string | null
          chapter: number | null
          created_at: string
          example_de: string | null
          example_fr: string | null
          frequency: number | null
          id: string
          ipa: string | null
          level: string
          plural: string | null
          pos: string | null
          theme_slug: string | null
          translation_ar: string | null
          translation_fr: string | null
          word: string
        }
        Insert: {
          article?: string | null
          chapter?: number | null
          created_at?: string
          example_de?: string | null
          example_fr?: string | null
          frequency?: number | null
          id?: string
          ipa?: string | null
          level: string
          plural?: string | null
          pos?: string | null
          theme_slug?: string | null
          translation_ar?: string | null
          translation_fr?: string | null
          word: string
        }
        Update: {
          article?: string | null
          chapter?: number | null
          created_at?: string
          example_de?: string | null
          example_fr?: string | null
          frequency?: number | null
          id?: string
          ipa?: string | null
          level?: string
          plural?: string | null
          pos?: string | null
          theme_slug?: string | null
          translation_ar?: string | null
          translation_fr?: string | null
          word?: string
        }
        Relationships: []
      }
      vocab_progress: {
        Row: {
          box: number
          correct_count: number
          id: string
          next_review_at: string
          updated_at: string
          user_id: string
          vocab_id: string
          wrong_count: number
        }
        Insert: {
          box?: number
          correct_count?: number
          id?: string
          next_review_at?: string
          updated_at?: string
          user_id: string
          vocab_id: string
          wrong_count?: number
        }
        Update: {
          box?: number
          correct_count?: number
          id?: string
          next_review_at?: string
          updated_at?: string
          user_id?: string
          vocab_id?: string
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "vocab_progress_vocab_id_fkey"
            columns: ["vocab_id"]
            isOneToOne: false
            referencedRelation: "vocab_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      vocab_themes: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          level: string
          name_de: string
          name_fr: string
          position: number
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          level: string
          name_de: string
          name_fr: string
          position?: number
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          level?: string
          name_de?: string
          name_fr?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      weekly_challenges: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          school_id: string | null
          starts_at: string
          target_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          school_id?: string | null
          starts_at?: string
          target_value?: number
          title: string
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          school_id?: string | null
          starts_at?: string
          target_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_challenges_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          ref_id: string | null
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          ref_id?: string | null
          user_id: string
          xp: number
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          ref_id?: string | null
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_assign_user: {
        Args: {
          _class_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _school_id: string
          _target: string
        }
        Returns: undefined
      }
      admin_create_class: {
        Args: {
          _level: string
          _name: string
          _school_id: string
          _teacher_id: string
        }
        Returns: string
      }
      admin_delete_class: { Args: { _class_id: string }; Returns: undefined }
      admin_delete_school: { Args: { _school_id: string }; Returns: undefined }
      admin_delete_user: { Args: { _target: string }; Returns: undefined }
      admin_deletion_requests: {
        Args: never
        Returns: {
          display_name: string
          email: string
          requested_at: string
          user_id: string
        }[]
      }
      admin_gdpr_export: { Args: { _target: string }; Returns: Json }
      admin_pending_members: {
        Args: never
        Returns: {
          display_name: string
          email: string
          id: string
          joined_at: string
          role: string
          school_id: string
          school_name: string
          status: string
          user_id: string
        }[]
      }
      admin_pending_profiles: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          user_id: string
        }[]
      }
      admin_pending_schools: {
        Args: never
        Returns: {
          created_at: string
          id: string
          name: string
          owner_email: string
          owner_id: string
          owner_name: string
          tenant_type: string
        }[]
      }
      admin_remove_from_class: {
        Args: { _class_id: string; _target: string }
        Returns: undefined
      }
      admin_set_approved: {
        Args: { _approved: boolean; _target: string }
        Returns: undefined
      }
      admin_set_class_status: {
        Args: { _class_id: string; _status: string }
        Returns: undefined
      }
      admin_set_school_status: {
        Args: { _school_id: string; _status: string }
        Returns: undefined
      }
      admin_update_profile: {
        Args: { _display_name: string; _target: string }
        Returns: undefined
      }
      award_xp: {
        Args: {
          _event_type: string
          _metadata?: Json
          _ref_id?: string
          _xp: number
        }
        Returns: {
          created_at: string
          current_streak: number
          last_activity_date: string | null
          level: number
          longest_streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "user_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_access_learning_space: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_class: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_learning_space: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      can_read_library: {
        Args: { _library_id: string; _user_id: string }
        Returns: boolean
      }
      can_write_library: {
        Args: { _library_id: string; _user_id: string }
        Returns: boolean
      }
      check_ai_quota: { Args: { _school_id: string }; Returns: boolean }
      class_progress_report: {
        Args: { _class_id: string }
        Returns: {
          attendance_rate: number
          attended: number
          current_streak: number
          display_name: string
          email: string
          last_activity_date: string
          level: number
          student_id: string
          total_sessions: number
          xp: number
        }[]
      }
      compute_exam_prediction: {
        Args: { _target_level?: string }
        Returns: {
          advice: string | null
          computed_at: string
          factors: Json
          id: string
          probability: number
          sub_level_id: string | null
          target_level: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "exam_predictions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_independent_student_space: {
        Args: { _current_level?: string }
        Returns: string
      }
      create_independent_teacher_space: {
        Args: { _display_name?: string; _studio_name: string }
        Returns: string
      }
      gdpr_export_my_data: { Args: never; Returns: Json }
      gdpr_request_deletion: { Args: never; Returns: undefined }
      get_class_roster: {
        Args: { _class_id: string }
        Returns: {
          approved: boolean
          avatar_url: string
          display_name: string
          email: string
          gender: string
          joined_at: string
          roles: string[]
          student_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_school_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _school_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      is_approved_member: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_class_member: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_class_teacher: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_class_teacher_any: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_guardian_of: {
        Args: { _guardian: string; _student: string }
        Returns: boolean
      }
      is_independent_student_owner: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_independent_teacher_owner: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_school_member: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_school_owner: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_school_teacher: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _uid: string }; Returns: boolean }
      is_teacher_or_admin: { Args: { _user_id: string }; Returns: boolean }
      issue_certificate: {
        Args: {
          _class_id?: string
          _final_score: number
          _mention?: string
          _school_id: string
          _student_id: string
          _sub_level_id: string
        }
        Returns: string
      }
      join_class_by_code: { Args: { _code: string }; Returns: string }
      list_public_schools: {
        Args: never
        Returns: {
          id: string
          kind: string
          name: string
        }[]
      }
      log_audit: {
        Args: {
          _action: string
          _metadata?: Json
          _school_id: string
          _target_id: string
          _target_table: string
        }
        Returns: undefined
      }
      my_learning_spaces: {
        Args: never
        Returns: {
          id: string
          is_independent: boolean
          logo_url: string
          name: string
          role: string
          slug: string
          tenant_type: string
        }[]
      }
      my_pending_space_requests: {
        Args: never
        Returns: {
          id: string
          membership_status: string
          name: string
          requested_at: string
          school_status: string
          tenant_type: string
        }[]
      }
      my_schools: {
        Args: never
        Returns: {
          id: string
          logo_url: string
          name: string
          role: string
          slug: string
        }[]
      }
      platform_review_membership: {
        Args: { _decision: string; _membership_id: string; _reason?: string }
        Returns: undefined
      }
      platform_review_school: {
        Args: { _decision: string; _reason?: string; _school_id: string }
        Returns: undefined
      }
      promote_students: {
        Args: { _student_ids: string[]; _target_class_id: string }
        Returns: number
      }
      record_my_legal_consent: {
        Args: {
          _privacy_version: string
          _terms_version: string
          _user_agent?: string
        }
        Returns: undefined
      }
      request_join_school: {
        Args: { _role: string; _school_id: string }
        Returns: string
      }
      request_school_space: { Args: { _school_name: string }; Returns: string }
      school_assign_student_to_class: {
        Args: { _class_id: string; _school_id: string; _target: string }
        Returns: undefined
      }
      school_members_full: {
        Args: { _school_id: string }
        Returns: {
          app_roles: string[]
          approved: boolean
          classes: string[]
          display_name: string
          email: string
          school_role: Database["public"]["Enums"]["school_role"]
          user_id: string
        }[]
      }
      school_remove_member: {
        Args: { _school_id: string; _user_id: string }
        Returns: undefined
      }
      school_review_membership: {
        Args: {
          _class_id?: string
          _decision: string
          _reason?: string
          _school_id: string
          _space_role?: string
          _user_id: string
        }
        Returns: undefined
      }
      send_notification: {
        Args: {
          _body?: string
          _link?: string
          _metadata?: Json
          _title: string
          _type: string
          _user_ids: string[]
        }
        Returns: number
      }
      student_can_access_questions: {
        Args: { _assignment_id: string; _user_id: string }
        Returns: boolean
      }
      student_can_view_teacher_presence: {
        Args: { _student: string; _teacher: string }
        Returns: boolean
      }
      student_full_report: {
        Args: { _student_id: string }
        Returns: {
          badges_count: number
          certificates_count: number
          classes_count: number
          current_streak: number
          level: number
          longest_streak: number
          xp: number
        }[]
      }
      teacher_can_view_student: {
        Args: { _student: string; _teacher: string }
        Returns: boolean
      }
      users_share_school: {
        Args: { _left_user: string; _right_user: string }
        Returns: boolean
      }
      verify_certificate: {
        Args: { _number: string }
        Returns: {
          certificate_number: string
          final_score: number
          issued_at: string
          mention: string
          school_name: string
          status: string
          student_name: string
          sub_level: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "teacher"
        | "student"
        | "super_admin"
        | "school_admin"
        | "academic_director"
        | "pedagogical_coordinator"
        | "examiner"
        | "parent"
        | "staff"
      assignment_status: "draft" | "scheduled" | "open" | "closed"
      cefr_level: "A1" | "A2" | "B1" | "B2"
      grading_status:
        | "pending"
        | "ai_running"
        | "ai_failed"
        | "ai_graded"
        | "manual_graded"
      question_kind: "qcm" | "audio" | "translate" | "write" | "speak"
      question_skill:
        | "lesen"
        | "hoeren"
        | "schreiben"
        | "sprechen"
        | "wortschatz"
        | "grammatik"
      question_source: "goethe" | "oesd" | "custom"
      school_role: "owner" | "teacher" | "student"
      submission_status:
        | "not_started"
        | "in_progress"
        | "submitted"
        | "graded"
        | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "teacher",
        "student",
        "super_admin",
        "school_admin",
        "academic_director",
        "pedagogical_coordinator",
        "examiner",
        "parent",
        "staff",
      ],
      assignment_status: ["draft", "scheduled", "open", "closed"],
      cefr_level: ["A1", "A2", "B1", "B2"],
      grading_status: [
        "pending",
        "ai_running",
        "ai_failed",
        "ai_graded",
        "manual_graded",
      ],
      question_kind: ["qcm", "audio", "translate", "write", "speak"],
      question_skill: [
        "lesen",
        "hoeren",
        "schreiben",
        "sprechen",
        "wortschatz",
        "grammatik",
      ],
      question_source: ["goethe", "oesd", "custom"],
      school_role: ["owner", "teacher", "student"],
      submission_status: [
        "not_started",
        "in_progress",
        "submitted",
        "graded",
        "expired",
      ],
    },
  },
} as const
