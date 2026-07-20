const { Op } = require('sequelize');
const { AuditLog, User } = require('../../db/models');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');

class AuditService {
  async list(query) {
    const { page, limit, offset } = getPagination(query);
    const where = {};

    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = query.action;
    if (query.entity) where.entity = query.entity;

    if (query.startDate && query.endDate) {
      where.createdAt = {
        [Op.between]: [
          new Date(query.startDate + 'T00:00:00.000Z'),
          new Date(query.endDate + 'T23:59:59.999Z'),
        ],
      };
    }

    if (query.search) {
      where[Op.or] = [
        { action: { [Op.iLike]: `%${query.search}%` } },
        { entity: { [Op.iLike]: `%${query.search}%` } },
        { ipAddress: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      logs: rows,
      pagination: getPaginationMeta(count, page, limit),
    };
  }
}

module.exports = new AuditService();
