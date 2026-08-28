import { supabase } from './src/lib/supabaseClient.ts';
async function test() {
  const { data, error } = await supabase.from('Post').select('id, content, tags, chart').contains('tags', ['__metatrader_account__']);
  console.log('Error:', error);
  console.log('Data:', data);
}
test().then(() => process.exit(0));
