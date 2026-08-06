import { User, Profile, Session, EmailVerification, PasswordReset, LoginHistory, AuditLog } from '../db/schema.ts';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<User>;
  updateStatus(id: string, status: User['status']): Promise<void>;
  updateLastLogin(id: string): Promise<void>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  list(): Promise<User[]>;
  update(id: string, updates: Partial<User>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IProfileRepository {
    create(profile: Profile): Promise<void>;
    getByUserId(userId: string): Promise<Profile | null>;
    update(userId: string, updates: Partial<Profile>): Promise<void>;
}

export interface ISessionRepository {
    create(session: Omit<Session, 'id'>): Promise<Session>;
    getByRefreshTokenHash(hash: string): Promise<Session | null>;
    revoke(id: string): Promise<void>;
    listByUserId(userId: string): Promise<Session[]>;
    revokeAllByUserId(userId: string): Promise<void>;
}

export interface IVerificationRepository {
    create(data: Omit<EmailVerification, 'id'>): Promise<EmailVerification>;
    getByTokenHash(tokenHash: string): Promise<EmailVerification | null>;
    verify(id: string): Promise<void>;
}

export interface IPasswordResetRepository {
    create(data: Omit<PasswordReset, 'id'>): Promise<PasswordReset>;
    getByTokenHash(tokenHash: string): Promise<PasswordReset | null>;
    markUsed(id: string): Promise<void>;
}

export interface ILoginHistoryRepository {
    log(history: Omit<LoginHistory, 'id'>): Promise<void>;
}

export interface IAuditRepository {
  logAction(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void>;
}
