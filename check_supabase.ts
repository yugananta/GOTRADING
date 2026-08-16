import { supabase } from './src/lib/supabaseClient.ts';
import 'dotenv/config';

async function run() {
  console.log('Testing connection to Supabase...');
  try {
    // Check if we can query any table
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('count')
      .limit(1);
    
    if (userError) {
      console.error('Error querying User table:', userError);
    } else {
      console.log('Successfully queried User table. Count data:', userData);
    }

    // Now check if we can query Story table
    const { data: storyData, error: storyError } = await supabase
      .from('Story')
      .select('*')
      .limit(5);

    if (storyError) {
      console.error('Error querying Story table:', storyError);
    } else {
      console.log('Successfully queried Story table. Sample data:', storyData);
    }
  } catch (err) {
    console.error('Execution failed:', err);
  }
}

run();
