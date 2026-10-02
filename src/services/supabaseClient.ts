import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageService } from './storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabaseUrl(): string {
  return (process.env.EXPO_PUBLIC_SUPABASE_URL || SUPABASE_URL).trim();
}

function getSupabaseAnonKey(): string {
  return (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY).trim();
}

let clientInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url.length > 0 &&
    key.length > 0 &&
    !url.includes('your-supabase-project')
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        storage: {
          getItem: (key: string) => StorageService.getItem(key),
          setItem: (key: string, value: string) => StorageService.setItem(key, value),
          removeItem: (key: string) => StorageService.deleteItem(key),
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return clientInstance;
}

export async function getSupabaseSession() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

export async function getSupabaseAuthUser() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user;
}
