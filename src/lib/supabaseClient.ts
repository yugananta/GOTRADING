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

  let supabaseUrl = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || viteUrl;
  let supabaseServiceRoleKey = 
    getEnv('SUPABASE_SERVICE_ROLE_KEY') || 
    getEnv('SUPABASE_ANON_KEY') || 
    getEnv('VITE_SUPABASE_ANON_KEY') || 
    getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY') || 
    viteServiceRoleKey || 
    viteAnonKey;

  const databaseUrl = getEnv('DATABASE_URL');
  if (!supabaseUrl && databaseUrl) {
    const dbUrl = databaseUrl;
    const supabaseCoMatch = dbUrl.match(/@db\.([a-z0-9]+)\.supabase\.co/) || dbUrl.match(/db\.([a-z0-9]+)\.supabase\.co/);
    const poolerMatch = dbUrl.match(/postgres\.([a-z0-9]+):/);

    if (supabaseCoMatch && supabaseCoMatch[1]) {
      supabaseUrl = `https://${supabaseCoMatch[1]}.supabase.co`;
    } else if (poolerMatch && poolerMatch[1]) {
      supabaseUrl = `https://${poolerMatch[1]}.supabase.co`;
    }
  }

  if (supabaseUrl && (supabaseUrl.startsWith('postgresql://') || supabaseUrl.startsWith('postgres://'))) {
    const match = supabaseUrl.match(/@db\.([a-z0-9]+)\.supabase\.co/) || supabaseUrl.match(/db\.([a-z0-9]+)\.supabase\.co/) || supabaseUrl.match(/postgres\.([a-z0-9]+):/);
    if (match && match[1]) {
      const ref = match[1];
      supabaseUrl = `https://${ref}.supabase.co`;
    }
  }

  if (supabaseUrl && supabaseUrl.startsWith('http://')) {
    supabaseUrl = supabaseUrl.replace('http://', 'https://');
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    if (!warnLogged) {
      console.warn('Supabase credentials missing or incomplete. Operating in robust local/mock fallback mode.');
      warnLogged = true;
    }
    return null;
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
  } catch (err) {
    return null;
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
    if (quotaExceeded) {
      if (prop === 'from') {
        return () => createMockChain();
      }
      if (prop === 'auth') {
        return {
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Quota exceeded' } }),
          signOut: () => Promise.resolve({ error: null })
        };
      }
      return () => Promise.resolve({ data: null, error: null });
    }
    const client = getSupabase();
    if (!client) {
      if (prop === 'from') {
        return () => createMockChain();
      }
      return undefined;
    }
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return (...args: any[]) => {
        const result = value.apply(client, args);
        if (result && typeof result.then === 'function') {
          return result.then((res: any) => {
            if (res && res.error && typeof res.error.message === 'string' && (res.error.message.includes('exceed_egress_quota') || res.error.message.includes('quota'))) {
              quotaExceeded = true;
              console.warn('Supabase quota exceeded detected. Switching to robust local/mock fallback mode.');
              return { data: [], error: null };
            }
            return res;
          }).catch((err: any) => {
            if (err && (String(err?.message || err).includes('exceed_egress_quota') || String(err?.message || err).includes('quota'))) {
              quotaExceeded = true;
              console.warn('Supabase quota exceeded detected. Switching to robust local/mock fallback mode.');
            }
            return { data: [], error: null };
          });
        }
        return result;
      };
    }
    return value;
  }
});

