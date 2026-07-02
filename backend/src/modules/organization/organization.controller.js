const organizationService = require('./organization.service');
const response = require('../../utils/response');

class OrganizationController {
  async list(request, reply) {
    const result = await organizationService.list(request.query);
    return response.paginated(reply, result.organizations, result.pagination);
  }

  async getById(request, reply) {
    const org = await organizationService.getById(request.params.id);
    return response.success(reply, org);
  }

  async create(request, reply) {
    const org = await organizationService.create(request.body);
    return response.created(reply, org);
  }

  async update(request, reply) {
    const org = await organizationService.update(request.params.id, request.body);
    return response.success(reply, org, 'Updated');
  }

  async delete(request, reply) {
    await organizationService.delete(request.params.id);
    return response.success(reply, null, 'Deleted');
  }
}

module.exports = new OrganizationController();
