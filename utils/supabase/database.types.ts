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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      transactions: {
        Row: {
          chain_id: number
          charge_id: string | null
          client_id: string | null
          created_at: string | null
          custom_instructions: string | null
          dispute_initiated_at: string | null
          dispute_initiated_by: string | null
          escrow_registration: number | null
          escrow_resolved_at: string | null
          escrow_resolved_to: string | null
          escrow_status: string | null
          hedera_schedule_id: string | null
          id: string
          paid_at: string | null
          product_id: string | null
          release_at: string | null
          status: string
          tx_hash: string | null
        }
        Insert: {
          chain_id?: number
          charge_id?: string | null
          client_id?: string | null
          created_at?: string | null
          custom_instructions?: string | null
          dispute_initiated_at?: string | null
          dispute_initiated_by?: string | null
          escrow_registration?: number | null
          escrow_resolved_at?: string | null
          escrow_resolved_to?: string | null
          escrow_status?: string | null
          hedera_schedule_id?: string | null
          id?: string
          paid_at?: string | null
          product_id?: string | null
          release_at?: string | null
          status?: string
          tx_hash?: string | null
        }
        Update: {
          chain_id?: number
          charge_id?: string | null
          client_id?: string | null
          created_at?: string | null
          custom_instructions?: string | null
          dispute_initiated_at?: string | null
          dispute_initiated_by?: string | null
          escrow_registration?: number | null
          escrow_resolved_at?: string | null
          escrow_resolved_to?: string | null
          escrow_status?: string | null
          hedera_schedule_id?: string | null
          id?: string
          paid_at?: string | null
          product_id?: string | null
          release_at?: string | null
          status?: string
          tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          agent_id: string | null
          created_at: string | null
          description: string
          escrow_duration_seconds: number | null
          id: string
          price_usdc: number
          status: string
          title: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          description: string
          escrow_duration_seconds?: number | null
          id?: string
          price_usdc: number
          status?: string
          title: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          description?: string
          escrow_duration_seconds?: number | null
          id?: string
          price_usdc?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_events: {
        Row: {
          amount_usd: number | null
          created_at: string | null
          delta: number
          id: number
          transaction_id: string | null
          reason: string
          wallet: string
        }
        Insert: {
          amount_usd?: number | null
          created_at?: string | null
          delta: number
          id?: number
          transaction_id?: string | null
          reason: string
          wallet: string
        }
        Update: {
          amount_usd?: number | null
          created_at?: string | null
          delta?: number
          id?: number
          transaction_id?: string | null
          reason?: string
          wallet?: string
        }
        Relationships: [
          {
            foreignKeyName: "reputation_events_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          display_name: string | null
          erc8004_agent_id: number | null
          id: string
          last_seen_at: string | null
          reputation_sum: number | null
          telegram_chat_id: number | null
          telegram_handle: string | null
          telegram_link_token: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          erc8004_agent_id?: number | null
          id?: string
          last_seen_at?: string | null
          reputation_sum?: number | null
          telegram_chat_id?: number | null
          telegram_handle?: string | null
          telegram_link_token?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          erc8004_agent_id?: number | null
          id?: string
          last_seen_at?: string | null
          reputation_sum?: number | null
          telegram_chat_id?: number | null
          telegram_handle?: string | null
          telegram_link_token?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
