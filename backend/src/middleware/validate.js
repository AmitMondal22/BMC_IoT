const { ValidationError } = require('../utils/errors');

/**
 * Joi validation middleware factory
 * @param {Object} schema - Joi schema object with optional body, params, query keys
 * @returns {Function} Fastify preHandler hook
 */
function validate(schema) {
  return async (request, reply) => {
    const errors = [];

    if (schema.body && request.body) {
      const { error, value } = schema.body.validate(request.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
          type: 'body',
        })));
      } else {
        request.body = value;
      }
    }

    if (schema.params && request.params) {
      const { error, value } = schema.params.validate(request.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
          type: 'params',
        })));
      } else {
        request.params = value;
      }
    }

    if (schema.query && request.query) {
      const { error, value } = schema.query.validate(request.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
          type: 'query',
        })));
      } else {
        request.query = value;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  };
}

module.exports = validate;
