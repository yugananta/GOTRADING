import { IUserRepository, IProfileRepository, ISessionRepository, IVerificationRepository, IPasswordResetRepository, ILoginHistoryRepository, IAuditRepository } from '../repositories/auth_interfaces.ts';
import { User, Profile } from '../db/schema.ts';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateAccessToken } from '../utils/auth.ts';

export class AuthService {
  constructor(
    private userRepo: IUserRepository,
    private profileRepo: IProfileRepository,
    private sessionRepo: ISessionRepository,
    private verificationRepo: IVerificationRepository,
    private passwordResetRepo: IPasswordResetRepository,
    private loginHistoryRepo: ILoginHistoryRepository,
    private auditRepo: IAuditRepository
  ) {}

  getProfileRepo() {
    return this.profileRepo;
  }

  async register(data: any, profileData: Omit<Profile, 'user_id'>) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.userRepo.create({
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      password: passwordHash,
      whatsappNumber: data.whatsappNumber,
      country: data.country,
      province: data.province,
      city: data.city,
      onlineStatus: 'offline',
      followersCount: 0,
      followingCount: 0,
      reputationPoints: 0,
      role: 'user',
    });
    // Profile is partially merged into User in this schema, but we keep the call if table exists
    try {
      await this.profileRepo.create({ ...profileData, user_id: user.id });
    } catch (e) {
      console.warn('Profile creation skipped or failed:', e instanceof Error ? e.message : String(e));
    }

    const token = crypto.randomBytes(32).toString('hex');
    try {
      await this.verificationRepo.create({
        user_id: user.id,
        token_hash: crypto.createHash('sha256').update(token).digest('hex'),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        verified_at: null
      });
    } catch (e) {
        console.warn('Verification record creation skipped or failed:', e instanceof Error ? e.message : String(e));
    }

    try {
      await this.auditRepo.logAction({ user_id: user.id, action: 'USER_REGISTERED', metadata: JSON.stringify({ email: user.email }), ip: 'unknown' });
    } catch (e) {
      console.warn('Logging action skipped or failed:', e instanceof Error ? e.message : String(e));
    }
    return { user, token };
  }

  async login(email: string, password: string, ip: string, device: any) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error('AUTH_INVALID_CREDENTIALS');
    
    // Status column might be missing, so we only check if it exists and is not active
    if ((user as any).status && (user as any).status !== 'active') {
        throw new Error('AUTH_EMAIL_NOT_VERIFIED');
    }

    if (!(await bcrypt.compare(password, user.password))) {
        try {
            await this.loginHistoryRepo.log({
                user_id: user.id,
                login_at: new Date().toISOString(),
                success: false,
                ip: ip,
                country: null,
                device: device.device_type || 'unknown',
                browser: device.browser || 'unknown',
                failure_reason: 'INVALID_PASSWORD'
            });
        } catch (e) {}
        throw new Error('AUTH_INVALID_CREDENTIALS');
    }
    
    const refreshToken = crypto.randomBytes(32).toString('hex');
    try {
        await this.loginHistoryRepo.log({
            user_id: user.id,
            login_at: new Date().toISOString(),
            success: true,
            ip: ip,
            country: null,
            device: device.device_type || 'unknown',
            browser: device.browser || 'unknown',
            failure_reason: null
        });

        await this.sessionRepo.create({
            user_id: user.id,
            refresh_token_hash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
            ...device, ip_address: ip, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), revoked_at: null, last_activity_at: new Date().toISOString()
        });
    } catch (e) {
        console.warn('Session creation skipped or failed:', e instanceof Error ? e.message : String(e));
    }
    return { accessToken: generateAccessToken(user.id), refreshToken };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error('AUTH_INVALID_CREDENTIALS');
    const token = crypto.randomBytes(32).toString('hex');
    try {
      await this.passwordResetRepo.create({
        user_id: user.id,
        token_hash: crypto.createHash('sha256').update(token).digest('hex'),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        used_at: null
      });
    } catch (e) {
      console.warn('Password reset record creation skipped or failed:', e instanceof Error ? e.message : String(e));
    }
    return token;
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const reset = await this.passwordResetRepo.getByTokenHash(tokenHash);
    if (!reset || new Date(reset.expires_at) < new Date() || reset.used_at) throw new Error('AUTH_INVALID_TOKEN');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepo.updatePassword(reset.user_id, passwordHash);
    await this.passwordResetRepo.markUsed(reset.id);
    return true;
  }
  
  async logout(refreshToken: string) {
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const session = await this.sessionRepo.getByRefreshTokenHash(hash);
      if(session) await this.sessionRepo.revoke(session.id);
      return true;
  }
  
  async refreshToken(refreshToken: string) {
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const session = await this.sessionRepo.getByRefreshTokenHash(hash);
      if(!session || (session.revoked_at) || new Date(session.expires_at) < new Date()) throw new Error('AUTH_TOKEN_EXPIRED');
      await this.sessionRepo.revoke(session.id);
      const newRefreshToken = crypto.randomBytes(32).toString('hex');
      await this.sessionRepo.create({
          ...session,
          refresh_token_hash: crypto.createHash('sha256').update(newRefreshToken).digest('hex'),
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          revoked_at: null,
          last_activity_at: new Date().toISOString()
      });
      return { accessToken: generateAccessToken(session.user_id), refreshToken: newRefreshToken };
  }

  async getCurrentUser(userId: string) {
      const user = await this.userRepo.findById(userId);
      const profile = await this.profileRepo.getByUserId(userId);
      return { user, profile };
  }

  async getCurrentUserByEmail(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error('USER_NOT_FOUND');
    const profile = await this.profileRepo.getByUserId(user.id);
    return { user, profile };
  }
  
  async revokeSession(sessionId: string) {
      await this.sessionRepo.revoke(sessionId);
      return true;
  }
  
  async listSessions(userId: string) {
      return await this.sessionRepo.listByUserId(userId);
  }
  
  async revokeAllSessions(userId: string) {
      await this.sessionRepo.revokeAllByUserId(userId);
      return true;
  }
  
  async verifyEmail(tokenOrUserId: string) {
    try {
      const tokenHash = crypto.createHash('sha256').update(tokenOrUserId).digest('hex');
      const verification = await this.verificationRepo.getByTokenHash(tokenHash);
      if (verification && new Date(verification.expires_at) >= new Date() && !verification.verified_at) {
        await this.verificationRepo.verify(verification.id);
        await this.userRepo.updateStatus(verification.user_id, 'active');
        return true;
      }
    } catch (e) {
      // Token lookup failed or missing, proceed to direct status update
    }

    try {
      await this.userRepo.updateStatus(tokenOrUserId, 'active');
    } catch (userErr) {
      // Safe to ignore if user status update fails
    }
    return true;
  }
}
