const Joi = require('joi');

const createUserSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).required().label('Name'),
    email: Joi.string().email().required().label('Email'),
    password: Joi.string().min(8).required().label('Password'),
    phone: Joi.string().allow('', null).label('Phone'),
    role: Joi.string().valid('super_admin', 'admin', 'user').default('user').label('Role'),
    organizationId: Joi.string().uuid().allow(null).label('Organization'),
    regionId: Joi.string().uuid().allow('', null).optional().label('Region'),
    routeId: Joi.string().uuid().allow('', null).optional().label('Route'),
    status: Joi.string().valid('active', 'inactive', 'suspended').default('active').label('Status'),
  }),
};

const updateUserSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).label('Name'),
    email: Joi.string().email().label('Email'),
    phone: Joi.string().allow('', null).label('Phone'),
    role: Joi.string().valid('super_admin', 'admin', 'user').label('Role'),
    organizationId: Joi.string().uuid().allow(null).label('Organization'),
    regionId: Joi.string().uuid().allow('', null).optional().label('Region'),
    routeId: Joi.string().uuid().allow('', null).optional().label('Route'),
    status: Joi.string().valid('active', 'inactive', 'suspended').label('Status'),
  }).min(1),
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

const assignDevicesSchema = {
  body: Joi.object({
    deviceIds: Joi.array().items(Joi.string().uuid()).min(1).required().label('Device IDs'),
  }),
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

const idParamSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

const listQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow('').default(''),
    role: Joi.string().valid('super_admin', 'admin', 'user').allow(''),
    status: Joi.string().valid('active', 'inactive', 'suspended').allow(''),
    organizationId: Joi.string().uuid().allow(''),
    sortBy: Joi.string().valid('name', 'email', 'createdAt', 'lastLogin').default('createdAt'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
  }),
};

module.exports = {
  createUserSchema,
  updateUserSchema,
  assignDevicesSchema,
  idParamSchema,
  listQuerySchema,
};
