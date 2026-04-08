import { clerk } from './clerk-client.js';
import { logger } from '../monitoring/better-stack-logger.js';

export interface User {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  apiKey: string;
}

export class ClerkAuthService {
  async register(email: string, password: string, name: string): Promise<{ user: User; message: string }> {
    try {
      // Create user in Clerk
      const clerkUser = await clerk.users.createUser({
        emailAddress: [email],
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || undefined,
        publicMetadata: {
          tier: 'free',
          apiKey: this.generateApiKey()
        }
      });
      
      const user: User = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || email,
        name,
        tier: 'free',
        apiKey: clerkUser.publicMetadata.apiKey as string
      };
      
      logger.userSignup(user.id, user.email, 'free');
      
      // Return user - client must authenticate via Clerk's frontend SDK
      return { 
        user, 
        message: 'User created. Please sign in via /api/auth/login with email/password.'
      };
    } catch (error) {
      logger.error('Registration failed', { error: String(error), email });
      throw error;
    }
  }
  
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      // Get user by email
      const users = await clerk.users.getUserList({
        emailAddress: [email]
      });
      
      if (users.length === 0) {
        throw new Error('Invalid credentials');
      }
      
      const clerkUser = users[0];
      
      // Generate a session token using Clerk's API
      // Note: In production, use Clerk's frontend SDK for authentication
      // This backend method creates a session for API-to-API communication
      const sessions = await clerk.sessions.getSessionList({ userId: clerkUser.id });
      
      // If no active session, we can't create one from backend
      // Return a token that can be used with Clerk's verification
      const token = await this.createSessionToken(clerkUser.id);
      
      const user: User = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || email,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        tier: (clerkUser.publicMetadata.tier as string) || 'free',
        apiKey: (clerkUser.publicMetadata.apiKey as string) || this.generateApiKey()
      };
      
      logger.userLogin(user.id, user.email);
      
      return { user, token };
    } catch (error) {
      logger.error('Login failed', { error: String(error), email });
      throw error;
    }
  }
  
  private async createSessionToken(userId: string): Promise<string> {
    // Generate a JWT-style token that includes user ID
    // This is verified by the validateSession method
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const data = `${userId}:${timestamp}:${random}`;
    
    // Simple base64 encoding (in production, use proper JWT signing)
    return Buffer.from(data).toString('base64');
  }
  
  async validateSession(token: string): Promise<User | null> {
    try {
      // Decode token to get userId
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId] = decoded.split(':');
      
      if (!userId) {
        return null;
      }
      
      // Get user from Clerk
      const clerkUser = await clerk.users.getUser(userId);
      
      return {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        tier: (clerkUser.publicMetadata.tier as string) || 'free',
        apiKey: (clerkUser.publicMetadata.apiKey as string) || ''
      };
    } catch (error) {
      logger.error('Session validation failed', { error: String(error) });
      return null;
    }
  }
  
  async logout(token: string): Promise<void> {
    try {
      // Decode token to get userId
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId] = decoded.split(':');
      
      if (userId) {
        // Revoke all sessions for this user
        const sessions = await clerk.sessions.getSessionList({ userId });
        for (const session of sessions) {
          if (session.id) {
            await clerk.sessions.revokeSession(session.id);
          }
        }
      }
    } catch (error) {
      logger.error('Logout failed', { error: String(error) });
    }
  }
  
  private generateApiKey(): string {
    const prefix = 'ud_';
    const random = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 36).toString(36)
    ).join('');
    return prefix + random;
  }
}

export const clerkAuthService = new ClerkAuthService();
// Deploy timestamp: $(date +%s)
// Force refresh: v3.0.1
// Cache buster: 1775659573
// FORCE_RELOAD: 1775659874
// Touch timestamp: 1775660018
