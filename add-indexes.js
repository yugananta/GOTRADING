import pkg from 'pg';
const { Client } = pkg;

async function addIndexes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    console.log('Adding index on Post(timestamp DESC)...');
    await client.query('CREATE INDEX IF NOT EXISTS "Post_timestamp_idx" ON "public"."Post" ("timestamp" DESC)');
    
    console.log('Adding index on Post(groupId)...');
    await client.query('CREATE INDEX IF NOT EXISTS "Post_groupId_idx" ON "public"."Post" ("groupId")');
    
    console.log('Adding index on Post(userId)...');
    await client.query('CREATE INDEX IF NOT EXISTS "Post_userId_idx" ON "public"."Post" ("userId")');

    console.log('Indexes added successfully');
  } catch (err) {
    console.error('Error adding indexes:', err);
  } finally {
    await client.end();
  }
}

addIndexes();
