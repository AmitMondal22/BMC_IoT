const routeController = require('./route.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const auditLog = require('../../middleware/auditLog');
const { ROLES } = require('../../utils/constants');
const { createRouteSchema, updateRouteSchema } = require('./route.schema');

async function routeRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', { handler: routeController.list });
  fastify.get('/:id', { handler: routeController.getById });
  
  fastify.post('/', {
    preHandler: [authorize(ROLES.SUPER_ADMIN), validate(createRouteSchema)],
    onResponse: auditLog('CREATE', 'Route'),
    handler: routeController.create
  });

  fastify.put('/:id', {
    preHandler: [authorize(ROLES.SUPER_ADMIN), validate(updateRouteSchema)],
    onResponse: auditLog('UPDATE', 'Route'),
    handler: routeController.update
  });

  fastify.delete('/:id', {
    preHandler: [authorize(ROLES.SUPER_ADMIN)],
    onResponse: auditLog('DELETE', 'Route'),
    handler: routeController.delete
  });
}

module.exports = routeRoutes;
