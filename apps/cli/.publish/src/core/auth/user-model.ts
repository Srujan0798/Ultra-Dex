export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  tier: 'free' | 'pro' | 'enterprise';
  apiKey: string;
  usage: {
    requestsThisMonth: number;
    tokensThisMonth: number;
    lastRequestAt?: Date;
  };
  preferences: {
    defaultProvider?: string;
    theme?: 'light' | 'dark';
    notifications: boolean;
  };
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserSession {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export const generateApiKey = (): string => {
  const prefix = 'ud_';
  const random = Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join(
    ''
  );
  return prefix + random;
};

export const createNewUser = (email: string, name: string): User => ({
  id: crypto.randomUUID(),
  email,
  name,
  createdAt: new Date(),
  updatedAt: new Date(),
  tier: 'free',
  apiKey: generateApiKey(),
  usage: {
    requestsThisMonth: 0,
    tokensThisMonth: 0,
  },
  preferences: {
    notifications: true,
    theme: 'dark',
  },
});
