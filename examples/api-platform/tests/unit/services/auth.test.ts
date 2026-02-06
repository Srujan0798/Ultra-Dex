import { ApiKeyService } from '../../src/services/auth';

describe('ApiKeyService', () => {
  let service: ApiKeyService;

  beforeEach(() => {
    service = new ApiKeyService();
  });

  describe('createKey', () => {
    it('should create a new API key', async () => {
      const result = await service.createKey('user-123', { name: 'Test Key' });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('secret');
      expect(result.name).toBe('Test Key');
      expect(result.tier).toBe('free');
      expect(result.status).toBe('active');
    });

    it('should create API key with custom tier', async () => {
      const result = await service.createKey('user-123', {
        name: 'Pro Key',
        tier: 'pro',
      });

      expect(result.tier).toBe('pro');
    });
  });

  describe('validateKey', () => {
    it('should validate a valid API key', async () => {
      const created = await service.createKey('user-123', { name: 'Test Key' });
      const validated = await service.validateKey(created.secret);

      expect(validated).not.toBeNull();
      expect(validated?.id).toBe(created.id);
    });

    it('should return null for invalid key', async () => {
      const result = await service.validateKey('invalid-key');
      expect(result).toBeNull();
    });
  });

  describe('revokeKey', () => {
    it('should revoke an API key', async () => {
      const created = await service.createKey('user-123', { name: 'Test Key' });
      const result = await service.revokeKey(created.id, 'user-123');

      expect(result).toBe(true);

      const validated = await service.validateKey(created.secret);
      expect(validated).toBeNull();
    });
  });
});
