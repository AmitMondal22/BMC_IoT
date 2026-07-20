const Joi = require('joi');

const createRouteSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(150).required(),
    code: Joi.string().min(1).max(50).required(),
    regionId: Joi.string().uuid().required(),
    description: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'inactive').default('active'),
  }),
};

const updateRouteSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(150),
    code: Joi.string().min(1).max(50),
    regionId: Joi.string().uuid(),
    description: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'inactive'),
  }).min(1),
  params: Joi.object({ id: Joi.string().uuid().required() }),
};

module.exports = { createRouteSchema, updateRouteSchema };
