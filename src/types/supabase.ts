import { Database } from '@/lib/supabase/database.types';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

export type UserToken = Tables<'user_tokens'>;

export type UserTokenInsert = Omit<UserToken, 'id' | 'created_at' | 'updated_at'>;
export type UserTokenUpdate = Partial<UserToken> & { id: string };
