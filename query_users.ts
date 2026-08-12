import { supabase } from './src/lib/supabaseClient.ts';
import 'dotenv/config';

async function run() {
  console.log('Fetching users...');
  try {
    const { data, error } = await supabase
      .from('User')
      .select('*');
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Data:', data.map(u => ({ id: u.id, email: u.email, name: u.name || u.username })));
    }
  } catch (err) {
    console.error('Failed:', err);
  }
}

run();
