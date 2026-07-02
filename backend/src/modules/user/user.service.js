const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User, Device, UserDevice, Organization } = require('../../db/models');
const { NotFoundError, ConflictError } = require('../../utils/errors');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');

class UserService {
  /**
   * List users with pagination and filters
   */
  async list(query, currentUserId = null, currentUserRole = null) {
    const { page, limit, offset } = getPagination(query);

    const where = {};
    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { email: { [Op.iLike]: `%${query.search}%` } },
      ];
    }
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;

    if (currentUserRole === 'admin' && currentUserId) {
      const currentUser = await User.findByPk(currentUserId);
      if (currentUser) {
        where.organizationId = currentUser.organizationId;
      }
    } else if (query.organizationId) {
      where.organizationId = query.organizationId;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpiry', 'otpCode', 'otpExpiry'] },
      include: [
        { model: Organization, as: 'organization', attributes: ['id', 'name', 'code'] },
      ],
      order: [[query.sortBy || 'createdAt', query.sortOrder || 'DESC']],
      limit,
      offset,
    });

    return {
      users: rows,
      pagination: getPaginationMeta(count, page, limit),
    };
  }

  /**
   * Get user by ID
   */
  async getById(id) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpiry', 'otpCode', 'otpExpiry'] },
      include: [
        { model: Organization, as: 'organization', attributes: ['id', 'name', 'code'] },
        { model: Device, as: 'devices', attributes: ['id', 'deviceCode', 'deviceName', 'status', 'connectionStatus'] },
      ],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Create a new user
   */
  async create(data, currentUserId = null, currentUserRole = null) {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    if (currentUserRole === 'admin' && currentUserId) {
      const currentUser = await User.findByPk(currentUserId);
      if (currentUser) {
        data.organizationId = currentUser.organizationId;
      }
    }

    data.password = await bcrypt.hash(data.password, 12);

    const user = await User.create(data);

    const result = user.toJSON();
    delete result.password;
    delete result.passwordResetToken;
    delete result.passwordResetExpiry;
    return result;
  }

  /**
   * Update user
   */
  async update(id, data, currentUserId = null, currentUserRole = null) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (currentUserRole === 'admin' && currentUserId) {
      const currentUser = await User.findByPk(currentUserId);
      if (!currentUser || currentUser.organizationId !== user.organizationId) {
        throw new NotFoundError('User not found in your organization');
      }
    }

    if (data.email && data.email !== user.email) {
      const existing = await User.findOne({ where: { email: data.email } });
      if (existing) {
        throw new ConflictError('Email already in use');
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    await user.update(data);

    const result = user.toJSON();
    delete result.password;
    return result;
  }

  /**
   * Delete user (soft delete)
   */
  async delete(id, currentUserId = null, currentUserRole = null) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (currentUserRole === 'admin' && currentUserId) {
      const currentUser = await User.findByPk(currentUserId);
      if (!currentUser || currentUser.organizationId !== user.organizationId) {
        throw new NotFoundError('User not found in your organization');
      }
    }

    await user.destroy();
    return { message: 'User deleted successfully' };
  }

  /**
   * Reset user password (admin action)
   */
  async resetPassword(id, newPassword, currentUserId = null, currentUserRole = null) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (currentUserRole === 'admin' && currentUserId) {
      const currentUser = await User.findByPk(currentUserId);
      if (!currentUser || currentUser.organizationId !== user.organizationId) {
        throw new NotFoundError('User not found in your organization');
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashedPassword });

    return { message: 'Password reset successfully' };
  }

  /**
   * Assign devices to user
   */
  async assignDevices(userId, deviceIds) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Remove existing assignments
    await UserDevice.destroy({ where: { userId } });

    // Create new assignments
    const assignments = deviceIds.map((deviceId) => ({
      userId,
      deviceId,
      assignedAt: new Date(),
    }));

    await UserDevice.bulkCreate(assignments, { ignoreDuplicates: true });

    return { message: `${deviceIds.length} devices assigned to user` };
  }
}

module.exports = new UserService();
