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
  async register(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
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
      
      // Create session
      const session = await clerk.sessions.createSession({
        userId: clerkUser.id
      });
      
      const user: User = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || email,
        name,
        tier: 'free',
        apiKey: clerkUser.publicMetadata.apiKey as string
      };
      
      logger.userSignup(user.id, user.email, 'free');
      
      return { user, token: session.token };
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
      
      // Create session
      const session = await clerk.sessions.createSession({
        userId: clerkUser.id
      });
      
      const user: User = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || email,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        tier: (clerkUser.publicMetadata.tier as string) || 'free',
        apiKey: (clerkUser.publicMetadata.apiKey as string) || this.generateApiKey()
      };
      
      logger.userLogin(user.id, user.email);
      
      return { user, token: session.token };
    } catch (error) {
      logger.error('Login failed', { error: String(error), email });
      throw error;
    }
  }
  
  async validateSession(token: string): Promise<User | null> {
    try {
      const session = await clerk.sessions.verifySession(token);
      
      if (!session || session.status !== 'active') {
        return null;
      }
      
      const clerkUser = await clerk.users.getUser(session.userId);
      
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
      await clerk.sessions.revokeSession(token);
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
