const alertService = require('./alert.service');
const response = require('../../utils/response');

class AlertController {
  async list(req, reply) {
    const r = await alertService.list(req.query);
    return response.paginated(reply, r.alerts, r.pagination);
  }

  async acknowledge(req, reply) {
    const alert = await alertService.acknowledge(req.params.id, req.userId);
    return response.success(reply, alert, 'Alert acknowledged');
  }

  async acknowledgeAll(req, reply) {
    const result = await alertService.acknowledgeAll(req.userId);
    return response.success(reply, null, result.message);
  }
}

module.exports = new AlertController();
