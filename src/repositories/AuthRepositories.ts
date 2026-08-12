import { IUserRepository, IProfileRepository, ISessionRepository, IVerificationRepository, IPasswordResetRepository, ILoginHistoryRepository, IAuditRepository } from './auth_interfaces.ts';
import { User, Profile, Session, EmailVerification, PasswordReset, LoginHistory, AuditLog } from '../db/schema.ts';
import { supabase } from '../lib/supabaseClient.ts';
import crypto from 'crypto';

export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      return data as User;
    } catch (e: any) {
      console.error('Supabase findByEmail failed:', e?.message || e);
      return null;
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      return data as User;
    } catch (e: any) {
      console.error('Supabase findById failed:', e?.message || e);
      return null;
    }
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<User> {
    const userId = user.id || crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    
    // Explicitly map fields to match the database schema (camelCase)
    const dbPayload = {
      id: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      password: user.password || '$2b$10$fallbackDummyPasswordHashValue',
      whatsappNumber: user.whatsappNumber || null,
      country: user.country || '',
      province: user.province || '',
      city: user.city || '',
      avatar: user.avatar || 'https://i.pravatar.cc/150?u=default',
      coverPhoto: user.coverPhoto || null,
      headline: user.headline || null,
      bio: user.bio || null,
      tradingExperience: user.tradingExperience || 'Beginner',
      tradingAsset: user.tradingAsset || 'Forex',
      onlineStatus: user.onlineStatus || 'offline',
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      reputationPoints: user.reputationPoints || 0,
      role: user.role || 'user',
      createdAt,
      updatedAt
    };

    try {
      const { data, error } = await supabase
        .from('User')
        .insert([dbPayload])
        .select()
        .single();
      
      if (error) throw error;
      return data as User;
    } catch (e: any) {
      console.error('Supabase user creation failed:', e?.message || e);
      throw e;
    }
  }

  async updateStatus(id: string, status: any): Promise<void> {
    try {
      const payload: any = { updatedAt: new Date().toISOString() };
      if (status === 'online' || status === 'offline') {
        payload.onlineStatus = status;
      }
      const { error } = await supabase
        .from('User')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      console.error('Failed to update status in Supabase:', e?.message || e);
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('User')
        .update({ updatedAt: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      console.error('Failed to update last login in Supabase:', e?.message || e);
    }
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('User')
        .update({ password: passwordHash, updatedAt: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      console.error('Failed to update password in Supabase:', e?.message || e);
    }
  }

  async list(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*');
      
      if (error) throw error;
      return (data || []) as User[];
    } catch (e: any) {
      console.error('Supabase list users failed:', e?.message || e);
      return [];
    }
  }

  async update(id: string, updates: Partial<User>): Promise<void> {
    try {
      // Map common update fields explicitly if needed, or filter for schema valid fields
      const dbUpdates: any = {};
      const validFields = [
        'firstName', 'lastName', 'username', 'email', 'password', 'whatsappNumber',
        'country', 'province', 'city', 'avatar', 'coverPhoto', 'headline', 'bio',
        'tradingExperience', 'tradingAsset', 'onlineStatus', 'followersCount',
        'followingCount', 'reputationPoints', 'role', 'isVerified',
        'mt5Connected', 'latitude', 'longitude'
      ];

      for (const field of validFields) {
        if (field in updates) {
          dbUpdates[field] = (updates as any)[field];
        }
      }

      dbUpdates.updatedAt = new Date().toISOString();

      const { error } = await supabase
        .from('User')
        .update(dbUpdates)
        .eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      console.error('Failed to update user in Supabase:', e?.message || e);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('User')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      console.error('Failed to delete user in Supabase:', e?.message || e);
    }
  }
}

export class ProfileRepository implements IProfileRepository {
  async create(profile: Profile): Promise<void> {
    try {
      // Profiles are now merged into User table
      const { user_id, ...updates } = profile as any;
      await supabase
        .from('User')
        .update(updates)
        .eq('id', user_id);
    } catch (e: any) {
      console.error('Failed to update profile in User table in Supabase:', e?.message || e);
    }
  }

  async getByUserId(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && data) {
        return data as Profile;
      }
    } catch (e: any) {
      console.warn('Supabase get user as profile failed:', e?.message || e);
    }

    return null;
  }

  async update(userId: string, updates: Partial<Profile>): Promise<void> {
    try {
      await supabase
        .from('User')
        .update(updates)
        .eq('id', userId);
    } catch (e: any) {
      console.error('Failed to update user profile in Supabase:', e?.message || e);
    }
  }
}

