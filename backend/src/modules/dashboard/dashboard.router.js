import { Router } from 'express';
import { dashboardService } from './dashboard.service.js';

export const dashboardRouter = Router();

/**
 * GET /dashboard/kpis
 * Returns aggregated authority command dashboard KPIs, breakdowns, and freshness metadata.
 */
dashboardRouter.get('/kpis', async (req, res) => {
  try {
    const { department, jurisdictionId, timeRange } = req.query;

    const result = await dashboardService.getCommandKpis({
      department: typeof department === 'string' ? department : undefined,
      jurisdictionId: typeof jurisdictionId === 'string' ? jurisdictionId : undefined,
      timeRange: typeof timeRange === 'string' ? timeRange : '30d',
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve command dashboard metrics.',
    });
  }
});
