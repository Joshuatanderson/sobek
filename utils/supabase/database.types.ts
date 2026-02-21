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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          application_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          display_address: string | null
          id: string
          lat: number | null
          lng: number | null
          location_id: string | null
          place_id: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_address?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location_id?: string | null
          place_id?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_address?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location_id?: string | null
          place_id?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_consents: {
        Row: {
          application_id: string | null
          consent_data: Json
          consent_version_id: number | null
          created_at: string | null
          id: string
          ip_address: string | null
          phone_number: string
        }
        Insert: {
          application_id?: string | null
          consent_data: Json
          consent_version_id?: number | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          phone_number: string
        }
        Update: {
          application_id?: string | null
          consent_data?: Json
          consent_version_id?: number | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          phone_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_consents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_consents_consent_version_id_fkey"
            columns: ["consent_version_id"]
            isOneToOne: false
            referencedRelation: "consent_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      apollo_enrichment_requests: {
        Row: {
          apollo_person_id: string | null
          attio_company_id: string | null
          attio_person_id: string | null
          completed_at: string | null
          created_at: string | null
          enriched_by: string | null
          error_message: string | null
          id: string
          input_data: Json
          person_data: Json | null
          phone_numbers: Json | null
          request_id: string
          status: string | null
        }
        Insert: {
          apollo_person_id?: string | null
          attio_company_id?: string | null
          attio_person_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          enriched_by?: string | null
          error_message?: string | null
          id?: string
          input_data: Json
          person_data?: Json | null
          phone_numbers?: Json | null
          request_id: string
          status?: string | null
        }
        Update: {
          apollo_person_id?: string | null
          attio_company_id?: string | null
          attio_person_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          enriched_by?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json
          person_data?: Json | null
          phone_numbers?: Json | null
          request_id?: string
          status?: string | null
        }
        Relationships: []
      }
      applicant_feedback: {
        Row: {
          application_id: string | null
          created_at: string
          feedback: string | null
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_feedback_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_availability: {
        Row: {
          application_id: string | null
          created_at: string | null
          day: Database["public"]["Enums"]["day_of_week"]
          id: string
          timeslot: Database["public"]["Enums"]["timeslot"]
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          day: Database["public"]["Enums"]["day_of_week"]
          id?: string
          timeslot: Database["public"]["Enums"]["timeslot"]
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          day?: Database["public"]["Enums"]["day_of_week"]
          id?: string
          timeslot?: Database["public"]["Enums"]["timeslot"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applicant_unavailability_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicant_unavailability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      application_hourly_shift_availability: {
        Row: {
          application_id: string
          created_at: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          start_time: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id?: string
          start_time: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string | null
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          end_time?: string
          id?: string
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_hourly_shift_availability_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_hourly_shift_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      application_statuses: {
        Row: {
          application_id: string
          created_at: string | null
          created_by: string
          custom_reason: string | null
          id: string
          is_active: boolean | null
          offered_salary_cents: number | null
          salary_period: string | null
          status_type: Database["public"]["Enums"]["application_status_type"]
          updated_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          created_by: string
          custom_reason?: string | null
          id?: string
          is_active?: boolean | null
          offered_salary_cents?: number | null
          salary_period?: string | null
          status_type: Database["public"]["Enums"]["application_status_type"]
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          created_by?: string
          custom_reason?: string | null
          id?: string
          is_active?: boolean | null
          offered_salary_cents?: number | null
          salary_period?: string | null
          status_type?: Database["public"]["Enums"]["application_status_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_statuses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_statuses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          ai_evaluation: Json | null
          anonymous_phone_number: string | null
          application_embedding: string | null
          commute_assessment: string | null
          compatibility_explanation: string | null
          compatibility_score: number | null
          conversion_method: string | null
          converted_at: string | null
          created_at: string | null
          csv_import_id: string | null
          employer_notes: string | null
          experience_summary: string | null
          external_call_id: string | null
          id: string
          interview_attempts: number | null
          interview_completed_at: string | null
          interview_duration: number | null
          interview_recording_url: string | null
          interview_transcript: string | null
          interview_type: Database["public"]["Enums"]["interview_type"] | null
          is_anonymous: boolean | null
          is_checking_resume: boolean | null
          is_previous_employee: boolean | null
          job_id: string | null
          location_id: string | null
          max_expected_salary: number | null
          min_expected_salary: number | null
          ocean_agreeableness: number | null
          ocean_conscientiousness: number | null
          ocean_extraversion: number | null
          ocean_neuroticism: number | null
          ocean_openness: number | null
          parsed_resume: string | null
          pay_alignment: string | null
          personality_summary: string | null
          phone_verified_at: string | null
          referral_name: string | null
          resume_url: string | null
          retention_notes: string | null
          skills_summary: string | null
          source_id: string | null
          stage: Database["public"]["Enums"]["application_stage"] | null
          stage_updated_at: string | null
          tips_for_applicant: string[] | null
          travel_method: string | null
          travel_time: number | null
          turnover_risk_explanation: string | null
          turnover_risk_score: number | null
          unavailability_reason: string | null
          upskilling_notes: string | null
          user_id: string | null
          viewed_at: string | null
          workstream_application_id: string | null
        }
        Insert: {
          ai_evaluation?: Json | null
          anonymous_phone_number?: string | null
          application_embedding?: string | null
          commute_assessment?: string | null
          compatibility_explanation?: string | null
          compatibility_score?: number | null
          conversion_method?: string | null
          converted_at?: string | null
          created_at?: string | null
          csv_import_id?: string | null
          employer_notes?: string | null
          experience_summary?: string | null
          external_call_id?: string | null
          id?: string
          interview_attempts?: number | null
          interview_completed_at?: string | null
          interview_duration?: number | null
          interview_recording_url?: string | null
          interview_transcript?: string | null
          interview_type?: Database["public"]["Enums"]["interview_type"] | null
          is_anonymous?: boolean | null
          is_checking_resume?: boolean | null
          is_previous_employee?: boolean | null
          job_id?: string | null
          location_id?: string | null
          max_expected_salary?: number | null
          min_expected_salary?: number | null
          ocean_agreeableness?: number | null
          ocean_conscientiousness?: number | null
          ocean_extraversion?: number | null
          ocean_neuroticism?: number | null
          ocean_openness?: number | null
          parsed_resume?: string | null
          pay_alignment?: string | null
          personality_summary?: string | null
          phone_verified_at?: string | null
          referral_name?: string | null
          resume_url?: string | null
          retention_notes?: string | null
          skills_summary?: string | null
          source_id?: string | null
          stage?: Database["public"]["Enums"]["application_stage"] | null
          stage_updated_at?: string | null
          tips_for_applicant?: string[] | null
          travel_method?: string | null
          travel_time?: number | null
          turnover_risk_explanation?: string | null
          turnover_risk_score?: number | null
          unavailability_reason?: string | null
          upskilling_notes?: string | null
          user_id?: string | null
          viewed_at?: string | null
          workstream_application_id?: string | null
        }
        Update: {
          ai_evaluation?: Json | null
          anonymous_phone_number?: string | null
          application_embedding?: string | null
          commute_assessment?: string | null
          compatibility_explanation?: string | null
          compatibility_score?: number | null
          conversion_method?: string | null
          converted_at?: string | null
          created_at?: string | null
          csv_import_id?: string | null
          employer_notes?: string | null
          experience_summary?: string | null
          external_call_id?: string | null
          id?: string
          interview_attempts?: number | null
          interview_completed_at?: string | null
          interview_duration?: number | null
          interview_recording_url?: string | null
          interview_transcript?: string | null
          interview_type?: Database["public"]["Enums"]["interview_type"] | null
          is_anonymous?: boolean | null
          is_checking_resume?: boolean | null
          is_previous_employee?: boolean | null
          job_id?: string | null
          location_id?: string | null
          max_expected_salary?: number | null
          min_expected_salary?: number | null
          ocean_agreeableness?: number | null
          ocean_conscientiousness?: number | null
          ocean_extraversion?: number | null
          ocean_neuroticism?: number | null
          ocean_openness?: number | null
          parsed_resume?: string | null
          pay_alignment?: string | null
          personality_summary?: string | null
          phone_verified_at?: string | null
          referral_name?: string | null
          resume_url?: string | null
          retention_notes?: string | null
          skills_summary?: string | null
          source_id?: string | null
          stage?: Database["public"]["Enums"]["application_stage"] | null
          stage_updated_at?: string | null
          tips_for_applicant?: string[] | null
          travel_method?: string | null
          travel_time?: number | null
          turnover_risk_explanation?: string | null
          turnover_risk_score?: number | null
          unavailability_reason?: string | null
          upskilling_notes?: string | null
          user_id?: string | null
          viewed_at?: string | null
          workstream_application_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_csv_import_id_fkey"
            columns: ["csv_import_id"]
            isOneToOne: false
            referencedRelation: "csv_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_workstream_application_id_fkey"
            columns: ["workstream_application_id"]
            isOneToOne: false
            referencedRelation: "workstream_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_applications_job_id"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          brand_voice: string
          company_values: string | null
          created_at: string | null
          greeting: string
          id: string
          location_id: string | null
          unique_selling_points: string | null
          updated_at: string | null
        }
        Insert: {
          brand_voice: string
          company_values?: string | null
          created_at?: string | null
          greeting: string
          id?: string
          location_id?: string | null
          unique_selling_points?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_voice?: string
          company_values?: string | null
          created_at?: string | null
          greeting?: string
          id?: string
          location_id?: string | null
          unique_selling_points?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_review_of_applicants: {
        Row: {
          application_id: string | null
          braintrust_interview_id: string | null
          braintrust_resume_id: string | null
          braintrust_scoring_id: string | null
          created_at: string
          feedback_text: string | null
          id: string
          interview_ai_feedback: string | null
          not_hired_reason: string | null
          rating: number
          resume_ai_feedback: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          braintrust_interview_id?: string | null
          braintrust_resume_id?: string | null
          braintrust_scoring_id?: string | null
          created_at?: string
          feedback_text?: string | null
          id?: string
          interview_ai_feedback?: string | null
          not_hired_reason?: string | null
          rating: number
          resume_ai_feedback?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          braintrust_interview_id?: string | null
          braintrust_resume_id?: string | null
          braintrust_scoring_id?: string | null
          created_at?: string
          feedback_text?: string | null
          id?: string
          interview_ai_feedback?: string | null
          not_hired_reason?: string | null
          rating?: number
          resume_ai_feedback?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_review_of_applicants_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_review_of_applicants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_integrations: {
        Row: {
          connected_at: string | null
          created_at: string
          email: string | null
          id: string
          nylas_grant_id: string
          primary_scheduler_config_id: string | null
          provider: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nylas_grant_id: string
          primary_scheduler_config_id?: string | null
          provider?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nylas_grant_id?: string
          primary_scheduler_config_id?: string | null
          provider?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cheating_analysis: {
        Row: {
          application_id: string
          created_at: string | null
          id: string
          interview_cheating_reasoning: string | null
          interview_cheating_score: number | null
          interview_evaluated_at: string | null
          resume_cheating_reasoning: string | null
          resume_cheating_score: number | null
          resume_evaluated_at: string | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          id?: string
          interview_cheating_reasoning?: string | null
          interview_cheating_score?: number | null
          interview_evaluated_at?: string | null
          resume_cheating_reasoning?: string | null
          resume_cheating_score?: number | null
          resume_evaluated_at?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          id?: string
          interview_cheating_reasoning?: string | null
          interview_cheating_score?: number | null
          interview_evaluated_at?: string | null
          resume_cheating_reasoning?: string | null
          resume_cheating_score?: number | null
          resume_evaluated_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cheating_analysis_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_versions: {
        Row: {
          created_at: string
          id: number
          notes: string
        }
        Insert: {
          created_at?: string
          id?: number
          notes: string
        }
        Update: {
          created_at?: string
          id?: number
          notes?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          applicant_user_id: string
          application_id: string | null
          business_user_id: string
          created_at: string
          id: string
          last_message_at: string | null
          organization_id: string
          status: Database["public"]["Enums"]["conversation_status"]
          twilio_applicant_participant_sid: string | null
          twilio_business_participant_sid: string | null
          twilio_conversation_sid: string
          twilio_sms_participant_sid: string | null
          unread_count: number
          updated_at: string
        }
        Insert: {
          applicant_user_id: string
          application_id?: string | null
          business_user_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["conversation_status"]
          twilio_applicant_participant_sid?: string | null
          twilio_business_participant_sid?: string | null
          twilio_conversation_sid: string
          twilio_sms_participant_sid?: string | null
          unread_count?: number
          updated_at?: string
        }
        Update: {
          applicant_user_id?: string
          application_id?: string | null
          business_user_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          twilio_applicant_participant_sid?: string | null
          twilio_business_participant_sid?: string | null
          twilio_conversation_sid?: string
          twilio_sms_participant_sid?: string | null
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_applicant_user_id_fkey"
            columns: ["applicant_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_business_user_id_fkey"
            columns: ["business_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      csv_import_invites: {
        Row: {
          application_id: string | null
          applied_at: string | null
          clicked_at: string | null
          created_at: string
          csv_import_id: string
          email: string | null
          email_failure_reason: string | null
          email_sent: boolean
          first_name: string
          id: string
          invite_token: string
          job_id: string
          last_name: string | null
          location_id: string | null
          notes: string | null
          organization_id: string
          phone_number: string | null
          reminder_count: number
          reminder_sent_at: string | null
          sent_at: string | null
          sms_failure_reason: string | null
          sms_sent: boolean
          status: Database["public"]["Enums"]["csv_import_invite_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          applied_at?: string | null
          clicked_at?: string | null
          created_at?: string
          csv_import_id: string
          email?: string | null
          email_failure_reason?: string | null
          email_sent?: boolean
          first_name: string
          id?: string
          invite_token?: string
          job_id: string
          last_name?: string | null
          location_id?: string | null
          notes?: string | null
          organization_id: string
          phone_number?: string | null
          reminder_count?: number
          reminder_sent_at?: string | null
          sent_at?: string | null
          sms_failure_reason?: string | null
          sms_sent?: boolean
          status?: Database["public"]["Enums"]["csv_import_invite_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          applied_at?: string | null
          clicked_at?: string | null
          created_at?: string
          csv_import_id?: string
          email?: string | null
          email_failure_reason?: string | null
          email_sent?: boolean
          first_name?: string
          id?: string
          invite_token?: string
          job_id?: string
          last_name?: string | null
          location_id?: string | null
          notes?: string | null
          organization_id?: string
          phone_number?: string | null
          reminder_count?: number
          reminder_sent_at?: string | null
          sent_at?: string | null
          sms_failure_reason?: string | null
          sms_sent?: boolean
          status?: Database["public"]["Enums"]["csv_import_invite_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "csv_import_invites_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csv_import_invites_csv_import_id_fkey"
            columns: ["csv_import_id"]
            isOneToOne: false
            referencedRelation: "csv_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csv_import_invites_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csv_import_invites_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csv_import_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csv_import_invites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      csv_imports: {
        Row: {
          created_at: string
          email_consent: boolean
          error_report_url: string | null
          failed_rows: number
          file_name: string
          file_url: string
          id: string
          imported_by: string
          job_id: string | null
          organization_id: string
          send_email: boolean
          send_sms: boolean
          skipped_rows: number
          sms_consent: boolean
          successful_rows: number
          total_rows: number
        }
        Insert: {
          created_at?: string
          email_consent?: boolean
          error_report_url?: string | null
          failed_rows?: number
          file_name: string
          file_url: string
          id?: string
          imported_by: string
          job_id?: string | null
          organization_id: string
          send_email?: boolean
          send_sms?: boolean
          skipped_rows?: number
          sms_consent?: boolean
          successful_rows?: number
          total_rows?: number
        }
        Update: {
          created_at?: string
          email_consent?: boolean
          error_report_url?: string | null
          failed_rows?: number
          file_name?: string
          file_url?: string
          id?: string
          imported_by?: string
          job_id?: string | null
          organization_id?: string
          send_email?: boolean
          send_sms?: boolean
          skipped_rows?: number
          sms_consent?: boolean
          successful_rows?: number
          total_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "csv_imports_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csv_imports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csv_imports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_questions: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          order: number
          question: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          order?: number
          question: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          order?: number
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_questions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      default_organization_questions: {
        Row: {
          created_at: string | null
          id: string
          order: number
          organization_id: string
          question: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order?: number
          organization_id: string
          question: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order?: number
          organization_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "default_organization_questions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      default_service_agreement: {
        Row: {
          change_summary: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          pdf_url: string | null
          title: string
          updated_at: string | null
          version: number
        }
        Insert: {
          change_summary?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          pdf_url?: string | null
          title?: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          change_summary?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          pdf_url?: string | null
          title?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "default_service_agreement_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_audit: {
        Row: {
          deleted_at: string | null
          deleted_by: string
          deleted_by_email: string
          deleted_by_role: string
          entity_display_name: string | null
          entity_id: string
          entity_metadata: Json | null
          entity_type: string
          id: string
        }
        Insert: {
          deleted_at?: string | null
          deleted_by: string
          deleted_by_email: string
          deleted_by_role: string
          entity_display_name?: string | null
          entity_id: string
          entity_metadata?: Json | null
          entity_type: string
          id?: string
        }
        Update: {
          deleted_at?: string | null
          deleted_by?: string
          deleted_by_email?: string
          deleted_by_role?: string
          entity_display_name?: string | null
          entity_id?: string
          entity_metadata?: Json | null
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deletion_audit_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      eeoc_data: {
        Row: {
          created_at: string | null
          disability_status:
            | Database["public"]["Enums"]["eeoc_disability_status"]
            | null
          id: string
          race_ethnicity:
            | Database["public"]["Enums"]["eeoc_race_ethnicity"][]
            | null
          sex: Database["public"]["Enums"]["eeoc_sex"] | null
          skipped: boolean | null
          updated_at: string | null
          user_id: string
          veteran_status:
            | Database["public"]["Enums"]["eeoc_veteran_status"]
            | null
        }
        Insert: {
          created_at?: string | null
          disability_status?:
            | Database["public"]["Enums"]["eeoc_disability_status"]
            | null
          id?: string
          race_ethnicity?:
            | Database["public"]["Enums"]["eeoc_race_ethnicity"][]
            | null
          sex?: Database["public"]["Enums"]["eeoc_sex"] | null
          skipped?: boolean | null
          updated_at?: string | null
          user_id: string
          veteran_status?:
            | Database["public"]["Enums"]["eeoc_veteran_status"]
            | null
        }
        Update: {
          created_at?: string | null
          disability_status?:
            | Database["public"]["Enums"]["eeoc_disability_status"]
            | null
          id?: string
          race_ethnicity?:
            | Database["public"]["Enums"]["eeoc_race_ethnicity"][]
            | null
          sex?: Database["public"]["Enums"]["eeoc_sex"] | null
          skipped?: boolean | null
          updated_at?: string | null
          user_id?: string
          veteran_status?:
            | Database["public"]["Enums"]["eeoc_veteran_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "eeoc_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          application_id: string | null
          body: string
          conversation_id: string | null
          created_at: string
          id: string
          offer_id: string | null
          recipient_email: string
          recipient_id: string | null
          sender_id: string | null
          subject: string
          trigger_reason: Database["public"]["Enums"]["email_trigger_reason"]
        }
        Insert: {
          application_id?: string | null
          body: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          offer_id?: string | null
          recipient_email: string
          recipient_id?: string | null
          sender_id?: string | null
          subject: string
          trigger_reason: Database["public"]["Enums"]["email_trigger_reason"]
        }
        Update: {
          application_id?: string | null
          body?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          offer_id?: string | null
          recipient_email?: string
          recipient_id?: string | null
          sender_id?: string | null
          subject?: string
          trigger_reason?: Database["public"]["Enums"]["email_trigger_reason"]
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_report_logs: {
        Row: {
          created_at: string
          date_range_end: string
          date_range_start: string
          email_status: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipients: string[]
          report_type: string
          resend_email_id: string | null
          sent_by: string
        }
        Insert: {
          created_at?: string
          date_range_end: string
          date_range_start: string
          email_status?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipients: string[]
          report_type?: string
          resend_email_id?: string | null
          sent_by: string
        }
        Update: {
          created_at?: string
          date_range_end?: string
          date_range_start?: string
          email_status?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipients?: string[]
          report_type?: string
          resend_email_id?: string | null
          sent_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_report_logs_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employments: {
        Row: {
          application_id: string
          created_at: string | null
          created_by: string | null
          hired_at: string
          id: string
          organization_id: string
          separated_at: string | null
          separation_reason: string | null
          updated_at: string | null
          user_id: string
          workstream_team_member_id: string | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          created_by?: string | null
          hired_at: string
          id?: string
          organization_id: string
          separated_at?: string | null
          separation_reason?: string | null
          updated_at?: string | null
          user_id: string
          workstream_team_member_id?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          created_by?: string | null
          hired_at?: string
          id?: string
          organization_id?: string
          separated_at?: string | null
          separation_reason?: string | null
          updated_at?: string | null
          user_id?: string
          workstream_team_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      human_interview: {
        Row: {
          application_id: string
          candidate_email: string | null
          created_at: string
          end_time: string | null
          expires_at: string | null
          id: string
          last_webhook_event_id: string | null
          meeting_url: string | null
          nylas_booking_ref: string | null
          nylas_configuration_id: string | null
          organizer_email: string | null
          scheduled_at: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["interview_status"]
          timezone: string | null
          token: string
          updated_at: string
        }
        Insert: {
          application_id: string
          candidate_email?: string | null
          created_at?: string
          end_time?: string | null
          expires_at?: string | null
          id?: string
          last_webhook_event_id?: string | null
          meeting_url?: string | null
          nylas_booking_ref?: string | null
          nylas_configuration_id?: string | null
          organizer_email?: string | null
          scheduled_at?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          timezone?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          candidate_email?: string | null
          created_at?: string
          end_time?: string | null
          expires_at?: string | null
          id?: string
          last_webhook_event_id?: string | null
          meeting_url?: string | null
          nylas_booking_ref?: string | null
          nylas_configuration_id?: string | null
          organizer_email?: string | null
          scheduled_at?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          timezone?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "human_interview_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_evaluations: {
        Row: {
          application_id: string
          confidence: number | null
          created_at: string | null
          cutoff_count: number | null
          cutoff_detected: boolean | null
          evaluated_at: string | null
          evaluation_version: string | null
          flags: string[] | null
          id: string
          quality_score: number | null
          reasoning: string | null
          success: boolean
          updated_at: string | null
        }
        Insert: {
          application_id: string
          confidence?: number | null
          created_at?: string | null
          cutoff_count?: number | null
          cutoff_detected?: boolean | null
          evaluated_at?: string | null
          evaluation_version?: string | null
          flags?: string[] | null
          id?: string
          quality_score?: number | null
          reasoning?: string | null
          success: boolean
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          confidence?: number | null
          created_at?: string | null
          cutoff_count?: number | null
          cutoff_detected?: boolean | null
          evaluated_at?: string | null
          evaluation_version?: string | null
          flags?: string[] | null
          id?: string
          quality_score?: number | null
          reasoning?: string | null
          success?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_evaluations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_availability: {
        Row: {
          created_at: string | null
          day: Database["public"]["Enums"]["day_of_week"]
          id: string
          job_id: string | null
          timeslot: Database["public"]["Enums"]["timeslot"]
        }
        Insert: {
          created_at?: string | null
          day: Database["public"]["Enums"]["day_of_week"]
          id?: string
          job_id?: string | null
          timeslot: Database["public"]["Enums"]["timeslot"]
        }
        Update: {
          created_at?: string | null
          day?: Database["public"]["Enums"]["day_of_week"]
          id?: string
          job_id?: string | null
          timeslot?: Database["public"]["Enums"]["timeslot"]
        }
        Relationships: [
          {
            foreignKeyName: "job_availability_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_hourly_shifts: {
        Row: {
          created_at: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          is_closing_shift: boolean | null
          is_opening_shift: boolean | null
          job_id: string | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id?: string
          is_closing_shift?: boolean | null
          is_opening_shift?: boolean | null
          job_id?: string | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          end_time?: string
          id?: string
          is_closing_shift?: boolean | null
          is_opening_shift?: boolean | null
          job_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_hourly_shifts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_locations: {
        Row: {
          active: boolean
          created_at: string | null
          id: string
          job_id: string
          location_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          id?: string
          job_id: string
          location_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string | null
          id?: string
          job_id?: string
          location_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_locations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          archived_at: string | null
          availability: string | null
          created_at: string | null
          demo: boolean
          department: string | null
          employment_type: string
          id: string
          include_travel_time_in_scoring: boolean
          is_public: boolean | null
          job_creator_id: string | null
          job_description: string
          job_title: string
          key_responsibilities: string | null
          last_edited_at: string | null
          last_edited_by: string | null
          max_salary: number | null
          min_salary: number | null
          nice_to_have_skills: string | null
          required_skills: string | null
          salary_type: Database["public"]["Enums"]["salary_type"] | null
          syndication: boolean
          tip_amount: number | null
          title_description_embedding: string | null
          updated_at: string | null
          workstream_position_uuid: string | null
        }
        Insert: {
          archived_at?: string | null
          availability?: string | null
          created_at?: string | null
          demo?: boolean
          department?: string | null
          employment_type: string
          id?: string
          include_travel_time_in_scoring?: boolean
          is_public?: boolean | null
          job_creator_id?: string | null
          job_description: string
          job_title: string
          key_responsibilities?: string | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          max_salary?: number | null
          min_salary?: number | null
          nice_to_have_skills?: string | null
          required_skills?: string | null
          salary_type?: Database["public"]["Enums"]["salary_type"] | null
          syndication?: boolean
          tip_amount?: number | null
          title_description_embedding?: string | null
          updated_at?: string | null
          workstream_position_uuid?: string | null
        }
        Update: {
          archived_at?: string | null
          availability?: string | null
          created_at?: string | null
          demo?: boolean
          department?: string | null
          employment_type?: string
          id?: string
          include_travel_time_in_scoring?: boolean
          is_public?: boolean | null
          job_creator_id?: string | null
          job_description?: string
          job_title?: string
          key_responsibilities?: string | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          max_salary?: number | null
          min_salary?: number | null
          nice_to_have_skills?: string | null
          required_skills?: string | null
          salary_type?: Database["public"]["Enums"]["salary_type"] | null
          syndication?: boolean
          tip_amount?: number | null
          title_description_embedding?: string | null
          updated_at?: string | null
          workstream_position_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_job_creator_id_fkey"
            columns: ["job_creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_last_edited_by_fkey"
            columns: ["last_edited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          phone: string
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          phone: string
          source?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          phone?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          baseline_quarter: number | null
          baseline_quarterly_turnover_rate: number | null
          baseline_time_to_hire_days: number | null
          baseline_year: number | null
          baseline_ytd_turnover_rate: number | null
          business_name: string
          created_at: string | null
          id: string
          organization_id: string | null
          phone_number: string
          updated_at: string | null
          workstream_location_uuid: string | null
        }
        Insert: {
          baseline_quarter?: number | null
          baseline_quarterly_turnover_rate?: number | null
          baseline_time_to_hire_days?: number | null
          baseline_year?: number | null
          baseline_ytd_turnover_rate?: number | null
          business_name: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          phone_number: string
          updated_at?: string | null
          workstream_location_uuid?: string | null
        }
        Update: {
          baseline_quarter?: number | null
          baseline_quarterly_turnover_rate?: number | null
          baseline_time_to_hire_days?: number | null
          baseline_year?: number | null
          baseline_ytd_turnover_rate?: number | null
          business_name?: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          phone_number?: string
          updated_at?: string | null
          workstream_location_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      logos: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_url: string
          id: string
          location_id: string | null
          organization_id: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          location_id?: string | null
          organization_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          location_id?: string | null
          organization_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logos_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          application_id: string
          created_at: string
          id: number
          text: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: number
          text: string
          user_id?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: number
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_letters: {
        Row: {
          application_id: string
          benefits_snapshot: string
          created_at: string
          created_by: string
          id: string
          manager_name: string | null
          manager_phone: string | null
          org_id: string
          pay_rate_cents: number
          reporting_manager_id: string
          responded_at: string | null
          response_deadline: string | null
          start_date: string
          status: Database["public"]["Enums"]["offer_letter_status"]
          updated_at: string
        }
        Insert: {
          application_id: string
          benefits_snapshot?: string
          created_at?: string
          created_by: string
          id?: string
          manager_name?: string | null
          manager_phone?: string | null
          org_id: string
          pay_rate_cents: number
          reporting_manager_id: string
          responded_at?: string | null
          response_deadline?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["offer_letter_status"]
          updated_at?: string
        }
        Update: {
          application_id?: string
          benefits_snapshot?: string
          created_at?: string
          created_by?: string
          id?: string
          manager_name?: string | null
          manager_phone?: string | null
          org_id?: string
          pay_rate_cents?: number
          reporting_manager_id?: string
          responded_at?: string | null
          response_deadline?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["offer_letter_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_letters_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_sessions: {
        Row: {
          brand_data: Json | null
          brand_id: string | null
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          id: string
          job_data: Json | null
          job_id: string | null
          location_data: Json | null
          location_id: string | null
          organization_data: Json | null
          organization_id: string | null
          payment_status: string | null
          plan_id: string | null
          plan_name: string | null
          session_token: string
          stripe_customer_id: string | null
          stripe_session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          brand_data?: Json | null
          brand_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          job_data?: Json | null
          job_id?: string | null
          location_data?: Json | null
          location_id?: string | null
          organization_data?: Json | null
          organization_id?: string | null
          payment_status?: string | null
          plan_id?: string | null
          plan_name?: string | null
          session_token: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          brand_data?: Json | null
          brand_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          job_data?: Json | null
          job_id?: string | null
          location_data?: Json | null
          location_id?: string | null
          organization_data?: Json | null
          organization_id?: string | null
          payment_status?: string | null
          plan_id?: string | null
          plan_name?: string | null
          session_token?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_sessions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_service_agreements: {
        Row: {
          change_summary: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          pdf_url: string | null
          title: string
          updated_at: string | null
          version: number
        }
        Insert: {
          change_summary?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          pdf_url?: string | null
          title?: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          change_summary?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          pdf_url?: string | null
          title?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "org_service_agreements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_service_agreements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          assessment_only: boolean | null
          auto_invite_enabled: boolean | null
          auto_invite_threshold: number | null
          bad_hire_cost_cents: number | null
          bad_hire_cost_explanation: string | null
          baseline_quarter: number | null
          baseline_quarterly_turnover_rate: number | null
          baseline_year: number | null
          baseline_ytd_turnover_rate: number | null
          billing_plan: Database["public"]["Enums"]["billing_plan_type"] | null
          brand_values: string | null
          created_at: string | null
          custom_scoring_guidelines: string | null
          description: string | null
          has_access: boolean
          headquarter_address: string | null
          id: string
          indeed_connected: boolean | null
          instant_email_notifications_enabled: boolean | null
          linkedin_connected: boolean | null
          name: string
          offer_letter_benefits: string | null
          offer_letter_closing: string | null
          offer_letter_opening: string | null
          other_job_boards: string | null
          public_name: string | null
          require_interview_confirmation: boolean
          send_rejection_emails: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_subscription_item_id: string | null
          turnover_dashboard_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
          visible_pay: boolean | null
          website_url: string | null
          workstream_api_token: string | null
          workstream_client_id: string | null
          workstream_client_secret: string | null
          workstream_token_expires_at: string | null
        }
        Insert: {
          assessment_only?: boolean | null
          auto_invite_enabled?: boolean | null
          auto_invite_threshold?: number | null
          bad_hire_cost_cents?: number | null
          bad_hire_cost_explanation?: string | null
          baseline_quarter?: number | null
          baseline_quarterly_turnover_rate?: number | null
          baseline_year?: number | null
          baseline_ytd_turnover_rate?: number | null
          billing_plan?: Database["public"]["Enums"]["billing_plan_type"] | null
          brand_values?: string | null
          created_at?: string | null
          custom_scoring_guidelines?: string | null
          description?: string | null
          has_access?: boolean
          headquarter_address?: string | null
          id?: string
          indeed_connected?: boolean | null
          instant_email_notifications_enabled?: boolean | null
          linkedin_connected?: boolean | null
          name: string
          offer_letter_benefits?: string | null
          offer_letter_closing?: string | null
          offer_letter_opening?: string | null
          other_job_boards?: string | null
          public_name?: string | null
          require_interview_confirmation?: boolean
          send_rejection_emails?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_item_id?: string | null
          turnover_dashboard_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          visible_pay?: boolean | null
          website_url?: string | null
          workstream_api_token?: string | null
          workstream_client_id?: string | null
          workstream_client_secret?: string | null
          workstream_token_expires_at?: string | null
        }
        Update: {
          assessment_only?: boolean | null
          auto_invite_enabled?: boolean | null
          auto_invite_threshold?: number | null
          bad_hire_cost_cents?: number | null
          bad_hire_cost_explanation?: string | null
          baseline_quarter?: number | null
          baseline_quarterly_turnover_rate?: number | null
          baseline_year?: number | null
          baseline_ytd_turnover_rate?: number | null
          billing_plan?: Database["public"]["Enums"]["billing_plan_type"] | null
          brand_values?: string | null
          created_at?: string | null
          custom_scoring_guidelines?: string | null
          description?: string | null
          has_access?: boolean
          headquarter_address?: string | null
          id?: string
          indeed_connected?: boolean | null
          instant_email_notifications_enabled?: boolean | null
          linkedin_connected?: boolean | null
          name?: string
          offer_letter_benefits?: string | null
          offer_letter_closing?: string | null
          offer_letter_opening?: string | null
          other_job_boards?: string | null
          public_name?: string | null
          require_interview_confirmation?: boolean
          send_rejection_emails?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_item_id?: string | null
          turnover_dashboard_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          visible_pay?: boolean | null
          website_url?: string | null
          workstream_api_token?: string | null
          workstream_client_id?: string | null
          workstream_client_secret?: string | null
          workstream_token_expires_at?: string | null
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          max_attempts: number | null
          phone_number: string
          updated_at: string | null
          user_id: string | null
          verification_code: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          max_attempts?: number | null
          phone_number: string
          updated_at?: string | null
          user_id?: string | null
          verification_code: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          max_attempts?: number | null
          phone_number?: string
          updated_at?: string | null
          user_id?: string | null
          verification_code?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      retell_calls: {
        Row: {
          agent_id: string
          application_id: string
          call_id: string
          created_at: string | null
          ended_at: string | null
          id: string
          llm_id: string | null
          metadata: Json | null
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          application_id: string
          call_id: string
          created_at?: string | null
          ended_at?: string | null
          id?: string
          llm_id?: string | null
          metadata?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          application_id?: string
          call_id?: string
          created_at?: string | null
          ended_at?: string | null
          id?: string
          llm_id?: string | null
          metadata?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retell_calls_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlist_candidates: {
        Row: {
          application_id: string | null
          candidate_id: string
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          saved_by_user_id: string | null
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          candidate_id: string
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          saved_by_user_id?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          candidate_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          saved_by_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlist_candidates_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlist_candidates_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlist_candidates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlist_candidates_saved_by_user_id_fkey"
            columns: ["saved_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          application_id: string | null
          body: string
          created_at: string
          id: string
          recipient_id: string
          trigger_reason: string
        }
        Insert: {
          application_id?: string | null
          body: string
          created_at?: string
          id?: string
          recipient_id: string
          trigger_reason: string
        }
        Update: {
          application_id?: string | null
          body?: string
          created_at?: string
          id?: string
          recipient_id?: string
          trigger_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      text_to_apply_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          location_id: string | null
          organization_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          location_id?: string | null
          organization_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          location_id?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "text_to_apply_codes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "text_to_apply_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      text_to_apply_logs: {
        Row: {
          code_received: string
          created_at: string
          error_message: string | null
          id: string
          location_id: string | null
          matched: boolean
          organization_id: string | null
          phone_number: string
          response_sent: boolean
        }
        Insert: {
          code_received: string
          created_at?: string
          error_message?: string | null
          id?: string
          location_id?: string | null
          matched?: boolean
          organization_id?: string | null
          phone_number: string
          response_sent?: boolean
        }
        Update: {
          code_received?: string
          created_at?: string
          error_message?: string | null
          id?: string
          location_id?: string | null
          matched?: boolean
          organization_id?: string | null
          phone_number?: string
          response_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "text_to_apply_logs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "text_to_apply_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_agreement_signatures: {
        Row: {
          agreement_content_hash: string
          agreement_id: string
          agreement_title: string
          agreement_type: string
          agreement_version: number
          consent_given: boolean | null
          created_at: string | null
          device_fingerprint: Json | null
          email: string
          email_verified: boolean | null
          id: string
          ip_address: string | null
          legal_name: string
          organization_id: string
          referrer: string | null
          session_id: string | null
          signature_text: string
          signature_type: string
          signed_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          agreement_content_hash: string
          agreement_id: string
          agreement_title: string
          agreement_type: string
          agreement_version?: number
          consent_given?: boolean | null
          created_at?: string | null
          device_fingerprint?: Json | null
          email: string
          email_verified?: boolean | null
          id?: string
          ip_address?: string | null
          legal_name: string
          organization_id: string
          referrer?: string | null
          session_id?: string | null
          signature_text: string
          signature_type?: string
          signed_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          agreement_content_hash?: string
          agreement_id?: string
          agreement_title?: string
          agreement_type?: string
          agreement_version?: number
          consent_given?: boolean | null
          created_at?: string | null
          device_fingerprint?: Json | null
          email?: string
          email_verified?: boolean | null
          id?: string
          ip_address?: string | null
          legal_name?: string
          organization_id?: string
          referrer?: string | null
          session_id?: string | null
          signature_text?: string
          signature_type?: string
          signed_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_agreement_signatures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_agreement_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consent_data: Json
          consent_version_id: number
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          consent_data: Json
          consent_version_id: number
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          consent_data?: Json
          consent_version_id?: number
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_consent_version_id_fkey"
            columns: ["consent_version_id"]
            isOneToOne: false
            referencedRelation: "consent_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_job_notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_job_notification_preferences_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_job_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_location_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          location_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          location_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_location_permissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_location_permissions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_location_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          candidate_embedding: string | null
          created_at: string
          daily_applications_summary_email: boolean | null
          daily_interviews_summary_email: boolean | null
          email: string
          first_name: string | null
          id: string
          instant_applications_email: boolean | null
          last_name: string | null
          organization_id: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
          weekly_applications_summary_email: boolean | null
          weekly_interviews_summary_email: boolean | null
        }
        Insert: {
          candidate_embedding?: string | null
          created_at?: string
          daily_applications_summary_email?: boolean | null
          daily_interviews_summary_email?: boolean | null
          email: string
          first_name?: string | null
          id: string
          instant_applications_email?: boolean | null
          last_name?: string | null
          organization_id?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          weekly_applications_summary_email?: boolean | null
          weekly_interviews_summary_email?: boolean | null
        }
        Update: {
          candidate_embedding?: string | null
          created_at?: string
          daily_applications_summary_email?: boolean | null
          daily_interviews_summary_email?: boolean | null
          email?: string
          first_name?: string | null
          id?: string
          instant_applications_email?: boolean | null
          last_name?: string | null
          organization_id?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          weekly_applications_summary_email?: boolean | null
          weekly_interviews_summary_email?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_experiences: {
        Row: {
          application_id: string
          created_at: string | null
          description: string | null
          end_date: string | null
          experience_company: string
          experience_job_title: string
          id: string
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          experience_company: string
          experience_job_title: string
          id?: string
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          experience_company?: string
          experience_job_title?: string
          id?: string
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_experiences_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_experiences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workstream_applications: {
        Row: {
          application_date: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          global_phone_number: string | null
          id: string
          invites_sent: number | null
          job_id: string | null
          last_name: string | null
          organization_id: string
          status: string | null
          updated_at: string | null
          workstream_position_uuid: string | null
          workstream_uuid: string
        }
        Insert: {
          application_date?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          global_phone_number?: string | null
          id?: string
          invites_sent?: number | null
          job_id?: string | null
          last_name?: string | null
          organization_id: string
          status?: string | null
          updated_at?: string | null
          workstream_position_uuid?: string | null
          workstream_uuid: string
        }
        Update: {
          application_date?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          global_phone_number?: string | null
          id?: string
          invites_sent?: number | null
          job_id?: string | null
          last_name?: string | null
          organization_id?: string
          status?: string | null
          updated_at?: string | null
          workstream_position_uuid?: string | null
          workstream_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "workstream_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workstream_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_applicant_applications:
        | {
            Args: { applicant_id: string }
            Returns: {
              business_name: string
              city: string
              compatibility_score: number
              created_at: string
              id: string
              interview_completed_at: string
              job_id: string
              job_title: string
              state: string
            }[]
          }
        | {
            Args: { applicant_id: string; caller_user_id?: string }
            Returns: {
              business_name: string
              city: string
              compatibility_score: number
              created_at: string
              id: string
              interview_completed_at: string
              job_id: string
              job_title: string
              state: string
            }[]
          }
      admin_get_interview_date_range: {
        Args: never
        Returns: {
          first_date: string
          has_data: boolean
          last_date: string
          total_interviews: number
        }[]
      }
      admin_get_interview_stats_detailed: {
        Args: {
          p_end_date: string
          p_exclude_emails?: string[]
          p_org_id?: string
          p_start_date: string
        }
        Returns: {
          average_compatibility_score: number
          mean_duration_minutes: number
          median_duration_minutes: number
          quality_interviews: number
          successful_interviews: number
          total_duration_minutes: number
          total_interviews: number
        }[]
      }
      admin_get_interview_timeline: {
        Args: {
          p_end_date: string
          p_exclude_emails?: string[]
          p_org_id?: string
          p_start_date: string
        }
        Returns: {
          cumulative_count: number
          daily_count: number
          interview_date: string
        }[]
      }
      admin_get_org_breakdown: {
        Args: {
          p_end_date: string
          p_exclude_emails?: string[]
          p_start_date: string
        }
        Returns: {
          interview_count: number
          organization_id: string
          organization_name: string
          total_duration_minutes: number
        }[]
      }
      admin_get_org_cost_savings: {
        Args: { p_org_id?: string }
        Returns: {
          organization_id: string
          organization_name: string
          total_applications: number
          total_duration_seconds: number
          total_interviews: number
        }[]
      }
      admin_get_platform_stats: {
        Args: never
        Returns: {
          total_applications: number
          total_interviews: number
          total_jobs: number
          total_locations: number
          total_organizations: number
          total_users: number
          weekly_completion_rate: number
          weekly_new_interviews: number
        }[]
      }
      admin_search_applicants:
        | {
            Args: {
              caller_user_id?: string
              page_number?: number
              page_size?: number
              search_term?: string
            }
            Returns: {
              application_count: number
              created_at: string
              email: string
              first_name: string
              id: string
              last_name: string
              latest_application_date: string
              latest_business_name: string
              latest_job_title: string
              total_count: number
            }[]
          }
        | {
            Args: {
              page_number?: number
              page_size?: number
              search_term?: string
            }
            Returns: {
              application_count: number
              created_at: string
              email: string
              first_name: string
              id: string
              last_name: string
              latest_application_date: string
              latest_business_name: string
              latest_job_title: string
              total_count: number
            }[]
          }
      admin_search_applications: {
        Args: {
          caller_user_id?: string
          page_number?: number
          page_size?: number
          search_term?: string
        }
        Returns: {
          business_name: string
          city: string
          compatibility_score: number
          created_at: string
          id: string
          interview_completed_at: string
          job_id: string
          job_title: string
          source_display_name: string
          source_name: string
          state: string
          total_count: number
          user_email: string
          user_first_name: string
          user_id: string
          user_last_name: string
        }[]
      }
      build_email_preferences_for_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      business_get_application_status_counts: {
        Args: { org_id: string; p_location_ids?: string[] }
        Returns: {
          status_count: number
          status_type: string
          total_applications: number
        }[]
      }
      business_get_interview_analytics: {
        Args: {
          caller_user_id: string
          org_id: string
          p_location_ids?: string[]
        }
        Returns: {
          average_duration_seconds: number
          interviews_completed: number
          interviews_started: number
          total_applications: number
          total_duration_seconds: number
        }[]
      }
      business_get_job_counts: {
        Args: {
          caller_user_id: string
          filter_location_id?: string
          org_id: string
          show_all?: boolean
        }
        Returns: {
          count: number
          job_id: string
        }[]
      }
      business_get_job_summaries: {
        Args: {
          caller_user_id: string
          filter_location_id?: string
          include_private?: boolean
          org_id: string
          status_filter?: string[]
        }
        Returns: {
          all_location_names: string[]
          application_count: number
          is_public: boolean
          job_id: string
          job_title: string
          location_count: number
          primary_location_city: string
          primary_location_id: string
          primary_location_name: string
          primary_location_state: string
          unviewed_count: number
        }[]
      }
      business_get_status_counts: {
        Args: {
          caller_user_id: string
          filter_job_id?: string
          filter_location_id?: string
          org_id: string
          show_all?: boolean
        }
        Returns: {
          count: number
          status_type: string
        }[]
      }
      business_search_applications_by_job: {
        Args: {
          caller_user_id: string
          filter_location_ids?: string[]
          include_private?: boolean
          org_id: string
          page_number?: number
          page_size?: number
          search_term?: string
          status_filter?: string[]
        }
        Returns: {
          commute_assessment: string
          compatibility_score: number
          created_at: string
          id: string
          interview_cheating_reasoning: string
          interview_cheating_score: number
          interview_completed_at: string
          interview_duration: number
          job_id: string
          job_is_public: boolean
          job_location_id: string
          job_title: string
          location_business_name: string
          location_city: string
          location_state: string
          personality_summary: string
          referral_name: string
          resume_cheating_reasoning: string
          resume_cheating_score: number
          status_custom_reason: string
          status_type: string
          total_count: number
          travel_time: number
          turnover_risk_score: number
          user_email: string
          user_first_name: string
          user_id: string
          user_last_name: string
          viewed_at: string
        }[]
      }
      business_search_applications_flat: {
        Args: {
          caller_user_id: string
          filter_job_ids?: string[]
          filter_location_ids?: string[]
          new_first?: boolean
          org_id: string
          page_number?: number
          page_size?: number
          search_term?: string
          show_all?: boolean
          sort_by?: string
          status_filter?: string[]
        }
        Returns: {
          commute_assessment: string
          compatibility_score: number
          created_at: string
          id: string
          interview_completed_at: string
          interview_duration: number
          is_shortlisted: boolean
          job_id: string
          job_is_public: boolean
          job_location_id: string
          job_title: string
          location_business_name: string
          location_city: string
          location_state: string
          personality_summary: string
          referral_name: string
          stage: string
          stage_updated_at: string
          status_custom_reason: string
          status_type: string
          total_count: number
          travel_time: number
          turnover_risk_score: number
          user_email: string
          user_first_name: string
          user_id: string
          user_last_name: string
          user_phone: string
          viewed_at: string
        }[]
      }
      can_conduct_interview: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      cleanup_inactive_job_preferences: { Args: never; Returns: undefined }
      convert_anonymous_to_permanent_user: {
        Args: {
          p_first_name: string
          p_last_name: string
          p_phone_number: string
          p_user_id: string
        }
        Returns: boolean
      }
      convert_salary_between_types: {
        Args: {
          from_type: Database["public"]["Enums"]["salary_type"]
          shift_hours?: number
          to_type: Database["public"]["Enums"]["salary_type"]
          value_in_cents: number
        }
        Returns: number
      }
      delete_organization_atomic: {
        Args: {
          p_admin_user_id: string
          p_deletion_mode?: string
          p_org_id: string
        }
        Returns: Json
      }
      delete_user_atomic: {
        Args: {
          p_admin_user_id: string
          p_delete_org?: boolean
          p_transfer_admin_to?: string
          p_user_id: string
        }
        Returns: Json
      }
      find_matching_candidates_for_job: {
        Args: {
          match_count?: number
          p_job_id: string
          p_organization_id?: string
        }
        Returns: {
          application_id: string
          applied_at: string
          email: string
          first_name: string
          last_name: string
          match_score: number
          user_id: string
        }[]
      }
      find_matching_jobs_for_candidate: {
        Args: {
          match_count?: number
          p_application_id: string
          p_organization_id?: string
        }
        Returns: {
          job_id: string
          job_title: string
          location_business_name: string
          match_score: number
        }[]
      }
      find_similar_candidates: {
        Args: { match_count?: number; source_user_id: string }
        Returns: {
          email: string
          first_name: string
          id: string
          last_name: string
          similarity_score: number
        }[]
      }
      find_similar_jobs_in_org: {
        Args: { match_count?: number; source_job_id: string }
        Returns: {
          id: string
          job_title: string
          similarity_score: number
        }[]
      }
      find_similar_jobs_near_candidate: {
        Args: {
          application_id: string
          match_count?: number
          source_job_id: string
        }
        Returns: {
          distance_miles: number
          id: string
          job_title: string
          location_business_name: string
          location_city: string
          location_id: string
          location_state: string
          similarity_score: number
        }[]
      }
      get_agreement_for_org: {
        Args: { org_id: string }
        Returns: {
          content: string
          created_at: string
          id: string
          is_custom: boolean
          pdf_url: string
          title: string
          updated_at: string
          version: number
        }[]
      }
      get_billing_period_start: {
        Args: { p_date?: string; p_organization_id: string }
        Returns: string
      }
      get_job_statistics_with_cost_data: {
        Args: { org_id: string; p_location_ids?: string[] }
        Returns: {
          application_count: number
          average_score: number
          is_public: boolean
          job_id: string
          job_title: string
          location_id: string
          total_cost: number
        }[]
      }
      get_or_create_welcome_session: {
        Args: { p_user_id: string }
        Returns: {
          current_step: number
          id: string
          is_completed: boolean
          session_token: string
        }[]
      }
      get_usage_statistics: {
        Args: {
          p_end_date?: string
          p_organization_id: string
          p_start_date?: string
        }
        Returns: {
          estimated_cost_cents: number
          monthly_credit: number
          overage_count: number
          overage_reported: number
          period_end: string
          period_start: string
          usage_count: number
        }[]
      }
      get_user_organization_id: { Args: { user_id: string }; Returns: string }
      get_user_permitted_locations: {
        Args: { p_user_id: string }
        Returns: {
          location_city: string
          location_id: string
          location_name: string
          location_state: string
        }[]
      }
      get_user_role: { Args: { user_id: string }; Returns: string }
      get_user_role_safe: { Args: { p_user_id: string }; Returns: string }
      get_workstream_invites_sent: { Args: { org_id: string }; Returns: number }
      increment_interview_usage: {
        Args: { p_application_id: string; p_organization_id: string }
        Returns: {
          billing_period_start: string
          current_usage: number
          is_blocked: boolean
          monthly_credit: number
          should_report_to_stripe: boolean
        }[]
      }
      insert_job:
        | {
            Args: {
              p_availability?: string
              p_employment_type: string
              p_is_active?: boolean
              p_job_description: string
              p_job_title: string
              p_key_responsibilities: string
              p_location_id?: string
              p_nice_to_have_skills?: string
              p_required_skills: string
              p_salary?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_employment_type?: string
              p_is_public?: boolean
              p_job_description?: string
              p_job_title: string
              p_location_id: string
              p_max_salary?: number
              p_min_salary?: number
              p_salary_type?: string
              p_syndication?: boolean
              p_tip_amount?: number
            }
            Returns: string
          }
      insert_location_admin: {
        Args: {
          p_address: string
          p_business_name: string
          p_city: string
          p_organization_id: string
          p_phone_number: string
          p_state: string
          p_zip_code: string
        }
        Returns: string
      }
      invoke_edge_function: {
        Args: { function_name: string; payload?: Json }
        Returns: undefined
      }
      is_admin_user: { Args: { user_id: string }; Returns: boolean }
      is_ctp_admin: { Args: { user_id: string }; Returns: boolean }
      is_ctp_admin_user: { Args: { user_id: string }; Returns: boolean }
      location_belongs_to_user_org: {
        Args: { p_location_id: string }
        Returns: boolean
      }
      public_search_jobs: {
        Args: {
          employment_type_filter?: string
          location_id_filter?: string
          organization_id_filter?: string
          page_number?: number
          page_size?: number
          search_term?: string
          sort_by?: string
          user_lat?: number
          user_lng?: number
        }
        Returns: {
          created_at: string
          distance_miles: number
          employment_type: string
          id: string
          is_public: boolean
          job_description: string
          job_location_active: boolean
          job_location_id: string
          job_title: string
          location_address: string
          location_business_name: string
          location_city: string
          location_id: string
          location_lat: number
          location_lng: number
          location_logo_id: string
          location_logo_name: string
          location_logo_url: string
          location_organization_id: string
          location_phone_number: string
          location_state: string
          location_zip_code: string
          max_salary: number
          min_salary: number
          org_description: string
          org_has_access: boolean
          org_id: string
          org_logo_id: string
          org_logo_name: string
          org_logo_url: string
          org_name: string
          org_visible_pay: boolean
          required_skills: string
          salary_type: string
          tip_amount: number
          total_count: number
          updated_at: string
        }[]
      }
      record_stripe_usage_report: {
        Args: {
          p_application_id: string
          p_organization_id: string
          p_stripe_usage_record_id: string
        }
        Returns: undefined
      }
      trigger_send_interview_notifications: { Args: never; Returns: undefined }
      trigger_send_rejection_emails: { Args: never; Returns: undefined }
      update_job:
        | {
            Args: {
              p_availability?: string
              p_employment_type: string
              p_id: string
              p_is_active?: boolean
              p_job_description: string
              p_job_title: string
              p_key_responsibilities: string
              p_location_id?: string
              p_nice_to_have_skills?: string
              p_required_skills: string
              p_salary?: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_employment_type?: string
              p_id: string
              p_is_public?: boolean
              p_job_description?: string
              p_job_title?: string
              p_location_id?: string
              p_max_salary?: number
              p_min_salary?: number
              p_salary_type?: string
              p_syndication?: boolean
              p_tip_amount?: number
            }
            Returns: undefined
          }
      update_location_admin: {
        Args: {
          p_address: string
          p_business_name: string
          p_city: string
          p_id: string
          p_organization_id: string
          p_phone_number: string
          p_state: string
          p_zip_code: string
        }
        Returns: boolean
      }
      update_location_simple: {
        Args: {
          p_address: string
          p_business_name: string
          p_city: string
          p_id: string
          p_phone_number: string
          p_state: string
          p_zip_code: string
        }
        Returns: boolean
      }
      user_has_signed_current_agreement: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      application_stage:
        | "APPLICATION_CREATED"
        | "AI_INTERVIEW_DONE"
        | "EXPERIENCES_ADDED"
        | "VITALS_ADDED"
        | "APPLICATION_COMPLETE"
      application_status_type:
        | "OFFER_EXTENDED"
        | "INVITED_INTERVIEW"
        | "HIRED"
        | "NOT_HIRED_STRONG"
        | "NOT_HIRED_OVERQUALIFIED"
        | "PAY_MISMATCH"
        | "LOCATION_ISSUE"
        | "AVAILABILITY_ISSUE"
        | "CULTURE_FIT"
        | "POSITION_FILLED"
        | "CANDIDATE_WITHDREW"
        | "NO_SHOW"
        | "OTHER"
        | "NOT_QUALIFIED"
        | "SEPARATED"
      ats_provider:
        | "greenhouse"
        | "lever"
        | "workable"
        | "ashby"
        | "bamboohr"
        | "namely"
        | "jobvite"
        | "smartrecruiters"
        | "icims"
        | "taleo"
      billing_plan_type:
        | "free"
        | "sprite"
        | "canary"
        | "honeydew"
        | "watermelon"
        | "starter"
        | "growth"
        | "scale"
        | "professional"
      conversation_status: "active" | "archived"
      csv_import_invite_status:
        | "pending"
        | "sent"
        | "clicked"
        | "applied"
        | "failed"
        | "reminder_sent"
      day_of_week:
        | "sunday"
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
      eeoc_disability_status:
        | "yes_disability_or_history"
        | "no_disability"
        | "decline_to_answer"
      eeoc_race_ethnicity:
        | "hispanic_or_latino"
        | "white"
        | "black_or_african_american"
        | "native_hawaiian_or_pacific_islander"
        | "asian"
        | "american_indian_or_alaska_native"
        | "middle_eastern_or_north_african"
        | "decline_to_answer"
      eeoc_sex: "male" | "female" | "decline_to_answer"
      eeoc_veteran_status:
        | "protected_veteran"
        | "not_protected_veteran"
        | "decline_to_answer"
      email_trigger_reason:
        | "message_received"
        | "human_interview_invite_received"
        | "daily_conversation_summary"
        | "business_feedback"
        | "user_action"
        | "trial_feedback"
        | "welcome_email"
        | "ctp_admin_invite"
        | "business_user_invite"
        | "business_user_invite_resend"
        | "daily_applications_summary"
        | "stats_report"
        | "client_report"
        | "job_invite"
        | "instant_application"
        | "rejection_email"
        | "hire_feedback_request"
        | "daily_interviews_summary"
        | "weekly_interviews_summary"
        | "interview_feedback_request"
      interview_status:
        | "INVITE_SENT"
        | "PENDING_CONFIRMATION"
        | "SCHEDULED"
        | "CANCELLED"
        | "COMPLETED"
        | "NO_SHOW"
      interview_type: "assessment" | "full"
      offer_letter_status: "sent" | "accepted" | "declined" | "expired"
      salary_type: "hour" | "annual" | "shift"
      sync_status: "pending" | "in_progress" | "completed" | "failed"
      timeslot: "morning" | "afternoon" | "evening" | "overnight"
      user_role:
        | "BUSINESS_USER"
        | "ADMIN_USER"
        | "APPLICANT_USER"
        | "DEMO_USER"
        | "CTP_ADMIN_USER"
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
      application_stage: [
        "APPLICATION_CREATED",
        "AI_INTERVIEW_DONE",
        "EXPERIENCES_ADDED",
        "VITALS_ADDED",
        "APPLICATION_COMPLETE",
      ],
      application_status_type: [
        "OFFER_EXTENDED",
        "INVITED_INTERVIEW",
        "HIRED",
        "NOT_HIRED_STRONG",
        "NOT_HIRED_OVERQUALIFIED",
        "PAY_MISMATCH",
        "LOCATION_ISSUE",
        "AVAILABILITY_ISSUE",
        "CULTURE_FIT",
        "POSITION_FILLED",
        "CANDIDATE_WITHDREW",
        "NO_SHOW",
        "OTHER",
        "NOT_QUALIFIED",
        "SEPARATED",
      ],
      ats_provider: [
        "greenhouse",
        "lever",
        "workable",
        "ashby",
        "bamboohr",
        "namely",
        "jobvite",
        "smartrecruiters",
        "icims",
        "taleo",
      ],
      billing_plan_type: [
        "free",
        "sprite",
        "canary",
        "honeydew",
        "watermelon",
        "starter",
        "growth",
        "scale",
        "professional",
      ],
      conversation_status: ["active", "archived"],
      csv_import_invite_status: [
        "pending",
        "sent",
        "clicked",
        "applied",
        "failed",
        "reminder_sent",
      ],
      day_of_week: [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
      eeoc_disability_status: [
        "yes_disability_or_history",
        "no_disability",
        "decline_to_answer",
      ],
      eeoc_race_ethnicity: [
        "hispanic_or_latino",
        "white",
        "black_or_african_american",
        "native_hawaiian_or_pacific_islander",
        "asian",
        "american_indian_or_alaska_native",
        "middle_eastern_or_north_african",
        "decline_to_answer",
      ],
      eeoc_sex: ["male", "female", "decline_to_answer"],
      eeoc_veteran_status: [
        "protected_veteran",
        "not_protected_veteran",
        "decline_to_answer",
      ],
      email_trigger_reason: [
        "message_received",
        "human_interview_invite_received",
        "daily_conversation_summary",
        "business_feedback",
        "user_action",
        "trial_feedback",
        "welcome_email",
        "ctp_admin_invite",
        "business_user_invite",
        "business_user_invite_resend",
        "daily_applications_summary",
        "stats_report",
        "client_report",
        "job_invite",
        "instant_application",
        "rejection_email",
        "hire_feedback_request",
        "daily_interviews_summary",
        "weekly_interviews_summary",
        "interview_feedback_request",
      ],
      interview_status: [
        "INVITE_SENT",
        "PENDING_CONFIRMATION",
        "SCHEDULED",
        "CANCELLED",
        "COMPLETED",
        "NO_SHOW",
      ],
      interview_type: ["assessment", "full"],
      offer_letter_status: ["sent", "accepted", "declined", "expired"],
      salary_type: ["hour", "annual", "shift"],
      sync_status: ["pending", "in_progress", "completed", "failed"],
      timeslot: ["morning", "afternoon", "evening", "overnight"],
      user_role: [
        "BUSINESS_USER",
        "ADMIN_USER",
        "APPLICANT_USER",
        "DEMO_USER",
        "CTP_ADMIN_USER",
      ],
    },
  },
} as const
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.26.9)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
