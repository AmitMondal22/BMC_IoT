const { Op } = require('sequelize');
const { Organization, Region } = require('../../db/models');
const { NotFoundError, ConflictError } = require('../../utils/errors');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');

class OrganizationService {
  async list(query) {
    const { page, limit, offset } = getPagination(query);
    const where = {};

    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { code: { [Op.iLike]: `%${query.search}%` } },
      ];
    }
    if (query.status) where.status = query.status;

    const { count, rows } = await Organization.findAndCountAll({
      where,
      include: [{ model: Region, as: 'regions', attributes: ['id', 'name', 'code'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { organizations: rows, pagination: getPaginationMeta(count, page, limit) };
  }

  async getById(id) {
    const org = await Organization.findByPk(id, {
      include: [{ model: Region, as: 'regions', attributes: ['id', 'name', 'code', 'status'] }],
    });
    if (!org) throw new NotFoundError('Organization not found');
    return org;
  }

  async create(data) {
    const existing = await Organization.findOne({ where: { code: data.code } });
    if (existing) throw new ConflictError('Organization code already exists');
    return Organization.create(data);
  }

  async update(id, data) {
    const org = await Organization.findByPk(id);
    if (!org) throw new NotFoundError('Organization not found');
    if (data.code && data.code !== org.code) {
      const existing = await Organization.findOne({ where: { code: data.code } });
      if (existing) throw new ConflictError('Organization code already in use');
    }
    await org.update(data);
    return org;
  }

  async delete(id) {
    const org = await Organization.findByPk(id);
    if (!org) throw new NotFoundError('Organization not found');
    await org.destroy();
    return { message: 'Organization deleted' };
  }
}

module.exports = new OrganizationService();
