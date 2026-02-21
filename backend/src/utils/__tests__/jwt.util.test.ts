import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Store original env
const originalEnv = process.env;

describe('JWT Utility', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32-characters';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateJwtSecrets', () => {
    it('should pass validation when secrets are set correctly', async () => {
      const { validateJwtSecrets } = await import('../jwt.util.js');
      expect(() => validateJwtSecrets()).not.toThrow();
    });

    it('should throw in production when JWT_SECRET is missing', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      
      const { validateJwtSecrets } = await import('../jwt.util.js');
      expect(() => validateJwtSecrets()).toThrow('FATAL: JWT_SECRET is required in production');
    });

    it('should throw in production when JWT_REFRESH_SECRET is missing', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_REFRESH_SECRET;
      
      const { validateJwtSecrets } = await import('../jwt.util.js');
      expect(() => validateJwtSecrets()).toThrow('FATAL: JWT_REFRESH_SECRET is required in production');
    });

    it('should throw in production when secrets are too short', async () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'short';
      
      const { validateJwtSecrets } = await import('../jwt.util.js');
      expect(() => validateJwtSecrets()).toThrow('must be at least 32 characters');
    });

    it('should throw in production when secrets are identical', async () => {
      process.env.NODE_ENV = 'production';
      const sameSecret = 'same-secret-that-is-32-characters-long-for-test';
      process.env.JWT_SECRET = sameSecret;
      process.env.JWT_REFRESH_SECRET = sameSecret;
      
      const { validateJwtSecrets } = await import('../jwt.util.js');
      expect(() => validateJwtSecrets()).toThrow('must be different');
    });

    it('should warn in development when secrets are missing', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.JWT_SECRET;
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { validateJwtSecrets } = await import('../jwt.util.js');
      
      validateJwtSecrets();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('WARNING'));
      consoleSpy.mockRestore();
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', async () => {
      const { generateAccessToken } = await import('../jwt.util.js');
      
      const payload = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER' as const,
        plan: 'NONE' as const,
        planExpiresAt: null,
      };

      const token = generateAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should throw when JWT_SECRET is not set', async () => {
      delete process.env.JWT_SECRET;
      
      const { generateAccessToken } = await import('../jwt.util.js');
      
      const payload = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER' as const,
        plan: 'NONE' as const,
        planExpiresAt: null,
      };

      expect(() => generateAccessToken(payload)).toThrow('JWT_SECRET environment variable is required');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const { generateAccessToken, verifyToken } = await import('../jwt.util.js');
      
      const payload = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER' as const,
        plan: 'URGENCE_24H' as const,
        planExpiresAt: new Date(),
      };

      const token = generateAccessToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.plan).toBe(payload.plan);
    });

    it('should throw on invalid token', async () => {
      const { verifyToken } = await import('../jwt.util.js');
      
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw on tampered token', async () => {
      const { generateAccessToken, verifyToken } = await import('../jwt.util.js');
      
      const payload = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER' as const,
        plan: 'NONE' as const,
        planExpiresAt: null,
      };

      const token = generateAccessToken(payload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      expect(() => verifyToken(tamperedToken)).toThrow();
    });
  });

  describe('generateRefreshTokenValue', () => {
    it('should generate a random hex string', async () => {
      const { generateRefreshTokenValue } = await import('../jwt.util.js');
      
      const token1 = generateRefreshTokenValue();
      const token2 = generateRefreshTokenValue();

      expect(token1).toBeDefined();
      expect(typeof token1).toBe('string');
      expect(token1.length).toBe(80); // 40 bytes = 80 hex chars
      expect(token1).not.toBe(token2); // Should be unique
    });
  });

  describe('hashToken', () => {
    it('should hash a token consistently', async () => {
      const { hashToken } = await import('../jwt.util.js');
      
      const token = 'test-token';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(token);
      expect(hash1.length).toBe(64); // SHA-256 = 64 hex chars
    });

    it('should produce different hashes for different tokens', async () => {
      const { hashToken } = await import('../jwt.util.js');
      
      const hash1 = hashToken('token1');
      const hash2 = hashToken('token2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', async () => {
      const { generateAccessToken, decodeToken } = await import('../jwt.util.js');
      
      const payload = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER' as const,
        plan: 'NONE' as const,
        planExpiresAt: null,
      };

      const token = generateAccessToken(payload);
      const decoded = decodeToken(token);

      expect(decoded?.id).toBe(payload.id);
      expect(decoded?.email).toBe(payload.email);
    });

    it('should return null for invalid token', async () => {
      const { decodeToken } = await import('../jwt.util.js');
      
      const decoded = decodeToken('not-a-jwt');
      expect(decoded).toBeNull();
    });
  });
});
