const deviceController = require('./device.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { ROLES } = require('../../utils/constants');
const { createDeviceSchema, updateDeviceSchema, calibrateDeviceSchema } = require('./device.schema');

async function deviceRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', { handler: deviceController.list });
  fastify.get('/:id', { handler: deviceController.getById });
  fastify.post('/', { preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(createDeviceSchema)], handler: deviceController.create });
  fastify.put('/:id', { preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(updateDeviceSchema)], handler: deviceController.update });
  fastify.delete('/:id', { preHandler: [authorize(ROLES.SUPER_ADMIN)], handler: deviceController.delete });

  // Calibration
  fastify.post('/:id/calibrate', { preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(calibrateDeviceSchema)], handler: deviceController.calibrate });
  fastify.get('/:id/calibrations', { handler: deviceController.getCalibrations });

  // Alert Config
  fastify.get('/:id/alert-configs', { handler: deviceController.getAlertConfigs });
  fastify.put('/:id/alert-configs', { handler: deviceController.updateAlertConfigs });
}

module.exports = deviceRoutes;
