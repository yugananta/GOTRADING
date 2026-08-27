import { UserRepository } from './src/repositories/AuthRepositories.ts';
import { supabase } from './src/lib/supabaseClient.ts';
import bcrypt from 'bcryptjs';

async function seed() {
  const userRepo = new UserRepository();
  const hashedPassword = await bcrypt.hash('Admin123!@#', 12);
  
  const exists = await supabase.from('User').select('*').eq('email', 'admin@gotrading.id').single();
  
  if (exists.data) {
    console.log("Updating existing admin");
    await supabase.from('User').update({ role: 'admin', username: 'gotrading_official', password: hashedPassword }).eq('email', 'admin@gotrading.id');
    return;
  }
  
  const user = {
    id: 'tarapti_official_admin',
    email: 'admin@gotrading.id',
    password: hashedPassword,
    username: 'gotrading_official',
    firstName: 'GoTrading',
    lastName: 'Official',
    role: 'admin' as const,
    country: 'Indonesia',
    province: 'DKI Jakarta',
    city: 'Jakarta Selatan',
    avatar: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=150&q=80',
    headline: 'GoTrading Official Admin',
    bio: 'Official Admin Account',
    reputationPoints: 99999,
    tradingAsset: 'Forex',
    tradingExperience: 'Pro Trader',
    isVerified: true,
    followersCount: 0,
    followingCount: 0
  };
  
  try {
    await userRepo.create(user as any);
    console.log("Admin created via Repo");
  } catch (err) {
    console.error(err);
  }
}

seed().then(() => process.exit(0)).catch(console.error);
