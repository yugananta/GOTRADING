import 'dotenv/config';

console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('DATABASE_URL protocol:', url.protocol);
    console.log('DATABASE_URL host:', url.host);
    console.log('DATABASE_URL username:', url.username);
    console.log('DATABASE_URL database name:', url.pathname);
    console.log('DATABASE_URL has password:', !!url.password);
  } catch (e) {
    console.log('DATABASE_URL is not a valid URL string');
  }
}
