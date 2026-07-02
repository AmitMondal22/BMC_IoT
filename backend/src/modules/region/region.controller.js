const regionService = require('./region.service');
const response = require('../../utils/response');

class RegionController {
  // Region
  async listRegions(req, reply) { const r = await regionService.listRegions(req.query, req.userId, req.userRole); return response.paginated(reply, r.regions, r.pagination); }
  async getRegion(req, reply) { return response.success(reply, await regionService.getRegionById(req.params.id)); }
  async createRegion(req, reply) { return response.created(reply, await regionService.createRegion(req.body, req.userId, req.userRole)); }
  async updateRegion(req, reply) { return response.success(reply, await regionService.updateRegion(req.params.id, req.body), 'Updated'); }
  async deleteRegion(req, reply) { await regionService.deleteRegion(req.params.id); return response.success(reply, null, 'Deleted'); }

  // SubRegion
  async listSubRegions(req, reply) { const r = await regionService.listSubRegions(req.query, req.userId, req.userRole); return response.paginated(reply, r.subRegions, r.pagination); }
  async getSubRegion(req, reply) { return response.success(reply, await regionService.getSubRegionById(req.params.id)); }
  async createSubRegion(req, reply) { return response.created(reply, await regionService.createSubRegion(req.body)); }
  async updateSubRegion(req, reply) { return response.success(reply, await regionService.updateSubRegion(req.params.id, req.body), 'Updated'); }
  async deleteSubRegion(req, reply) { await regionService.deleteSubRegion(req.params.id); return response.success(reply, null, 'Deleted'); }
}

module.exports = new RegionController();
