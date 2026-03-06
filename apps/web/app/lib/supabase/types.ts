export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      instances: {
        Row: {
          id: string
          organization_id: string
          name: string
          slug: string | null
          status: 'active' | 'suspended' | 'archived'
          subscription_tier: string | null
          seat_limit: number | null
          user_limit: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          slug?: string | null
          status?: 'active' | 'suspended' | 'archived'
          subscription_tier?: string | null
          seat_limit?: number | null
          user_limit?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          slug?: string | null
          status?: 'active' | 'suspended' | 'archived'
          subscription_tier?: string | null
          seat_limit?: number | null
          user_limit?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      instance_branding: {
        Row: {
          id: string
          tenant_id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          accent_color: string | null
          domain: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          accent_color?: string | null
          domain?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          accent_color?: string | null
          domain?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          tenant_id: string
          instance_id: string | null
          program_id: string | null
          name: string
          description: string | null
          location: string | null
          status: string | null
          start_at: string | null
          end_at: string | null
          total_budget: number
          spent_budget: number
          currency: string
          ai_generated: boolean
          ai_generated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          instance_id?: string | null
          program_id?: string | null
          name: string
          description?: string | null
          location?: string | null
          status?: string | null
          start_at?: string | null
          end_at?: string | null
          total_budget?: number
          spent_budget?: number
          currency?: string
          ai_generated?: boolean
          ai_generated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          instance_id?: string | null
          program_id?: string | null
          name?: string
          description?: string | null
          location?: string | null
          status?: string | null
          start_at?: string | null
          end_at?: string | null
          total_budget?: number
          spent_budget?: number
          currency?: string
          ai_generated?: boolean
          ai_generated_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          tenant_id: string
          project_id: string
          milestone_id: string | null
          name: string
          description: string | null
          status: 'todo' | 'in_progress' | 'blocked' | 'done'
          priority: number
          due_at: string | null
          estimated_cost: number | null
          order_index: number
          assignee_email: string | null
          ai_generated: boolean
          allocated_budget: number
          spent_budget: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          project_id: string
          milestone_id?: string | null
          name: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'blocked' | 'done'
          priority?: number
          due_at?: string | null
          estimated_cost?: number | null
          order_index?: number
          assignee_email?: string | null
          ai_generated?: boolean
          allocated_budget?: number
          spent_budget?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          project_id?: string
          milestone_id?: string | null
          name?: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'blocked' | 'done'
          priority?: number
          due_at?: string | null
          estimated_cost?: number | null
          order_index?: number
          assignee_email?: string | null
          ai_generated?: boolean
          allocated_budget?: number
          spent_budget?: number
          created_at?: string
          updated_at?: string
        }
      }
      project_budget_items: {
        Row: {
          id: string
          tenant_id: string
          project_id: string
          category: string
          description: string | null
          estimated_amount: number
          actual_amount: number
          ai_generated: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          project_id: string
          category: string
          description?: string | null
          estimated_amount: number
          actual_amount?: number
          ai_generated?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          project_id?: string
          category?: string
          description?: string | null
          estimated_amount?: number
          actual_amount?: number
          ai_generated?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      task_access_tokens: {
        Row: {
          id: string
          tenant_id: string
          task_id: string
          email: string
          token: string
          expires_at: string
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          task_id: string
          email: string
          token: string
          expires_at: string
          last_used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          task_id?: string
          email?: string
          token?: string
          expires_at?: string
          last_used_at?: string | null
          created_at?: string
        }
      }
      task_comments: {
        Row: {
          id: string
          tenant_id: string
          task_id: string
          author_email: string
          author_name: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          task_id: string
          author_email: string
          author_name?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          task_id?: string
          author_email?: string
          author_name?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          tenant_id: string
          project_id: string | null
          task_id: string | null
          title: string
          content: string
          content_type: string
          status: string
          version: number
          ai_generated: boolean
          file_path: string | null
          file_name: string | null
          file_size: number | null
          mime_type: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          project_id?: string | null
          task_id?: string | null
          title: string
          content?: string
          content_type?: string
          status?: string
          version?: number
          ai_generated?: boolean
          file_path?: string | null
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          project_id?: string | null
          task_id?: string | null
          title?: string
          content?: string
          content_type?: string
          status?: string
          version?: number
          ai_generated?: boolean
          file_path?: string | null
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      programs: {
        Row: {
          id: string
          tenant_id: string
          project_id: string | null
          name: string
          description: string | null
          status: 'draft' | 'active' | 'archived'
          start_at: string | null
          end_at: string | null
          total_budget: number
          spent_budget: number
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          project_id?: string | null
          name: string
          description?: string | null
          status?: 'draft' | 'active' | 'archived'
          start_at?: string | null
          end_at?: string | null
          total_budget?: number
          spent_budget?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          project_id?: string | null
          name?: string
          description?: string | null
          status?: 'draft' | 'active' | 'archived'
          start_at?: string | null
          end_at?: string | null
          total_budget?: number
          spent_budget?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      memberships: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          role_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          role_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          role_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          external_id: string | null
          email: string | null
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          external_id?: string | null
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          external_id?: string | null
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      instance_status: 'active' | 'suspended' | 'archived'
      program_status: 'draft' | 'active' | 'archived'
      task_status: 'todo' | 'in_progress' | 'blocked' | 'done'
      event_status: 'draft' | 'scheduled' | 'completed' | 'cancelled'
      survey_status: 'draft' | 'active' | 'closed'
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
