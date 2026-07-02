const dashboardController = require('./dashboard.controller');
const authenticate = require('../../middleware/authenticate');

async function dashboardRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/summary', { handler: dashboardController.getSummary });
  fastify.get('/devices', { handler: dashboardController.getDeviceStatusGrid });
  fastify.get('/alerts', { handler: dashboardController.getRecentAlerts });
}

module.exports = dashboardRoutes;
