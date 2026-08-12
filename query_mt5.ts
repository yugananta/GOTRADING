import { supabase } from './src/lib/supabaseClient.ts';
import 'dotenv/config';

async function run() {
  console.log('Fetching user_mt5_accounts...');
  try {
    const { data, error } = await supabase
      .from('user_mt5_accounts')
      .select('*');
    
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
