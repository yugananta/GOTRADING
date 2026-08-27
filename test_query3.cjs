const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL.replace(/postgresql:\/\/[^@]+@db\./, 'https://').replace(/\.supabase\.co.*$/, '.supabase.co');
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function test() {
  console.log("Testing count...");
  let { count, error } = await supabase.from('Post').select('*', { count: 'exact', head: true });
  console.log("Count:", error?.message || count);
}
test();
