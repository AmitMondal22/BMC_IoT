const userController = require('./user.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { ROLES } = require('../../utils/constants');
const {
  createUserSchema,
  updateUserSchema,
  assignDevicesSchema,
  idParamSchema,
  listQuerySchema,
} = require('./user.schema');

async function userRoutes(fastify, options) {
  // All user routes require authentication
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(listQuerySchema)],
    handler: userController.list,
  });

  fastify.get('/:id', {
    preHandler: [validate(idParamSchema)],
    handler: userController.getById,
  });

  fastify.post('/', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(createUserSchema)],
    handler: userController.create,
  });

  fastify.put('/:id', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(updateUserSchema)],
    handler: userController.update,
  });

  fastify.delete('/:id', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(idParamSchema)],
    handler: userController.delete,
  });

  fastify.put('/:id/reset-password', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(idParamSchema)],
    handler: userController.resetPassword,
  });

  fastify.post('/:id/assign-devices', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(assignDevicesSchema)],
    handler: userController.assignDevices,
  });
}

module.exports = userRoutes;
