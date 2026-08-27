import { supabase } from './src/lib/supabaseClient.ts';
async function test() {
  const userId = '1e682f1b-820e-4338-a793-e787b03debc2';
  const { data } = await supabase.from('Post').select('*').eq('userId', userId).contains('tags', ['__metatrader_account__']);
  console.log('Result:', data);
}
test().then(() => process.exit(0));
