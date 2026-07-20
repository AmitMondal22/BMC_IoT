const regionService = require('./region.service');
const response = require('../../utils/response');

class RegionController {
  // Region
  async listRegions(req, reply) { const r = await regionService.listRegions(req.query, req.userId, req.userRole); return response.paginated(reply, r.regions, r.pagination); }
  async getRegion(req, reply) { return response.success(reply, await regionService.getRegionById(req.params.id)); }
  async createRegion(req, reply) { return response.created(reply, await regionService.createRegion(req.body, req.userId, req.userRole)); }
  async updateRegion(req, reply) { return response.success(reply, await regionService.updateRegion(req.params.id, req.body), 'Updated'); }
  async deleteRegion(req, reply) { await regionService.deleteRegion(req.params.id); return response.success(reply, null, 'Deleted'); }
}

module.exports = new RegionController();
