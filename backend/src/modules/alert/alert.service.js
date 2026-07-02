const { Op } = require('sequelize');
const { Alert, Device } = require('../../db/models');
const { NotFoundError } = require('../../utils/errors');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');

class AlertService {
  async list(query) {
    const { page, limit, offset } = getPagination(query);
    const where = {};

    if (query.type) where.type = query.type;
    if (query.severity) where.severity = query.severity;
    if (query.acknowledged !== undefined) where.acknowledged = query.acknowledged === 'true';
    if (query.deviceId) where.deviceId = query.deviceId;

    const { count, rows } = await Alert.findAndCountAll({
      where,
      include: [{ model: Device, as: 'device', attributes: ['id', 'deviceCode', 'deviceName'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { alerts: rows, pagination: getPaginationMeta(count, page, limit) };
  }

  async acknowledge(id, userId) {
    const alert = await Alert.findByPk(id);
    if (!alert) throw new NotFoundError('Alert not found');

    await alert.update({
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
    });

    return alert;
  }

  async acknowledgeAll(userId) {
    const [count] = await Alert.update(
      { acknowledged: true, acknowledgedBy: userId, acknowledgedAt: new Date() },
      { where: { acknowledged: false } }
    );

    return { message: `${count} alerts acknowledged` };
  }
}

module.exports = new AlertService();
