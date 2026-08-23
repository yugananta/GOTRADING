// test_be_api_v2.ts
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { supabase } from './src/lib/supabaseClient.ts';

dotenv.config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '';
const BACKEND_API_URL = "https://be-gotrading-production.up.railway.app";

async function run() {
  console.log("=== BE-GOTRADING MULTI-USER DIAGNOSTIC ===");
  console.log("Testing token verification and MT5 sync state for all 32 users...");

  const { data: users, error: userError } = await supabase
    .from('User')
    .select('id, email, username, mt5Connected');

  if (userError) {
    console.error("[-] Error fetching users from Supabase:", userError);
    return;
  }

  console.log(`Successfully loaded ${users?.length || 0} users from database.`);

  const successfulUsers = [];
  const unauthorizedUsers = [];
  const serverErrorUsers = [];
  const emptyUsers = [];

  for (const user of users || []) {
    const token = jwt.sign({ userId: user.id }, ACCESS_SECRET, { expiresIn: '15m' });
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    try {
      const res = await fetch(`${BACKEND_API_URL}/api/metatrader/account`, { headers });
      const status = res.status;
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {}

      if (status === 200) {
        const accounts = data?.accounts || data?.data?.accounts || (data?.account ? [data.account] : []);
        console.log(`[+] SUCCESS 200 OK: ${user.email} -> Accounts count: ${accounts.length}`);
        for (const acc of accounts) {
          console.log(`    - Login: ${acc.login}, Broker: ${acc.broker}, Balance: ${acc.balance}`);
        }
        successfulUsers.push({ user, accounts });
      } else if (status === 401) {
        unauthorizedUsers.push({ user, text });
      } else if (status === 500) {
        serverErrorUsers.push({ user, errorMsg: text });
      } else {
        emptyUsers.push({ user, status, text });
      }
    } catch (err: any) {
      console.error(`[-] Request failed for ${user.email}:`, err.message);
    }
  }

  console.log("\n=== DIAGNOSTIC REPORT ===");
  console.log(`Total 200 OK Users: ${successfulUsers.length}`);
  console.log(`Total 401 Unauthorized Users: ${unauthorizedUsers.length}`);
  console.log(`Total 500 Server Error Users: ${serverErrorUsers.length}`);
  console.log(`Total Other Response Users: ${emptyUsers.length}`);

  if (successfulUsers.length > 0) {
    console.log("\n[!] SUCCESSFUL PROFILES WITH MT5 SYNC:");
    for (const item of successfulUsers) {
      console.log(`- Email: ${item.user.email} (ID: ${item.user.id}) has ${item.accounts.length} MT5 accounts.`);
    }
  } else {
    console.log("\n[-] CRITICAL: No user in the database successfully authenticated and returned 200 OK MT5 accounts.");
    if (serverErrorUsers.length > 0) {
      console.log(`Sample of 500 errors:`, serverErrorUsers.slice(0, 3).map(x => ({ email: x.user.email, error: x.errorMsg })));
    }
    if (unauthorizedUsers.length > 0) {
      console.log(`Sample of 401 errors:`, unauthorizedUsers.slice(0, 3).map(x => ({ email: x.user.email, error: x.text })));
    }
  }
}

run().then(() => process.exit(0));
