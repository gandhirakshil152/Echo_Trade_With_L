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
      broker_accounts: {
        Row: {
          account_name: string
          balance_inr: number
          broker: Database["public"]["Enums"]["broker_name"]
          client_code: string
          created_at: string
          id: string
          is_connected: boolean
          pin: string
          user_id: string
        }
        Insert: {
          account_name?: string
          balance_inr?: number
          broker: Database["public"]["Enums"]["broker_name"]
          client_code: string
          created_at?: string
          id?: string
          is_connected?: boolean
          pin?: string
          user_id: string
        }
        Update: {
          account_name?: string
          balance_inr?: number
          broker?: Database["public"]["Enums"]["broker_name"]
          client_code?: string
          created_at?: string
          id?: string
          is_connected?: boolean
          pin?: string
          user_id?: string
        }
        Relationships: []
      }
      fund_transactions: {
        Row: {
          amount_inr: number
          broker: string
          broker_account_id: string
          created_at: string
          direction: string
          id: string
          method: string
          status: string
          upi_id: string | null
          upi_ref: string
          user_id: string
        }
        Insert: {
          amount_inr: number
          broker: string
          broker_account_id: string
          created_at?: string
          direction?: string
          id?: string
          method?: string
          status?: string
          upi_id?: string | null
          upi_ref: string
          user_id: string
        }
        Update: {
          amount_inr?: number
          broker?: string
          broker_account_id?: string
          created_at?: string
          direction?: string
          id?: string
          method?: string
          status?: string
          upi_id?: string | null
          upi_ref?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fund_transactions_broker_account_id_fkey"
            columns: ["broker_account_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      holdings: {
        Row: {
          avg_price: number
          broker_account_id: string
          exchange: string
          id: string
          quantity: number
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_price?: number
          broker_account_id: string
          exchange?: string
          id?: string
          quantity?: number
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_price?: number
          broker_account_id?: string
          exchange?: string
          id?: string
          quantity?: number
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_broker_account_id_fkey"
            columns: ["broker_account_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          broker: Database["public"]["Enums"]["broker_name"]
          broker_account_id: string
          created_at: string
          exchange: string
          id: string
          order_type: Database["public"]["Enums"]["order_kind"]
          price: number
          quantity: number
          side: Database["public"]["Enums"]["order_side"]
          source: Database["public"]["Enums"]["order_source"]
          status: string
          symbol: string
          total_inr: number
          user_id: string
        }
        Insert: {
          broker: Database["public"]["Enums"]["broker_name"]
          broker_account_id: string
          created_at?: string
          exchange?: string
          id?: string
          order_type?: Database["public"]["Enums"]["order_kind"]
          price: number
          quantity: number
          side: Database["public"]["Enums"]["order_side"]
          source?: Database["public"]["Enums"]["order_source"]
          status?: string
          symbol: string
          total_inr: number
          user_id: string
        }
        Update: {
          broker?: Database["public"]["Enums"]["broker_name"]
          broker_account_id?: string
          created_at?: string
          exchange?: string
          id?: string
          order_type?: Database["public"]["Enums"]["order_kind"]
          price?: number
          quantity?: number
          side?: Database["public"]["Enums"]["order_side"]
          source?: Database["public"]["Enums"]["order_source"]
          status?: string
          symbol?: string
          total_inr?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_broker_account_id_fkey"
            columns: ["broker_account_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          pinned_indices: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          pinned_indices?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          pinned_indices?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          exchange: string
          id: string
          symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exchange?: string
          id?: string
          symbol: string
          user_id: string
        }
        Update: {
          created_at?: string
          exchange?: string
          id?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      broker_name: "zerodha" | "upstox" | "angel_one"
      order_kind: "market" | "limit"
      order_side: "buy" | "sell"
      order_source: "voice" | "manual"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
      broker_name: ["zerodha", "upstox", "angel_one"],
      order_kind: ["market", "limit"],
      order_side: ["buy", "sell"],
      order_source: ["voice", "manual"],
    },
  },
} as const
