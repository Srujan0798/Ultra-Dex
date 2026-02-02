const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

class AuthController {
  constructor(pool, redis) {
    this.pool = pool;
    this.redis = redis;
  }

  async register(req, res) {
    const { email, password, role = 'user' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      // Check if user exists
      const existingUser = await this.pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create user
      const result = await this.pool.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
        [email, passwordHash, role]
      );

      const user = result.rows[0];

      // Generate tokens
      const tokens = await this.generateTokens(user);

      logger.info({ message: 'User registered', userId: user.id, email: user.email });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.created_at
        },
        tokens
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      // Find user
      const result = await this.pool.query(
        'SELECT id, email, password_hash, role, is_active FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      logger.info({ message: 'User logged in', userId: user.id });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        tokens
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async logout(req, res) {
    const { refreshToken } = req.body;
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];

    try {
      // Blacklist access token
      if (accessToken) {
        const decoded = jwt.decode(accessToken);
        if (decoded && decoded.exp) {
          const ttl = decoded.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) {
            await this.redis.setex(`blacklist:${accessToken}`, ttl, 'true');
          }
        }
      }

      // Delete refresh token
      if (refreshToken) {
        const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
        await this.pool.query(
          'DELETE FROM refresh_tokens WHERE token_hash = $1',
          [tokenHash]
        );
      }

      logger.info({ message: 'User logged out', userId: req.user?.id });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async refresh(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    try {
      // Verify refresh token in database
      const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
      const result = await this.pool.query(
        `SELECT rt.*, u.email, u.role, u.is_active 
         FROM refresh_tokens rt 
         JOIN users u ON rt.user_id = u.id 
         WHERE rt.token_hash = $1 AND rt.expires_at > NOW()`,
        [tokenHash]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const tokenData = result.rows[0];

      if (!tokenData.is_active) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }

      // Delete old refresh token
      await this.pool.query('DELETE FROM refresh_tokens WHERE id = $1', [tokenData.id]);

      // Generate new tokens
      const user = {
        id: tokenData.user_id,
        email: tokenData.email,
        role: tokenData.role
      };

      const tokens = await this.generateTokens(user);

      logger.info({ message: 'Token refreshed', userId: user.id });

      res.json({ tokens });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async validate(req, res) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token is required' });
    }

    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({ error: 'Token has been revoked' });
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      res.json({
        valid: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        }
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', valid: false });
      }
      res.status(401).json({ error: 'Invalid token', valid: false });
    }
  }

  async me(req, res) {
    try {
      const result = await this.pool.query(
        'SELECT id, email, role, is_active, created_at, updated_at FROM users WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user: result.rows[0] });
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    try {
      // Get current password hash
      const result = await this.pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      // Update password
      await this.pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, userId]
      );

      logger.info({ message: 'Password changed', userId });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async generateTokens(user) {
    // Generate access token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Generate refresh token
    const refreshToken = uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);

    // Calculate expiration
    const expiresInDays = parseInt(REFRESH_TOKEN_EXPIRES_IN) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Store refresh token
    await this.pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, expiresAt]
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN
    };
  }
}

module.exports = AuthController;
