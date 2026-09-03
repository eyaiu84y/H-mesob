import { getDashboardData } from '../services/dashboardService.js';

/**
 * GET /api/dashboards/me
 * Get dashboard data for current user (role-specific)
 */
export const getMyDashboard = async (req, res) => {
  try {
    const result = await getDashboardData(req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get dashboard controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data.'
    });
  }
};
