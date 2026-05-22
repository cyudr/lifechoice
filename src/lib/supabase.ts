import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables fallback to the provided keys
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://xaxnsazkrnwvzdrfbrsk.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Qex6jJx7b35yhO3hXuUuLg_x5IjJ3Jg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
