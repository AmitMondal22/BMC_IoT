const { Op } = require('sequelize');
const { Region, SubRegion, Organization, Route, User } = require('../../db/models');
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
        { model: SubRegion, as: 'subRegions', attributes: ['id', 'name', 'code'] },
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
        { model: SubRegion, as: 'subRegions', include: [{ model: Route, as: 'routes', attributes: ['id', 'name', 'code'] }] },
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

  // ============ SUB REGION ============

  async listSubRegions(query, userId, userRole) {
    const { page, limit, offset } = getPagination(query);
    const where = {};
    const regionInclude = { model: Region, as: 'region', attributes: ['id', 'name', 'code'] };

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

    const { count, rows } = await SubRegion.findAndCountAll({
      where,
      include: [
        regionInclude,
        { model: Route, as: 'routes', attributes: ['id', 'name', 'code'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { subRegions: rows, pagination: getPaginationMeta(count, page, limit) };
  }

  async getSubRegionById(id) {
    const subRegion = await SubRegion.findByPk(id, {
      include: [
        { model: Region, as: 'region', attributes: ['id', 'name', 'code'] },
        { model: Route, as: 'routes', attributes: ['id', 'name', 'code', 'status'] },
      ],
    });
    if (!subRegion) throw new NotFoundError('Sub Region not found');
    return subRegion;
  }

  async createSubRegion(data) {
    const existing = await SubRegion.findOne({ where: { code: data.code } });
    if (existing) throw new ConflictError('Sub Region code already exists');
    return SubRegion.create(data);
  }

  async updateSubRegion(id, data) {
    const subRegion = await SubRegion.findByPk(id);
    if (!subRegion) throw new NotFoundError('Sub Region not found');
    if (data.code && data.code !== subRegion.code) {
      const existing = await SubRegion.findOne({ where: { code: data.code } });
      if (existing) throw new ConflictError('Sub Region code already in use');
    }
    await subRegion.update(data);
    return subRegion;
  }

  async deleteSubRegion(id) {
    const subRegion = await SubRegion.findByPk(id);
    if (!subRegion) throw new NotFoundError('Sub Region not found');
    await subRegion.destroy();
    return { message: 'Sub Region deleted' };
  }
}

module.exports = new RegionService();
