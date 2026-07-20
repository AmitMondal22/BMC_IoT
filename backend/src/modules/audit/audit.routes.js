const auditController = require('./audit.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { ROLES } = require('../../utils/constants');

async function auditRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);
  fastify.get('/', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN)],
    handler: auditController.list,
  });
}

module.exports = auditRoutes;
