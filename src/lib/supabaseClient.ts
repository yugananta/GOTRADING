import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Polyfill native WebSocket in Node.js environments (e.g. Node 20 on Railway)
if (typeof window === 'undefined' && typeof (globalThis as any).WebSocket === 'undefined') {
  try {
    const ws = typeof require !== 'undefined' ? require('ws') : null;
    if (ws) {
      (globalThis as any).WebSocket = ws;
    }
  } catch (e) {}
}

const DEFAULT_SUPABASE_URL = 'https://lsjqoznizsshpbvvzzam.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzanFvem5penNzaHBidnZ6emFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDI1NDg3MiwiZXhwIjoyMDk5ODMwODcyfQ.9CMuqhXNPo4EALqeNX9UyTj35CbgzT7LWDrb1imqAGs';

const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

let viteUrl = '';
let viteAnonKey = '';
let viteServiceRoleKey = '';

try {
  viteUrl = import.meta.env.VITE_SUPABASE_URL || '';
} catch (e) {}

try {
  viteAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
} catch (e) {}

try {
  viteServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
} catch (e) {}

let rawUrl = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || viteUrl;
let rawKey = 
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || 
  getEnv('SUPABASE_ANON_KEY') || 
  getEnv('VITE_SUPABASE_ANON_KEY') || 
  getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY') || 
  getEnv('SUPABASE_KEY') ||
  viteServiceRoleKey || 
  viteAnonKey;

let supabaseUrl = (rawUrl && rawUrl.startsWith('http')) ? rawUrl : DEFAULT_SUPABASE_URL;
let supabaseServiceRoleKey = (rawKey && rawKey.length > 20) ? rawKey : DEFAULT_SUPABASE_KEY;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: {
    timeout: 30000,
    params: {
      eventsPerSecond: 10
    }
  }
});

export const getSupabase = (): SupabaseClient => supabase;


