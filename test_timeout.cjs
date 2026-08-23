const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL.replace(/postgresql:\/\/[^@]+@db\./, 'https://').replace(/\.supabase\.co.*$/, '.supabase.co');
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function test() {
  let { data, error } = await supabase.rpc('get_statement_timeout');
  console.log("RPC Error:", error);
  console.log("RPC Data:", data);
}
test();
