import { Request } from 'express';

export interface ApiKeyData {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  tier: string;
  status: string;
  createdAt: string;
  lastUsedAt: string | null;
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      apiKey: ApiKeyData;
    }
  }
}
