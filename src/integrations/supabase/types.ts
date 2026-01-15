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
      app_settings: {
        Row: {
          created_at: string | null
          id: string
          is_first_login: boolean
          password_hash: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_first_login?: boolean
          password_hash: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_first_login?: boolean
          password_hash?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      bill_categories: {
        Row: {
          bill_id: string
          category_id: string
          id: string
        }
        Insert: {
          bill_id: string
          category_id: string
          id?: string
        }
        Update: {
          bill_id?: string
          category_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_categories_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          created_at: string | null
          current_installment: number | null
          due_date: string
          id: string
          name: string
          observation: string | null
          paid_at: string | null
          paid_value: number | null
          recurrence: string
          recurrence_months: number | null
          status: string
          total_installments: number | null
          updated_at: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string | null
          current_installment?: number | null
          due_date: string
          id?: string
          name: string
          observation?: string | null
          paid_at?: string | null
          paid_value?: number | null
          recurrence?: string
          recurrence_months?: number | null
          status?: string
          total_installments?: number | null
          updated_at?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string | null
          current_installment?: number | null
          due_date?: string
          id?: string
          name?: string
          observation?: string | null
          paid_at?: string | null
          paid_value?: number | null
          recurrence?: string
          recurrence_months?: number | null
          status?: string
          total_installments?: number | null
          updated_at?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          category_id: string
          expense_id: string
          id: string
        }
        Insert: {
          category_id: string
          expense_id: string
          id?: string
        }
        Update: {
          category_id?: string
          expense_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expense_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_entries: {
        Row: {
          bill_id: string | null
          created_at: string | null
          date: string
          id: string
          name: string
          user_id: string
          value: number
        }
        Insert: {
          bill_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          name: string
          user_id: string
          value: number
        }
        Update: {
          bill_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          name?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_entries_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      income_categories: {
        Row: {
          category_id: string
          id: string
          income_id: string
        }
        Insert: {
          category_id: string
          id?: string
          income_id: string
        }
        Update: {
          category_id?: string
          id?: string
          income_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_categories_income_id_fkey"
            columns: ["income_id"]
            isOneToOne: false
            referencedRelation: "income_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      income_entries: {
        Row: {
          account: string | null
          created_at: string | null
          date: string
          id: string
          origin: string
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          account?: string | null
          created_at?: string | null
          date: string
          id?: string
          origin: string
          updated_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          account?: string | null
          created_at?: string | null
          date?: string
          id?: string
          origin?: string
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      income_prediction_categories: {
        Row: {
          category_id: string
          id: string
          prediction_id: string
        }
        Insert: {
          category_id: string
          id?: string
          prediction_id: string
        }
        Update: {
          category_id?: string
          id?: string
          prediction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_prediction_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_prediction_categories_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "income_predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      income_predictions: {
        Row: {
          created_at: string | null
          date: string
          id: string
          origin: string
          paid_at: string | null
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          origin: string
          paid_at?: string | null
          updated_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          origin?: string
          paid_at?: string | null
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      loans: {
        Row: {
          created_at: string | null
          due_date: string
          id: string
          installment_value: number
          name: string
          observation: string | null
          paid_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          due_date: string
          id?: string
          installment_value: number
          name: string
          observation?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          due_date?: string
          id?: string
          installment_value?: number
          name?: string
          observation?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string
          cpf: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          birth_date: string
          cpf: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          birth_date?: string
          cpf?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          updated_at?: string | null
          user_id?: string
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
