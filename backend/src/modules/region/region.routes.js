const regionController = require('./region.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const auditLog = require('../../middleware/auditLog');
const { ROLES } = require('../../utils/constants');
const { createRegionSchema, updateRegionSchema } = require('./region.schema');

async function regionRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  // Regions
  fastify.get('/regions', { handler: regionController.listRegions });
  fastify.get('/regions/:id', { handler: regionController.getRegion });
  
  fastify.post('/regions', {
    preHandler: [authorize(ROLES.SUPER_ADMIN), validate(createRegionSchema)],
    onResponse: auditLog('CREATE', 'Region'),
    handler: regionController.createRegion
  });

  fastify.put('/regions/:id', {
    preHandler: [authorize(ROLES.SUPER_ADMIN), validate(updateRegionSchema)],
    onResponse: auditLog('UPDATE', 'Region'),
    handler: regionController.updateRegion
  });

  fastify.delete('/regions/:id', {
    preHandler: [authorize(ROLES.SUPER_ADMIN)],
    onResponse: auditLog('DELETE', 'Region'),
    handler: regionController.deleteRegion
  });
}

module.exports = regionRoutes;
