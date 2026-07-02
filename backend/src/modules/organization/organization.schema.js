const Joi = require('joi');

const createOrgSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    code: Joi.string().min(2).max(50).required(),
    address: Joi.string().allow('', null),
    contactEmail: Joi.string().email().allow('', null),
    contactPhone: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'inactive').default('active'),
  }),
};

const updateOrgSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(200),
    code: Joi.string().min(2).max(50),
    address: Joi.string().allow('', null),
    contactEmail: Joi.string().email().allow('', null),
    contactPhone: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'inactive'),
  }).min(1),
  params: Joi.object({ id: Joi.string().uuid().required() }),
};

module.exports = { createOrgSchema, updateOrgSchema };
