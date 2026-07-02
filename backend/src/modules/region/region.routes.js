const regionController = require('./region.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { ROLES } = require('../../utils/constants');
const { createRegionSchema, updateRegionSchema, createSubRegionSchema, updateSubRegionSchema } = require('./region.schema');

async function regionRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  // Regions
  fastify.get('/regions', { handler: regionController.listRegions });
  fastify.get('/regions/:id', { handler: regionController.getRegion });
  fastify.post('/regions', { preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(createRegionSchema)], handler: regionController.createRegion });
  fastify.put('/regions/:id', { preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(updateRegionSchema)], handler: regionController.updateRegion });
  fastify.delete('/regions/:id', { preHandler: [authorize(ROLES.SUPER_ADMIN)], handler: regionController.deleteRegion });

  // Sub Regions
  fastify.get('/sub-regions', { handler: regionController.listSubRegions });
  fastify.get('/sub-regions/:id', { handler: regionController.getSubRegion });
  fastify.post('/sub-regions', { preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(createSubRegionSchema)], handler: regionController.createSubRegion });
  fastify.put('/sub-regions/:id', { preHandler: [authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(updateSubRegionSchema)], handler: regionController.updateSubRegion });
  fastify.delete('/sub-regions/:id', { preHandler: [authorize(ROLES.SUPER_ADMIN)], handler: regionController.deleteSubRegion });
}

module.exports = regionRoutes;
