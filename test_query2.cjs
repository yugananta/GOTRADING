const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL.replace(/postgresql:\/\/[^@]+@db\./, 'https://').replace(/\.supabase\.co.*$/, '.supabase.co');
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function test() {
  console.log("Testing with range...");
  let { data, error } = await supabase.from('Post').select('*').is('groupId', null).order('timestamp', { ascending: false }).range(0, 15);
  console.log("Timestamp Sort Result:", error?.message || data?.length);
}
test();
