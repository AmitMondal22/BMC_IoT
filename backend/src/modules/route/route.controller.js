const routeService = require('./route.service');
const response = require('../../utils/response');

class RouteController {
  async list(req, reply) { const r = await routeService.list(req.query, req.userId, req.userRole); return response.paginated(reply, r.routes, r.pagination); }
  async getById(req, reply) { return response.success(reply, await routeService.getById(req.params.id)); }
  async create(req, reply) { return response.created(reply, await routeService.create(req.body)); }
  async update(req, reply) { return response.success(reply, await routeService.update(req.params.id, req.body), 'Updated'); }
  async delete(req, reply) { await routeService.delete(req.params.id); return response.success(reply, null, 'Deleted'); }
}

module.exports = new RouteController();
