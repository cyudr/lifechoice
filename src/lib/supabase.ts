import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables fallback to the provided keys
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://xaxnsazkrnwvzdrfbrsk.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Qex6jJx7b35yhO3hXuUuLg_x5IjJ3Jg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserWalletProfile {
  userId: string;
  isAnonymous: boolean;
  walletEmail: string;
  publisherId: string;
  adSlotId: string;
  balance: number;
  clicks: number;
  impressions: number;
  lastUpdated?: string;
}

// Default state fallback
export const DEFAULT_PROFILE: Omit<UserWalletProfile, 'userId' | 'isAnonymous'> = {
  walletEmail: 'cyudreamz@gmail.com', // fallback default from additional metadata
  publisherId: 'ca-pub-8369709738621970', // Provided by user
  adSlotId: '1092837482',
  balance: 0.00,
  clicks: 0,
  impressions: 0
};

/**
 * Perform anonymous or guest sign-in using Supabase auth
 */
export async function signInAsGuest() {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (err: any) {
    console.warn("Supabase signInAnonymously failed; using local guest session instead.", err);
    return { user: null, error: err.message || err };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || err };
  }
}

/**
 * Sign out of active Supabase session
 */
export async function signOutUser() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Sign out error", err);
  }
}

/**
 * Save / UPSERT balance and AdSense profiles to Supabase table
 * Falls back safely if the relational table "user_ad_revenue" does not exist yet.
 */
export async function syncWalletProfileToSupabase(profile: UserWalletProfile): Promise<{ success: boolean; error: string | null; dbWarning?: boolean }> {
  try {
    const { error } = await supabase
      .from('user_ad_revenue')
      .upsert({
        user_id: profile.userId,
        is_anonymous: profile.isAnonymous,
        wallet_email: profile.walletEmail,
        publisher_id: profile.publisherId,
        ad_slot_id: profile.adSlotId,
        balance: profile.balance,
        clicks: profile.clicks,
        impressions: profile.impressions,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      // Postgres error 42P01: relation (table) does not exist
      if (error.code === '42P01') {
        return { success: false, error: 'Database table user_ad_revenue has not been created yet in your Supabase dashboard.', dbWarning: true };
      }
      throw error;
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || JSON.stringify(err) };
  }
}

/**
 * Retrieve User Profile from Supabase
 */
export async function fetchWalletProfileFromSupabase(userId: string): Promise<{ data: UserWalletProfile | null; error: string | null; dbWarning?: boolean }> {
  try {
    const { data, error } = await supabase
      .from('user_ad_revenue')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') {
        return { data: null, error: 'Table user_ad_revenue not created.', dbWarning: true };
      }
      throw error;
    }

    if (data) {
      const mapped: UserWalletProfile = {
        userId: data.user_id,
        isAnonymous: data.is_anonymous,
        walletEmail: data.wallet_email,
        publisherId: data.publisher_id,
        adSlotId: data.ad_slot_id,
        balance: Number(data.balance || 0),
        clicks: Number(data.clicks || 0),
        impressions: Number(data.impressions || 0)
      };
      return { data: mapped, error: null };
    }
    return { data: null, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || JSON.stringify(err) };
  }
}

/**
 * SQL snippet users can copy to create their table instantly in the Supabase SQL editor.
 */
export const SUPABASE_SQL_CREATION_SNIPPET = `-- RUN THIS CODE IN YOUR SUPABASE SQL EDITOR TO PROVISION REVENUE STORAGE:

create table if not exists public.user_ad_revenue (
    user_id text primary key,
    is_anonymous boolean default true,
    wallet_email text default 'cyudreamz@gmail.com',
    publisher_id text default 'ca-pub-8369709738621970',
    ad_slot_id text default '1092837482',
    balance numeric(10, 4) default 0.0000,
    clicks integer default 0,
    impressions integer default 0,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) to grant access to authenticated or anonymous users
alter table public.user_ad_revenue enable row level security;

-- Create simple policy permitting anyone with the anon/service keys to manage records
create policy "Allow all users to manage their own ad revenue"
    on public.user_ad_revenue
    for all
    using (true)
    with check (true);
`;
