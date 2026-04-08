import { User, UserCredentials, UserSession, createNewUser } from './user-model.js';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { logUserSignup, logUserLogin, logError } from '../monitoring/better-stack-logger.js';

// In-memory user store for API keys and usage (Clerk handles auth)
const users = new Map<string, User>();
const sessions = new Map<string, UserSession>();

export class AuthService {
  async register(email: string, password: string, name: string): Promise<{ user: User; session: UserSession }> {
    try {
      // Create user in Clerk
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || undefined,
      });

      // Create local user record
      const user = createNewUser(email, name);
      user.id = clerkUser.id; // Use Clerk's ID
      users.set(user.id, user);

      // Create Clerk session
      const clerkSession = await clerkClient.sessions.createSession({
        userId: clerkUser.id,
      });

      const session: UserSession = {
        userId: user.id,
        token: clerkSession.id,
        expiresAt: new Date(clerkSession.expireAt),
        createdAt: new Date(clerkSession.createdAt)
      };
      sessions.set(session.token, session);

      // Log signup event
      logUserSignup(user.id, email, { name });

      return { user, session };
    } catch (error) {
      logError('User registration failed', error as Error, { email });
      throw new Error('User registration failed: ' + (error as Error).message);
    }
  }
  
  async login(email: string, password: string): Promise<{ user: User; session: UserSession }> {
    try {
      // Get user from Clerk by email
      const clerkUsers = await clerkClient.users.getUserList({ emailAddress: [email] });
      const clerkUser = clerkUsers.data[0];
      
      if (!clerkUser) {
        throw new Error('Invalid credentials');
      }

      // Create Clerk session
      const clerkSession = await clerkClient.sessions.createSession({
        userId: clerkUser.id,
      });

      // Get or create local user record
      let user = users.get(clerkUser.id);
      if (!user) {
        user = createNewUser(
          clerkUser.emailAddresses[0]?.emailAddress || email,
          `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User'
        );
        user.id = clerkUser.id;
        users.set(user.id, user);
      }

      const session: UserSession = {
        userId: user.id,
        token: clerkSession.id,
        expiresAt: new Date(clerkSession.expireAt),
        createdAt: new Date(clerkSession.createdAt)
      };
      sessions.set(session.token, session);

      // Log login event
      logUserLogin(user.id, email);

      return { user, session };
    } catch (error) {
      logError('User login failed', error as Error, { email });
      throw new Error('Invalid credentials');
    }
  }
  
  async validateSession(token: string): Promise<User | null> {
    try {
      // Validate session with Clerk
      const clerkSession = await clerkClient.sessions.getSession(token);
      
      if (!clerkSession || clerkSession.status !== 'active') {
        return null;
      }

      // Get local user record
      const user = users.get(clerkSession.userId);
      return user || null;
    } catch (error) {
      return null;
    }
  }
  
  async logout(token: string): Promise<void> {
    try {
      // Revoke Clerk session
      await clerkClient.sessions.revokeSession(token);
      sessions.delete(token);
    } catch (error) {
      logError('Logout failed', error as Error, { token });
    }
  }
  
  async getUserByApiKey(apiKey: string): Promise<User | null> {
    return Array.from(users.values()).find(u => u.apiKey === apiKey) || null;
  }
  
  async updateUsage(userId: string, requests: number, tokens: number): Promise<void> {
    const user = users.get(userId);
    if (user) {
      user.usage.requestsThisMonth += requests;
      user.usage.tokensThisMonth += tokens;
      user.usage.lastRequestAt = new Date();
      user.updatedAt = new Date();
    }
  }
}

export const authService = new AuthService();
