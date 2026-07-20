const deviceController = require('./device.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const auditLog = require('../../middleware/auditLog');
const { ROLES } = require('../../utils/constants');
const { createDeviceSchema, updateDeviceSchema, calibrateDeviceSchema } = require('./device.schema');

async function deviceRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', { handler: deviceController.list });
  fastify.get('/:id', { handler: deviceController.getById });
  
  fastify.post('/', {
    preHandler: [authorize(ROLES.SUPER_ADMIN), validate(createDeviceSchema)],
    onResponse: auditLog('CREATE', 'Device'),
    handler: deviceController.create
  });

  fastify.put('/:id', {
    preHandler: [authorize(ROLES.SUPER_ADMIN), validate(updateDeviceSchema)],
    onResponse: auditLog('UPDATE', 'Device'),
    handler: deviceController.update
  });

  fastify.delete('/:id', {
    preHandler: [authorize(ROLES.SUPER_ADMIN)],
    onResponse: auditLog('DELETE', 'Device'),
    handler: deviceController.delete
  });

  // Calibration
  fastify.post('/:id/calibrate', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(calibrateDeviceSchema)],
    onResponse: auditLog('CALIBRATION', 'Device'),
    handler: deviceController.calibrate
  });
  
  fastify.get('/:id/calibrations', { handler: deviceController.getCalibrations });

  // Alert Config
  fastify.get('/:id/alert-configs', { handler: deviceController.getAlertConfigs });
  
  fastify.put('/:id/alert-configs', {
    onResponse: auditLog('ALERT_CONFIG_CHANGE', 'Device'),
    handler: deviceController.updateAlertConfigs
  });

  // Snapshot Upload
  fastify.post('/:id/snapshots', {
    onResponse: auditLog('SNAPSHOT_UPLOAD', 'Device'),
    handler: deviceController.uploadSnapshot
  });

  // Command Execution
  fastify.post('/code/:deviceCode/command', {
    preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN)],
    handler: deviceController.sendCommand
  });
}

module.exports = deviceRoutes;
