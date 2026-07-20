const Joi = require('joi');

const createRegionSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(150).required(),
    code: Joi.string().min(1).max(50).required(),
    organizationId: Joi.string().uuid().allow('', null).optional(),
    description: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'inactive').default('active'),
  }),
};

const updateRegionSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(150),
    code: Joi.string().min(1).max(50),
    description: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'inactive'),
  }).min(1),
  params: Joi.object({ id: Joi.string().uuid().required() }),
};

module.exports = { createRegionSchema, updateRegionSchema };
