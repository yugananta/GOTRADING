export interface Country {
  id: number;
  name: string;
  iso2: string;
  phone_code: string;
  flag_emoji: string;
  is_supported: boolean;
}

export interface Province {
  id: number;
  country_id: number;
  name: string;
}

export interface City {
  id: number;
  province_id: number;
  name: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  whatsappNumber?: string | null;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  avatar?: string | null;
  coverPhoto?: string | null;
  headline?: string | null;
  bio?: string | null;
  tradingExperience?: string | null;
  tradingAsset?: string | null;
  onlineStatus: 'online' | 'offline';
  followersCount: number;
  followingCount: number;
  reputationPoints: number;
  role: 'user' | 'admin' | 'moderator';
  status?: 'unverified' | 'active' | 'suspended'; // Added for compatibility with AuthService
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  whatsapp_number: string;
  country: string;
  province: string | null;
  city: string | null;
  avatar: string | null;
  avatar_url: string | null;
  cover_photo: string | null;
  headline: string | null;
  bio: string | null;
  trading_experience: string | null;
  trading_asset: string | null;
  online_status: 'online' | 'offline';
  followers_count: number;
  following_count: number;
  reputation_points: number;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  locale: string;
  currency: string;
}

export interface Session {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  device_name: string;
  device_type: string;
  browser: string;
  os: string;
  ip_address: string;
  country: string | null;
  city: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  last_activity_at: string;
}

export interface EmailVerification {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  verified_at: string | null;
}

export interface PasswordReset {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
}

export interface LoginHistory {
  id: string;
  user_id: string;
  login_at: string;
  success: boolean;
  ip: string;
  country: string | null;
  device: string;
  browser: string;
  failure_reason: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  metadata: string;
  ip: string;
  created_at: string;
}
