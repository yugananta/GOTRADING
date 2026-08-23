import { supabase } from './src/lib/supabaseClient.ts';
async function test() {
  const payload = {
        id: 'test_' + Date.now(),
        userId: '1e682f1b-820e-4338-a793-e787b03debc2',
        authorName: 'System',
        authorUsername: 'sys',
        content: `MetaTrader Test`,
        tags: ['__metatrader_account__'],
        chart: {},
        timestamp: new Date().toISOString()
  };
  const { error } = await supabase.from('Post').insert(payload);
  console.log('Insert Error:', error);
}
test().then(() => process.exit(0));
