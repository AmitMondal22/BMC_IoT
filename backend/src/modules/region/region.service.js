const { Op } = require('sequelize');
const { Region, Organization, Route, User } = require('../../db/models');
const { NotFoundError, ConflictError } = require('../../utils/errors');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');

class RegionService {
  // ============ REGION ============

  async listRegions(query, userId, userRole) {
    const { page, limit, offset } = getPagination(query);
    const where = {};

    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { code: { [Op.iLike]: `%${query.search}%` } },
      ];
    }
    if (query.status) where.status = query.status;

    if (userRole !== 'super_admin') {
      const user = await User.findByPk(userId);
      if (user) {
        where.organizationId = user.organizationId;
      }
    } else if (query.organizationId) {
      where.organizationId = query.organizationId;
    }

    const { count, rows } = await Region.findAndCountAll({
      where,
      include: [
        { model: Organization, as: 'organization', attributes: ['id', 'name'] },
        { model: Route, as: 'routes', attributes: ['id', 'name', 'code'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { regions: rows, pagination: getPaginationMeta(count, page, limit) };
  }

  async getRegionById(id) {
    const region = await Region.findByPk(id, {
      include: [
        { model: Organization, as: 'organization', attributes: ['id', 'name'] },
        { model: Route, as: 'routes', attributes: ['id', 'name', 'code'] },
      ],
    });
    if (!region) throw new NotFoundError('Region not found');
    return region;
  }

  async createRegion(data, userId, userRole) {
    const existing = await Region.findOne({ where: { code: data.code } });
    if (existing) throw new ConflictError('Region code already exists');

    if (!data.organizationId) {
      const user = await User.findByPk(userId);
      if (!user) throw new NotFoundError('Authenticated user not found');
      data.organizationId = user.organizationId;
    }

    return Region.create(data);
  }

  async updateRegion(id, data) {
    const region = await Region.findByPk(id);
    if (!region) throw new NotFoundError('Region not found');
    if (data.code && data.code !== region.code) {
      const existing = await Region.findOne({ where: { code: data.code } });
      if (existing) throw new ConflictError('Region code already in use');
    }
    await region.update(data);
    return region;
  }

  async deleteRegion(id) {
    const region = await Region.findByPk(id);
    if (!region) throw new NotFoundError('Region not found');
    await region.destroy();
    return { message: 'Region deleted' };
  }
}

module.exports = new RegionService();
