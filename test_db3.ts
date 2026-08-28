import { supabase } from './src/lib/supabaseClient.ts';
async function test() {
  const { data } = await supabase.from('Post').select('id, userId, content, chart, tags').contains('tags', ['__metatrader_account__']);
  console.log('Accounts:', data);
}
test().then(() => process.exit(0));
