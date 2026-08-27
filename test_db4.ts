import { supabase } from './src/lib/supabaseClient.ts';
async function test() {
  const { data } = await supabase.from('Post').select('id, content').ilike('content', '%1010%');
  console.log('Posts:', data);
}
test().then(() => process.exit(0));
