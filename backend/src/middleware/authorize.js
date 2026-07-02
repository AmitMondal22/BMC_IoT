const { ForbiddenError } = require('../utils/errors');

/**
 * Role-based authorization middleware factory
 * @param  {...string} allowedRoles - Roles allowed to access the route
 * @returns {Function} Fastify preHandler hook
 */
function authorize(...allowedRoles) {
  return async (request, reply) => {
    if (!request.userRole) {
      throw new ForbiddenError('Access denied. No role assigned');
    }

    if (!allowedRoles.includes(request.userRole)) {
      throw new ForbiddenError(
        `Access denied. Required role: ${allowedRoles.join(' or ')}`
      );
    }
  };
}

module.exports = authorize;
