import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/auth';
import { AuthenticationError } from './error-handler';

const apiKeyService = new ApiKeyService();

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new AuthenticationError('API key is required');
    }

    const keyData = await apiKeyService.validateKey(apiKey);

    if (!keyData) {
      throw new AuthenticationError('Invalid API key');
    }

    // Attach user/api key info to request
    req.apiKey = keyData;

    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication - doesn't fail if no key provided
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (apiKey) {
      const keyData = await apiKeyService.validateKey(apiKey);
      if (keyData) {
        req.apiKey = keyData;
      }
    }

    next();
  } catch (error) {
    next();
  }
};
