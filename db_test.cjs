const { Client } = require('pg');
const client = new Client({
  host: 'db.lsjqoznizsshpbvvzzam.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'Alvarez1000%40123',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  console.log("Success");
  await client.end();
}
run().catch(console.error);
