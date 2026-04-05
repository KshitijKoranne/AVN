// AVN Track — Database Types
// Mirrors the Supabase schema exactly

export type AffectedJoint =
  | 'left_hip' | 'right_hip'
  | 'left_knee' | 'right_knee'
  | 'left_shoulder' | 'right_shoulder'
  | 'left_wrist' | 'right_wrist'
  | 'left_ankle' | 'right_ankle'

export type SurgicalStatus = 'pre_surgical' | 'post_thr' | 'conservative' | 'other_surgery'

export type SurgicalStatusEntry = {
  status: SurgicalStatus
  surgery_date?: string       // ISO date string
  implant_brand?: string      // e.g. "Stryker", "DePuy", "Zimmer"
  implant_type?: string       // e.g. "ceramic_on_poly", "metal_on_metal"
  surgeon_notes?: string
}

// Key = joint identifier, value = its surgical info
export type SurgicalStatusMap = Partial<Record<AffectedJoint, SurgicalStatusEntry>>

export type AVNStage = 'stage_0' | 'stage_1' | 'stage_2' | 'stage_3' | 'stage_4' | 'unknown'

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

// Pain log location values
export type PainLocation =
  | 'left_groin' | 'right_groin'
  | 'left_buttock' | 'right_buttock'
  | 'left_thigh' | 'right_thigh'
  | 'left_knee' | 'right_knee'
  | 'left_shoulder' | 'right_shoulder'
  | 'left_wrist' | 'right_wrist'
  | 'other'

export type PainTrigger =
  | 'walking' | 'stairs' | 'sitting' | 'standing'
  | 'lying_down' | 'weather' | 'nothing' | 'other'

export type PainRelief =
  | 'rest' | 'ice' | 'heat' | 'medication'
  | 'elevation' | 'physiotherapy' | 'nothing' | 'other'

export type ExerciseCategory = 'pre_surgical' | 'post_thr' | 'general_avn' | 'all'

// ─── Supabase Database type map ──────────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          date_of_birth: string | null
          gender: Gender | null
          country: string | null
          diagnosis_date: string | null
          avascular_stage: AVNStage | null
          primary_cause: string | null
          affected_joints: AffectedJoint[]
          surgical_status: SurgicalStatusMap
          onboarding_done: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      pain_logs: {
        Row: {
          id: string
          user_id: string
          logged_at: string
          log_date: string
          locations: PainLocation[]
          intensity: number
          triggers: PainTrigger[]
          relief: PainRelief[]
          post_surgical_pain: boolean
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['pain_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['pain_logs']['Insert']>
      }
      exercises_library: {
        Row: {
          id: string
          name: string
          description: string | null
          instructions: string | null
          image_url: string | null
          default_sets: number | null
          default_reps: number | null
          default_duration_s: number | null
          category: ExerciseCategory
          applicable_joints: string[]
          warning: string | null
          contraindications: string[]
          order_index: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['exercises_library']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['exercises_library']['Insert']>
      }
      exercise_logs: {
        Row: {
          id: string
          user_id: string
          exercise_id: string | null
          logged_at: string
          log_date: string
          sets_completed: number | null
          reps_completed: number | null
          duration_s: number | null
          pain_during: number | null
          skipped: boolean
          skip_reason: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['exercise_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['exercise_logs']['Insert']>
      }
    }
  }
}
