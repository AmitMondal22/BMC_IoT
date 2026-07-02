const routeController = require('./route.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { ROLES } = require('../../utils/constants');
const { createRouteSchema, updateRouteSchema } = require('./route.schema');

async function routeRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', { handler: routeController.list });
  fastify.get('/:id', { handler: routeController.getById });
  fastify.post('/', { preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(createRouteSchema)], handler: routeController.create });
  fastify.put('/:id', { preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(updateRouteSchema)], handler: routeController.update });
  fastify.delete('/:id', { preHandler: [authorize(ROLES.SUPER_ADMIN)], handler: routeController.delete });
}

module.exports = routeRoutes;
