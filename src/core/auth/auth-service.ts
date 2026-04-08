import { User, UserCredentials, UserSession, createNewUser } from './user-model.js';

// In-memory user store (replace with database in production)
const users = new Map<string, User>();
const sessions = new Map<string, UserSession>();

export class AuthService {
  async register(email: string, password: string, name: string): Promise<{ user: User; session: UserSession }> {
    // Check if user exists
    const existing = Array.from(users.values()).find(u => u.email === email);
    if (existing) {
      throw new Error('User already exists');
    }
    
    // Create user
    const user = createNewUser(email, name);
    users.set(user.id, user);
    
    // Create session
    const session: UserSession = {
      userId: user.id,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date()
    };
    sessions.set(session.token, session);
    
    return { user, session };
  }
  
  async login(email: string, password: string): Promise<{ user: User; session: UserSession }> {
    // Find user
    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // In production: verify password hash
    // For now: simple check
    
    // Create session
    const session: UserSession = {
      userId: user.id,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };
    sessions.set(session.token, session);
    
    return { user, session };
  }
  
  async validateSession(token: string): Promise<User | null> {
    const session = sessions.get(token);
    if (!session || session.expiresAt < new Date()) {
      return null;
    }
    return users.get(session.userId) || null;
  }
  
  async logout(token: string): Promise<void> {
    sessions.delete(token);
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
