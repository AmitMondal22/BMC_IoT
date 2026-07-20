const userController = require('./user.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const auditLog = require('../../middleware/auditLog');
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
    onResponse: auditLog('CREATE', 'User'),
    handler: userController.create,
  });

  fastify.put('/:id', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(updateUserSchema)],
    onResponse: auditLog('UPDATE', 'User'),
    handler: userController.update,
  });

  fastify.delete('/:id', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(idParamSchema)],
    onResponse: auditLog('DELETE', 'User'),
    handler: userController.delete,
  });

  fastify.put('/:id/reset-password', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(idParamSchema)],
    onResponse: auditLog('PASSWORD_RESET', 'User'),
    handler: userController.resetPassword,
  });

  fastify.post('/:id/assign-devices', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(assignDevicesSchema)],
    onResponse: auditLog('DEVICE_ASSIGNMENT', 'User'),
    handler: userController.assignDevices,
  });

  fastify.post('/:id/force-logout', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(idParamSchema)],
    onResponse: auditLog('FORCE_LOGOUT', 'User'),
    handler: userController.forceLogout,
  });

  fastify.get('/:id/login-history', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(idParamSchema)],
    handler: userController.getLoginHistory,
  });
}

module.exports = userRoutes;
