const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf-8');
let supabaseUrl, supabaseKey;
envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { data, error } = await supabase.from('Post').select('id, userId, authorName, authorUsername, authorAvatar, authorRole, authorCity, authorCountry, authorVerified, content, videoUrl, images, marketBias, likesCount, commentsCount, bookmarksCount, repostsCount, likedBy, bookmarkedBy, repostedBy, timestamp, tags, chart, groupId, isOfficial, isPinned, isRepost, originalAuthorName').limit(1);
  if (error) console.error("Error with explicit select:", error);
  else console.log("Success with explicit select");
}
test();
