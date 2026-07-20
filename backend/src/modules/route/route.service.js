const { Op } = require('sequelize');
const { Route, Region, Device, User } = require('../../db/models');
const { NotFoundError, ConflictError } = require('../../utils/errors');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');

class RouteService {
  async list(query, userId, userRole) {
    const { page, limit, offset } = getPagination(query);
    const where = {};
    const regionInclude = {
      model: Region,
      as: 'region',
      attributes: ['id', 'name', 'code', 'organizationId']
    };

    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { code: { [Op.iLike]: `%${query.search}%` } },
      ];
    }
    if (query.regionId) where.regionId = query.regionId;
    if (query.status) where.status = query.status;

    if (userRole !== 'super_admin') {
      const user = await User.findByPk(userId);
      if (user) {
        regionInclude.where = { organizationId: user.organizationId };
      }
    }

    const { count, rows } = await Route.findAndCountAll({
      where,
      include: [
        regionInclude,
        { model: Device, as: 'devices', attributes: ['id', 'deviceCode', 'deviceName', 'connectionStatus'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { routes: rows, pagination: getPaginationMeta(count, page, limit) };
  }

  async getById(id) {
    const route = await Route.findByPk(id, {
      include: [
        { model: Region, as: 'region' },
        { model: Device, as: 'devices' },
      ],
    });
    if (!route) throw new NotFoundError('Route not found');
    return route;
  }

  async create(data) {
    const existing = await Route.findOne({ where: { code: data.code } });
    if (existing) throw new ConflictError('Route code already exists');
    return Route.create(data);
  }

  async update(id, data) {
    const route = await Route.findByPk(id);
    if (!route) throw new NotFoundError('Route not found');
    if (data.code && data.code !== route.code) {
      const existing = await Route.findOne({ where: { code: data.code } });
      if (existing) throw new ConflictError('Route code already in use');
    }
    await route.update(data);
    return route;
  }

  async delete(id) {
    const route = await Route.findByPk(id);
    if (!route) throw new NotFoundError('Route not found');
    await route.destroy();
    return { message: 'Route deleted' };
  }
}

module.exports = new RouteService();
