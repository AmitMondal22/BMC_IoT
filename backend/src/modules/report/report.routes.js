const reportController = require('./report.controller');
const authenticate = require('../../middleware/authenticate');

async function reportRoutes(fastify, options) {
  // All report routes require authentication
  fastify.addHook('preHandler', authenticate);

  fastify.get('/daily-log', { handler: reportController.getDailyLog });
  fastify.get('/cycles', { handler: reportController.getCyclesReport });
  fastify.get('/full-daily', { handler: reportController.getFullDailyReport });
  fastify.post('/email-daily-log', { handler: reportController.emailDailyReport });
}

module.exports = reportRoutes;
