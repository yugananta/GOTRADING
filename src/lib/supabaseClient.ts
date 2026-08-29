import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let warnLogged = false;
let quotaExceeded = false;

export const getSupabase = (): SupabaseClient | null => {
  if (quotaExceeded) return null;
  if (supabaseClient) return supabaseClient;

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

  const DEFAULT_SUPABASE_URL = 'https://lsjqoznizsshpbvvzzam.supabase.co';
  const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzanFvem5penNzaHBidnZ6emFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDI1NDg3MiwiZXhwIjoyMDk5ODMwODcyfQ.9CMuqhXNPo4EALqeNX9UyTj35CbgzT7LWDrb1imqAGs';

  let rawUrl = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || viteUrl;
  let rawKey = 
    getEnv('SUPABASE_SERVICE_ROLE_KEY') || 
    getEnv('SUPABASE_ANON_KEY') || 
    getEnv('VITE_SUPABASE_ANON_KEY') || 
    getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY') || 
    getEnv('SUPABASE_KEY') ||
    viteServiceRoleKey || 
    viteAnonKey;

  let supabaseUrl = rawUrl;
  let supabaseServiceRoleKey = rawKey;

  // Validate that supabaseUrl is actually an HTTP/HTTPS url, not postgres connection string
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    supabaseUrl = DEFAULT_SUPABASE_URL;
  }
  if (!supabaseServiceRoleKey || supabaseServiceRoleKey.length < 20) {
    supabaseServiceRoleKey = DEFAULT_SUPABASE_KEY;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: {
        timeout: 30000,
        params: {
          eventsPerSecond: 10
        }
      }
    });
    return supabaseClient;
  } catch (err: any) {
    console.error('Failed to initialize Supabase with custom URL, falling back to default:', err?.message || err);
    try {
      supabaseClient = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      return supabaseClient;
    } catch (fallbackErr) {
      console.error('Fatal: Default Supabase initialization failed:', fallbackErr);
      return null;
    }
  }
};

const createMockChain = () => {
  const target = () => {};
  const realPromise = Promise.resolve({ data: [], error: null });
  const singlePromise = Promise.resolve({ data: null, error: null });

  const proxy: any = new Proxy(target, {
    get(_t, prop) {
      if (prop === 'then') {
        return (onfulfilled: any, onrejected: any) => realPromise.then(onfulfilled, onrejected);
      }
      if (prop === 'catch') {
        return (onrejected: any) => realPromise.catch(onrejected);
      }
      if (prop === 'finally') {
        return (onfinally: any) => realPromise.finally(onfinally);
      }
      if (prop === 'single' || prop === 'maybeSingle') {
        return () => singlePromise;
      }
      return () => proxy;
    }
  });

  return proxy;
};

export const supabase = new Proxy({} as any, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) {
      if (prop === 'from') {
        return () => createMockChain();
      }
      return undefined;
    }
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

