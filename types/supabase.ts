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
                    alias: string | null
                    birthday: string // or Date, but supabase returns string usually
                    gender_identity: string | null
                    bio: string | null
                    avatar_url: string | null
                    verification_status: 'pending' | 'approved' | 'rejected'
                    subscription_tier: 'free' | 'premium'
                    verification_image_url: string | null
                    created_at: string
                    // age is calculated, might not be in the table row directly if it's a view, but we'll assume basic fetch
                }
                Insert: {
                    id: string
                    alias?: string | null
                    birthday: string
                    gender_identity?: string | null
                    bio?: string | null
                    avatar_url?: string | null
                    verification_status?: 'pending' | 'approved' | 'rejected'
                    subscription_tier?: 'free' | 'premium'
                    verification_image_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    alias?: string | null
                    birthday?: string
                    gender_identity?: string | null
                    bio?: string | null
                    avatar_url?: string | null
                    verification_status?: 'pending' | 'approved' | 'rejected'
                    subscription_tier?: 'free' | 'premium'
                    verification_image_url?: string | null
                    created_at?: string
                }
            }
            interests: {
                Row: {
                    id: string
                    user_id: string
                    interest: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    interest: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    interest?: string
                    created_at?: string
                }
            }
            // Add other tables as needed for types
        }
    }
}
