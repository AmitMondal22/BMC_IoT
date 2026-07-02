const orgController = require('./organization.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { ROLES } = require('../../utils/constants');
const { createOrgSchema, updateOrgSchema } = require('./organization.schema');

async function organizationRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', { handler: orgController.list });
  fastify.get('/:id', { handler: orgController.getById });

  fastify.post('/', {
    preHandler: [authorize(ROLES.SUPER_ADMIN), validate(createOrgSchema)],
    handler: orgController.create,
  });

  fastify.put('/:id', {
    preHandler: [authorize(ROLES.SUPER_ADMIN), validate(updateOrgSchema)],
    handler: orgController.update,
  });

  fastify.delete('/:id', {
    preHandler: [authorize(ROLES.SUPER_ADMIN)],
    handler: orgController.delete,
  });
}

module.exports = organizationRoutes;
