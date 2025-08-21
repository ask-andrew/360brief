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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          timezone: string
          digest_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          digest_time?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          digest_time?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          key: string
          value: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          key: string
          value?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          key?: string
          value?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      digest_schedules: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          frequency: 'daily' | 'weekly' | 'weekdays';
          time: string;
          timezone: string;
          include_emails: boolean;
          include_calendar: boolean;
          summary_length: 'brief' | 'detailed' | 'comprehensive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          frequency: 'daily' | 'weekly' | 'weekdays';
          time: string;
          timezone: string;
          include_emails?: boolean;
          include_calendar?: boolean;
          summary_length?: 'brief' | 'detailed' | 'comprehensive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          frequency?: 'daily' | 'weekly' | 'weekdays';
          time?: string;
          timezone?: string;
          include_emails?: boolean;
          include_calendar?: boolean;
          summary_length?: 'brief' | 'detailed' | 'comprehensive';
          created_at?: string;
          updated_at?: string;
        };
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
