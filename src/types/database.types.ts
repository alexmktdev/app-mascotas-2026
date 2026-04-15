/**
 * Tipos generados manualmente basados en el esquema SQL.
 * En producción, regenerar con:
 * npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
 */

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
          first_name: string
          last_name: string
          email: string
          role: 'admin' | 'staff'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          email: string
          role?: 'admin' | 'staff'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          role?: 'admin' | 'staff'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      pets: {
        Row: {
          id: string
          name: string
          species: 'dog' | 'cat'
          breed: string | null
          age_months: number
          gender: 'male' | 'female'
          size: 'small' | 'medium' | 'large' | 'xlarge' | null
          color: string | null
          contact_phone: string | null
          weight_kg: number | null
          sterilized: boolean
          vaccinated: boolean
          dewormed: boolean
          microchip: boolean
          health_notes: string | null
          personality: string | null
          story: string | null
          good_with_kids: boolean | null
          good_with_dogs: boolean | null
          good_with_cats: boolean | null
          special_needs: string | null
          status: 'available' | 'in_process' | 'adopted'
          photo_urls: string[]
          drive_folder_id: string | null
          intake_date: string
          adopted_date: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          species: 'dog' | 'cat'
          breed?: string | null
          age_months: number
          gender: 'male' | 'female'
          size?: 'small' | 'medium' | 'large' | 'xlarge' | null
          color?: string | null
          contact_phone?: string | null
          weight_kg?: number | null
          sterilized?: boolean
          vaccinated?: boolean
          dewormed?: boolean
          microchip?: boolean
          health_notes?: string | null
          personality?: string | null
          story?: string | null
          good_with_kids?: boolean | null
          good_with_dogs?: boolean | null
          good_with_cats?: boolean | null
          special_needs?: string | null
          status?: 'available' | 'in_process' | 'adopted'
          photo_urls?: string[]
          drive_folder_id?: string | null
          intake_date?: string
          adopted_date?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          species?: 'dog' | 'cat'
          breed?: string | null
          age_months?: number
          gender?: 'male' | 'female'
          size?: 'small' | 'medium' | 'large' | 'xlarge' | null
          color?: string | null
          contact_phone?: string | null
          weight_kg?: number | null
          sterilized?: boolean
          vaccinated?: boolean
          dewormed?: boolean
          microchip?: boolean
          health_notes?: string | null
          personality?: string | null
          story?: string | null
          good_with_kids?: boolean | null
          good_with_dogs?: boolean | null
          good_with_cats?: boolean | null
          special_needs?: string | null
          status?: 'available' | 'in_process' | 'adopted'
          photo_urls?: string[]
          drive_folder_id?: string | null
          intake_date?: string
          adopted_date?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pets_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pets_updated_by_fkey'
            columns: ['updated_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      adoption_requests: {
        Row: {
          id: string
          pet_id: string
          full_name: string
          email: string
          phone: string
          id_number: string
          address: string
          city: string
          housing_type: 'house' | 'apartment' | 'farm' | 'other' | null
          has_yard: boolean | null
          has_other_pets: boolean | null
          other_pets_description: string | null
          has_children: boolean | null
          children_ages: string | null
          motivation: string
          experience_with_pets: string | null
          work_schedule: string | null
          status: 'pending' | 'reviewing' | 'approved' | 'rejected'
          admin_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          full_name: string
          email: string
          phone: string
          id_number: string
          address: string
          city: string
          housing_type?: 'house' | 'apartment' | 'farm' | 'other' | null
          has_yard?: boolean | null
          has_other_pets?: boolean | null
          other_pets_description?: string | null
          has_children?: boolean | null
          children_ages?: string | null
          motivation: string
          experience_with_pets?: string | null
          work_schedule?: string | null
          status?: 'pending' | 'reviewing' | 'approved' | 'rejected'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          full_name?: string
          email?: string
          phone?: string
          id_number?: string
          address?: string
          city?: string
          housing_type?: 'house' | 'apartment' | 'farm' | 'other' | null
          has_yard?: boolean | null
          has_other_pets?: boolean | null
          other_pets_description?: string | null
          has_children?: boolean | null
          children_ages?: string | null
          motivation?: string
          experience_with_pets?: string | null
          work_schedule?: string | null
          status?: 'pending' | 'reviewing' | 'approved' | 'rejected'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'adoption_requests_pet_id_fkey'
            columns: ['pet_id']
            referencedRelation: 'pets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'adoption_requests_reviewed_by_fkey'
            columns: ['reviewed_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      audit_log: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          old_values: Json | null
          new_values: Json | null
          performed_by: string | null
          performed_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          old_values?: Json | null
          new_values?: Json | null
          performed_by?: string | null
          performed_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: 'INSERT' | 'UPDATE' | 'DELETE'
          old_values?: Json | null
          new_values?: Json | null
          performed_by?: string | null
          performed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_log_performed_by_fkey'
            columns: ['performed_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: string
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
