/**
 * @fileoverview UserController module
 * @module controllers/userController
 */

const logger = require('../utils/logger');

const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 3600;

class UserController {
  constructor(pool, redis) {
    this.pool = pool;
    this.redis = redis;
  }

  async getCacheKey(userId) {
    return `user:${userId}`;
  }

  async getUserFromCache(userId) {
    try {
      const cached = await this.redis.get(this.getCacheKey(userId));
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache read error:', error.message);
    }
    return null;
  }

  async setUserCache(userId, userData) {
    try {
      await this.redis.setex(this.getCacheKey(userId), CACHE_TTL, JSON.stringify(userData));
    } catch (error) {
      logger.warn('Cache write error:', error.message);
    }
  }

  async invalidateUserCache(userId) {
    try {
      await this.redis.del(this.getCacheKey(userId));
    } catch (error) {
      logger.warn('Cache delete error:', error.message);
    }
  }

  async listUsers(req, res) {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    try {
      let query = 'SELECT * FROM user_profiles';
      let params = [];
      let countQuery = 'SELECT COUNT(*) FROM user_profiles';

      if (search) {
        query += ' WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1';
        countQuery += ' WHERE first_name ILIKE $1 OR last_name ILIKE $1';
        params = [`%${search}%`];
      }

      query +=
        ' ORDER BY created_at DESC LIMIT $' +
        (params.length + 1) +
        ' OFFSET $' +
        (params.length + 2);
      params.push(parseInt(limit), parseInt(offset));

      const [usersResult, countResult] = await Promise.all([
        this.pool.query(query, params),
        this.pool.query(countQuery, search ? [`%${search}%`] : []),
      ]);

      const total = parseInt(countResult.rows[0].count);

      res.json({
        users: usersResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('List users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUser(req, res) {
    const { id } = req.params;

    try {
      // Try cache first
      const cached = await this.getUserFromCache(id);
      if (cached) {
        return res.json({ user: cached });
      }

      const result = await this.pool.query('SELECT * FROM user_profiles WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      // Cache the user
      await this.setUserCache(id, user);

      res.json({ user });
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserByUserId(req, res) {
    const { userId } = req.params;

    try {
      // Try cache first
      const cached = await this.getUserFromCache(userId);
      if (cached) {
        return res.json({ user: cached });
      }

      const result = await this.pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [
        userId,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      // Cache the user
      await this.setUserCache(userId, user);

      res.json({ user });
    } catch (error) {
      logger.error('Get user by userId error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createUser(req, res) {
    const { userId, firstName, lastName, phone, address, preferences = {} } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      // Check if profile already exists
      const existing = await this.pool.query('SELECT id FROM user_profiles WHERE user_id = $1', [
        userId,
      ]);

      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'User profile already exists' });
      }

      const result = await this.pool.query(
        `INSERT INTO user_profiles (user_id, first_name, last_name, phone, address, preferences) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [userId, firstName, lastName, phone, JSON.stringify(address), JSON.stringify(preferences)]
      );

      // Create default settings
      await this.pool.query('INSERT INTO user_settings (user_id) VALUES ($1)', [userId]);

      const user = result.rows[0];

      // Cache the new user
      await this.setUserCache(userId, user);

      logger.info({ message: 'User profile created', userId });

      res.status(201).json({ user });
    } catch (error) {
      logger.error('Create user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUser(req, res) {
    const { id } = req.params;
    const { firstName, lastName, phone, address, preferences } = req.body;

    try {
      // Check if user exists
      const existing = await this.pool.query('SELECT user_id FROM user_profiles WHERE id = $1', [
        id,
      ]);

      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userId = existing.rows[0].user_id;

      const result = await this.pool.query(
        `UPDATE user_profiles 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             phone = COALESCE($3, phone),
             address = COALESCE($4, address),
             preferences = COALESCE($5, preferences),
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [
          firstName,
          lastName,
          phone,
          address ? JSON.stringify(address) : null,
          preferences ? JSON.stringify(preferences) : null,
          id,
        ]
      );

      const user = result.rows[0];

      // Invalidate and update cache
      await this.invalidateUserCache(userId);
      await this.setUserCache(userId, user);

      logger.info({ message: 'User profile updated', userId });

      res.json({ user });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteUser(req, res) {
    const { id } = req.params;

    try {
      const result = await this.pool.query(
        'DELETE FROM user_profiles WHERE id = $1 RETURNING user_id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userId = result.rows[0].user_id;

      // Invalidate cache
      await this.invalidateUserCache(userId);

      logger.info({ message: 'User profile deleted', userId });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSettings(req, res) {
    const { userId } = req.params;

    try {
      const result = await this.pool.query('SELECT * FROM user_settings WHERE user_id = $1', [
        userId,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Settings not found' });
      }

      res.json({ settings: result.rows[0] });
    } catch (error) {
      logger.error('Get settings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateSettings(req, res) {
    const { userId } = req.params;
    const { emailNotifications, pushNotifications, smsNotifications, theme, language } = req.body;

    try {
      const result = await this.pool.query(
        `UPDATE user_settings 
         SET email_notifications = COALESCE($1, email_notifications),
             push_notifications = COALESCE($2, push_notifications),
             sms_notifications = COALESCE($3, sms_notifications),
             theme = COALESCE($4, theme),
             language = COALESCE($5, language),
             updated_at = NOW()
         WHERE user_id = $6
         RETURNING *`,
        [emailNotifications, pushNotifications, smsNotifications, theme, language, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Settings not found' });
      }

      logger.info({ message: 'User settings updated', userId });

      res.json({ settings: result.rows[0] });
    } catch (error) {
      logger.error('Update settings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = UserController;
