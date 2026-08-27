const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL.replace(/postgresql:\/\/[^@]+@db\./, 'https://').replace(/\.supabase\.co.*$/, '.supabase.co');
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function test() {
  console.log("Testing order by id...");
  let { data, error } = await supabase.from('Post').select('id, timestamp').is('groupId', null).order('id', { ascending: false }).limit(5);
  console.log("ID Sort Result:", error || data);

  console.log("Testing order by timestamp...");
  let res2 = await supabase.from('Post').select('id, timestamp').is('groupId', null).order('timestamp', { ascending: false }).limit(5);
  console.log("Timestamp Sort Result:", res2.error || res2.data);
}
test();
