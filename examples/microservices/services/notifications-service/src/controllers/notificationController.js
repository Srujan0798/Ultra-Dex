const logger = require('../utils/logger');

class NotificationController {
  constructor(pool, redis) {
    this.pool = pool;
    this.redis = redis;
  }

  async listNotifications(req, res) {
    const userId = req.headers['x-user-id'] || req.user?.id;
    const { page = 1, limit = 10, type, status, unreadOnly } = req.query;
    const offset = (page - 1) * limit;

    try {
      let query = 'SELECT * FROM notifications WHERE user_id = $1';
      let params = [userId];
      let paramCount = 1;

      if (type) {
        paramCount++;
        query += ` AND type = $${paramCount}`;
        params.push(type);
      }

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
      }

      if (unreadOnly === 'true') {
        query += ' AND read_at IS NULL';
      }

      query += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await this.pool.query(query, params);

      res.json({
        notifications: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      logger.error('List notifications error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getNotification(req, res) {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || req.user?.id;

    try {
      const result = await this.pool.query(
        'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ notification: result.rows[0] });
    } catch (error) {
      logger.error('Get notification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createNotification(req, res) {
    const { userId, type, channel, title, content, metadata = {} } = req.body;

    if (!userId || !type || !title || !content) {
      return res.status(400).json({ error: 'userId, type, title, and content are required' });
    }

    try {
      const result = await this.pool.query(
        `INSERT INTO notifications (user_id, type, channel, title, content, status, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [userId, type, channel || 'system', title, content, 'pending', JSON.stringify(metadata)]
      );

      logger.info({ message: 'Notification created', notificationId: result.rows[0].id });

      res.status(201).json({ notification: result.rows[0] });
    } catch (error) {
      logger.error('Create notification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async markAsRead(req, res) {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || req.user?.id;

    try {
      const result = await this.pool.query(
        'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ notification: result.rows[0] });
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteNotification(req, res) {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || req.user?.id;

    try {
      const result = await this.pool.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      logger.error('Delete notification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPreferences(req, res) {
    const userId = req.headers['x-user-id'] || req.user?.id;

    try {
      const result = await this.pool.query(
        'SELECT * FROM notification_preferences WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        // Create default preferences
        const defaultResult = await this.pool.query(
          'INSERT INTO notification_preferences (user_id) VALUES ($1) RETURNING *',
          [userId]
        );
        return res.json({ preferences: defaultResult.rows[0] });
      }

      res.json({ preferences: result.rows[0] });
    } catch (error) {
      logger.error('Get preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updatePreferences(req, res) {
    const userId = req.headers['x-user-id'] || req.user?.id;
    const { emailEnabled, smsEnabled, pushEnabled, orderUpdates, paymentUpdates, marketingEmails } =
      req.body;

    try {
      const result = await this.pool.query(
        `INSERT INTO notification_preferences 
         (user_id, email_enabled, sms_enabled, push_enabled, order_updates, payment_updates, marketing_emails) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           email_enabled = COALESCE($2, notification_preferences.email_enabled),
           sms_enabled = COALESCE($3, notification_preferences.sms_enabled),
           push_enabled = COALESCE($4, notification_preferences.push_enabled),
           order_updates = COALESCE($5, notification_preferences.order_updates),
           payment_updates = COALESCE($6, notification_preferences.payment_updates),
           marketing_emails = COALESCE($7, notification_preferences.marketing_emails),
           updated_at = NOW()
         RETURNING *`,
        [
          userId,
          emailEnabled,
          smsEnabled,
          pushEnabled,
          orderUpdates,
          paymentUpdates,
          marketingEmails,
        ]
      );

      logger.info({ message: 'Notification preferences updated', userId });

      res.json({ preferences: result.rows[0] });
    } catch (error) {
      logger.error('Update preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUnreadCount(req, res) {
    const userId = req.headers['x-user-id'] || req.user?.id;

    try {
      const result = await this.pool.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
        [userId]
      );

      res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
      logger.error('Get unread count error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = NotificationController;
