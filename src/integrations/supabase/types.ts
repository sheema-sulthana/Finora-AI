export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number;
          color: string;
          created_at: string;
          currency: string;
          id: string;
          institution: string | null;
          name: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance?: number;
          color?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          institution?: string | null;
          name: string;
          type?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          color?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          institution?: string | null;
          name?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ai_reports: {
        Row: {
          comparison: Json;
          created_at: string;
          health_score: number | null;
          id: string;
          insights: Json;
          period: string | null;
          predictions: Json;
          report_type: string;
          suggestions: Json;
          summary: string | null;
          user_id: string;
        };
        Insert: {
          comparison?: Json;
          created_at?: string;
          health_score?: number | null;
          id?: string;
          insights?: Json;
          period?: string | null;
          predictions?: Json;
          report_type?: string;
          suggestions?: Json;
          summary?: string | null;
          user_id: string;
        };
        Update: {
          comparison?: Json;
          created_at?: string;
          health_score?: number | null;
          id?: string;
          insights?: Json;
          period?: string | null;
          predictions?: Json;
          report_type?: string;
          suggestions?: Json;
          summary?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      bills: {
        Row: {
          active: boolean;
          amount: number;
          autopay: boolean;
          category: string;
          created_at: string;
          due_day: number;
          id: string;
          kind: string;
          last_paid_date: string | null;
          name: string;
          next_due_date: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          amount?: number;
          autopay?: boolean;
          category?: string;
          created_at?: string;
          due_day?: number;
          id?: string;
          kind?: string;
          last_paid_date?: string | null;
          name: string;
          next_due_date?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          amount?: number;
          autopay?: boolean;
          category?: string;
          created_at?: string;
          due_day?: number;
          id?: string;
          kind?: string;
          last_paid_date?: string | null;
          name?: string;
          next_due_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          id: string;
          month: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount?: number;
          category: string;
          created_at?: string;
          id?: string;
          month?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          id?: string;
          month?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          message: string;
          rating: number | null;
          user_id: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          id?: string;
          message: string;
          rating?: number | null;
          user_id: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          message?: string;
          rating?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          monthly_contribution: number;
          saved_amount: number;
          status: string;
          target_amount: number;
          target_date: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          id?: string;
          monthly_contribution?: number;
          saved_amount?: number;
          status?: string;
          target_amount?: number;
          target_date?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          monthly_contribution?: number;
          saved_amount?: number;
          status?: string;
          target_amount?: number;
          target_date?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          kind: string;
          link: string | null;
          read: boolean;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          link?: string | null;
          read?: boolean;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          link?: string | null;
          read?: boolean;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          budget_preferences: Json;
          created_at: string;
          currency: string;
          email: string;
          financial_goals: string[];
          full_name: string;
          health_score: number;
          id: string;
          income_frequency: string;
          income_source: string | null;
          language: string;
          monthly_income: number;
          notification_preferences: Json;
          onboarding_completed: boolean;
          theme: string;
          updated_at: string;
          user_type: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          budget_preferences?: Json;
          created_at?: string;
          currency?: string;
          email?: string;
          financial_goals?: string[];
          full_name?: string;
          health_score?: number;
          id: string;
          income_frequency?: string;
          income_source?: string | null;
          language?: string;
          monthly_income?: number;
          notification_preferences?: Json;
          onboarding_completed?: boolean;
          theme?: string;
          updated_at?: string;
          user_type?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          budget_preferences?: Json;
          created_at?: string;
          currency?: string;
          email?: string;
          financial_goals?: string[];
          full_name?: string;
          health_score?: number;
          id?: string;
          income_frequency?: string;
          income_source?: string | null;
          language?: string;
          monthly_income?: number;
          notification_preferences?: Json;
          onboarding_completed?: boolean;
          theme?: string;
          updated_at?: string;
          user_type?: string | null;
        };
        Relationships: [];
      };
      timeline_events: {
        Row: {
          created_at: string;
          description: string | null;
          event_date: string;
          icon: string;
          id: string;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          event_date?: string;
          icon?: string;
          id?: string;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          event_date?: string;
          icon?: string;
          id?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          account_id: string | null;
          amount: number;
          category: string;
          created_at: string;
          id: string;
          merchant: string;
          notes: string | null;
          payment_method: string;
          source: string;
          status: string;
          txn_date: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount: number;
          category?: string;
          created_at?: string;
          id?: string;
          merchant: string;
          notes?: string | null;
          payment_method?: string;
          source?: string;
          status?: string;
          txn_date?: string;
          type?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          amount?: number;
          category?: string;
          created_at?: string;
          id?: string;
          merchant?: string;
          notes?: string | null;
          payment_method?: string;
          source?: string;
          status?: string;
          txn_date?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
