const Joi = require('joi');

const createDeviceSchema = {
  body: Joi.object({
    deviceCode: Joi.string().min(2).max(50).required(),
    deviceName: Joi.string().min(2).max(150).required(),
    routeId: Joi.string().uuid().allow(null),
    tankCapacity: Joi.number().positive().required(),
    minTankVolume: Joi.number().min(0).default(0),
    setTemperature: Joi.number().default(4.0),
    dieselConsumption: Joi.number().min(0).default(0),
    alertMobileNumbers: Joi.array().items(Joi.string()).default([]),
    firmwareVersion: Joi.string().allow('', null),
    hardwareVersion: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'inactive', 'maintenance').default('active'),
    userIds: Joi.array().items(Joi.string().uuid()).allow(null).default([]),
    metadata: Joi.object().allow(null).default({}),
  }),
};

const updateDeviceSchema = {
  body: Joi.object({
    deviceName: Joi.string().min(2).max(150),
    routeId: Joi.string().uuid().allow(null),
    tankCapacity: Joi.number().positive(),
    minTankVolume: Joi.number().min(0),
    setTemperature: Joi.number(),
    dieselConsumption: Joi.number().min(0),
    alertMobileNumbers: Joi.array().items(Joi.string()),
    firmwareVersion: Joi.string().allow('', null),
    hardwareVersion: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'inactive', 'maintenance'),
    userIds: Joi.array().items(Joi.string().uuid()).allow(null),
    metadata: Joi.object().allow(null),
  }).min(1),
  params: Joi.object({ id: Joi.string().uuid().required() }),
};

const calibrateDeviceSchema = {
  body: Joi.object({
    type: Joi.string().valid('temperature', 'volume', 'offset', 'sensor').required(),
    parameters: Joi.object().required(),
    notes: Joi.string().allow('', null),
  }),
  params: Joi.object({ id: Joi.string().uuid().required() }),
};

module.exports = { createDeviceSchema, updateDeviceSchema, calibrateDeviceSchema };
