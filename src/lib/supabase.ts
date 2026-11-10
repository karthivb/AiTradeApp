import { createClient, SupabaseClient } from '@supabase/supabase-js';

const RUNTIME_STORAGE_KEY = 'tradepilot_supabase_runtime_config';

// Built-in Production Project Defaults (karthivb's Project: bixjrkdqxurgsjkvgkwq)
// Note: Anon/Publishable keys are safe public client keys governed by Postgres RLS.
export const DEFAULT_SUPABASE_URL = 'https://bixjrkdqxurgsjkvgkwq.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeGpya2RxeHVyZ3Nqa3Zna3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyOTA1MTUsImV4cCI6MjEwOTg2NjUxNX0.9UEdprGwvAmCFXKmx6LzSxpgNtNa_qFXGVvyGmSegkI';

interface RuntimeSupabaseConfig {
  url: string;
  anonKey: string;
}

function getRuntimeConfig(): RuntimeSupabaseConfig | null {
  try {
    const raw = localStorage.getItem(RUNTIME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RuntimeSupabaseConfig;
    if (parsed.url?.startsWith('http') && parsed.anonKey?.length > 20) {
      return parsed;
    }
  } catch {
    // Ignore localStorage parse error
  }
  return null;
}

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const runtimeCfg = getRuntimeConfig();

export const activeSupabaseUrl =
  runtimeCfg?.url ||
  (envUrl && !envUrl.includes('your-project-ref') && envUrl.startsWith('http')
    ? envUrl
    : DEFAULT_SUPABASE_URL);

export const activeSupabaseAnonKey =
  runtimeCfg?.anonKey ||
  (envKey && !envKey.includes('your-public-anon-key') && envKey.length > 20
    ? envKey
    : DEFAULT_SUPABASE_ANON_KEY);

export let isSupabaseConfigured = Boolean(
  activeSupabaseUrl && activeSupabaseAnonKey
);

export let supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(activeSupabaseUrl, activeSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function configureRuntimeSupabase(
  url: string,
  anonKey: string
): SupabaseClient {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  localStorage.setItem(
    RUNTIME_STORAGE_KEY,
    JSON.stringify({ url: cleanUrl, anonKey: cleanKey })
  );
  supabase = createClient(cleanUrl, cleanKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  isSupabaseConfigured = true;
  return supabase;
}

export function clearRuntimeSupabase(): void {
  localStorage.removeItem(RUNTIME_STORAGE_KEY);
  supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  isSupabaseConfigured = true;
}
