const alertController = require('./alert.controller');
const authenticate = require('../../middleware/authenticate');

async function alertRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', { handler: alertController.list });
  fastify.put('/:id/acknowledge', { handler: alertController.acknowledge });
  fastify.put('/acknowledge-all', { handler: alertController.acknowledgeAll });
}

module.exports = alertRoutes;
