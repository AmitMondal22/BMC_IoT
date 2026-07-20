const auditService = require('./audit.service');
const response = require('../../utils/response');

class AuditController {
  async list(request, reply) {
    const result = await auditService.list(request.query);
    return response.paginated(reply, result.logs, result.pagination, 'Audit logs fetched');
  }
}

module.exports = new AuditController();
