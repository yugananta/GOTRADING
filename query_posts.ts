import { supabase } from './src/lib/supabaseClient.ts';
import 'dotenv/config';

async function run() {
  console.log('Fetching Post table metatrader entries...');
  try {
    const { data, error } = await supabase
      .from('Post')
      .select('*')
      .eq('userId', '13ecaf22-7f34-4430-9750-2a74d79c910a')
      .contains('tags', ['__metatrader_account__']);
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('Failed:', err);
  }
}

run();
