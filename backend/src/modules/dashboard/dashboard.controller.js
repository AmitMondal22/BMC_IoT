const dashboardService = require('./dashboard.service');
const response = require('../../utils/response');

class DashboardController {
  async getSummary(req, reply) {
    const summary = await dashboardService.getSummary(req.userId, req.userRole);
    return response.success(reply, summary);
  }

  async getDeviceStatusGrid(req, reply) {
    const devices = await dashboardService.getDeviceStatusGrid(req.userId, req.userRole);
    return response.success(reply, devices);
  }

  async getRecentAlerts(req, reply) {
    const limit = parseInt(req.query.limit, 10) || 20;
    const alerts = await dashboardService.getRecentAlerts(limit, req.userId, req.userRole);
    return response.success(reply, alerts);
  }
}

module.exports = new DashboardController();