export class SessionRepository implements ISessionRepository {
  async create(session: Omit<Session, 'id'>): Promise<Session> {
    const id = crypto.randomUUID();
    const record = { id, ...session } as Session;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert(record)
        .select()
        .single();
      
      if (!error && data) {
        return data as Session;
      }
    } catch (e: any) {
      console.error('Failed to create session in Supabase:', e?.message || e);
    }
    return record;
  }

  async getByRefreshTokenHash(hash: string): Promise<Session | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('refresh_token_hash', hash)
        .maybeSingle();
      
      if (!error && data) {
        return data as Session;
      }
    } catch (e: any) {
      console.error('Failed to get session by hash from Supabase:', e?.message || e);
    }
    return null;
  }

  async revoke(id: string): Promise<void> {
    try {
      await supabase
        .from('sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', id);
    } catch (e: any) {
      console.error('Failed to revoke session in Supabase:', e?.message || e);
    }
  }

  async listByUserId(userId: string): Promise<Session[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .is('revoked_at', null);
      
      if (!error && data) {
        return data as Session[];
      }
    } catch (e: any) {
      console.error('Failed to list sessions by user in Supabase:', e?.message || e);
    }
    return [];
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    try {
      await supabase
        .from('sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('revoked_at', null);
    } catch (e: any) {
      console.error('Failed to revoke all sessions in Supabase:', e?.message || e);
    }
  }
}

export class VerificationRepository implements IVerificationRepository {
  async create(data: Omit<EmailVerification, 'id'>): Promise<EmailVerification> {
    const id = crypto.randomUUID();
    const record = { id, ...data };

    try {
      const { data: result, error } = await supabase
        .from('email_verifications')
        .insert(record)
        .select()
        .single();
      
      if (!error && result) {
        return result as EmailVerification;
      }
    } catch (e: any) {
      console.error('Failed to create email verification in Supabase:', e?.message || e);
    }
    return record;
  }

  async getByTokenHash(tokenHash: string): Promise<EmailVerification | null> {
    try {
      const { data, error } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('token_hash', tokenHash)
        .maybeSingle();
      
      if (!error && data) {
        return data as EmailVerification;
      }
    } catch (e: any) {
      console.error('Failed to get verification by token hash from Supabase:', e?.message || e);
    }
    return null;
  }

  async verify(id: string): Promise<void> {
    try {
      await supabase
        .from('email_verifications')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', id);
    } catch (e: any) {
      console.error('Failed to verify email in Supabase:', e?.message || e);
    }
  }
}

export class PasswordResetRepository implements IPasswordResetRepository {
  async create(data: Omit<PasswordReset, 'id'>): Promise<PasswordReset> {
    const id = crypto.randomUUID();
    const record = { id, ...data };

    try {
      const { data: result, error } = await supabase
        .from('password_resets')
        .insert(record)
        .select()
        .single();
      
      if (!error && result) {
        return result as PasswordReset;
      }
    } catch (e: any) {
      console.error('Failed to create password reset in Supabase:', e?.message || e);
    }
    return record;
  }

  async getByTokenHash(tokenHash: string): Promise<PasswordReset | null> {
    try {
      const { data, error } = await supabase
        .from('password_resets')
        .select('*')
        .eq('token_hash', tokenHash)
        .maybeSingle();
      
      if (!error && data) {
        return data as PasswordReset;
      }
    } catch (e: any) {
      console.error('Failed to get password reset by token hash from Supabase:', e?.message || e);
    }
    return null;
  }

  async markUsed(id: string): Promise<void> {
    try {
      await supabase
        .from('password_resets')
        .update({ used_at: new Date().toISOString() })
        .eq('id', id);
    } catch (e: any) {
      console.error('Failed to mark password reset as used in Supabase:', e?.message || e);
    }
  }
}

export class LoginHistoryRepository implements ILoginHistoryRepository {
  async log(history: Omit<LoginHistory, 'id'>): Promise<void> {
    const id = crypto.randomUUID();
    const record = { id, ...history };

    try {
      await supabase
        .from('login_history')
        .insert(record);
    } catch (e: any) {
      console.error('Failed to log login history in Supabase:', e?.message || e);
    }
  }
}

export class AuditRepository implements IAuditRepository {
  async logAction(data: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    const id = crypto.randomUUID();
    const record = { id, ...data, created_at: new Date().toISOString() };

    try {
      await supabase
        .from('audit_logs')
        .insert(record);
    } catch (e: any) {
      console.error('Failed to log audit action in Supabase:', e?.message || e);
    }
  }
}
