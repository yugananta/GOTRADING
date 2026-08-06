const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL.replace(/postgresql:\/\/[^@]+@db\./, 'https://').replace(/\.supabase\.co.*$/, '.supabase.co');
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function test() {
  const start = Date.now();
  let { data, error } = await supabase.from('Post').select('*').is('groupId', null).limit(100);
  console.log("Without order time taken:", Date.now() - start, "ms", error?.message);
}
test();
