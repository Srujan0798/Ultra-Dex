/**
 * @fileoverview Analytics module
 * @module routes/analytics
 */

import { Router } from 'express';
import { AnalyticsService } from '../services/analytics';
import { ValidationError } from '../middleware/error-handler';

const router = Router();
const analyticsService = new AnalyticsService();

// Get usage analytics
router.get('/usage', async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      throw new ValidationError('start_date and end_date are required');
    }

    const analytics = await analyticsService.getUsageAnalytics({
      userId: req.apiKey.userId,
      startDate: new Date(start_date as string),
      endDate: new Date(end_date as string),
    });

    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

export { router as analyticsRouter };
