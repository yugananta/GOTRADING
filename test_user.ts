import { supabase } from './src/lib/supabaseClient.ts';
async function test() {
  const { data } = await supabase.from('Post').select('userId').contains('tags', ['__metatrader_account__']);
  console.log('User IDs with MT5:', data);
}
test().then(() => process.exit(0));
