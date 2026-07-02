const { AuditLog } = require('../db/models');

/**
 * Audit logging middleware factory
 * Records user actions for compliance and debugging
 * @param {string} action - Action type (CREATE, UPDATE, DELETE, etc.)
 * @param {string} entity - Entity name (users, devices, etc.)
 * @returns {Function} Fastify onResponse hook
 */
function auditLog(action, entity) {
  return async (request, reply) => {
    // Only log successful mutations
    if (reply.statusCode >= 200 && reply.statusCode < 300) {
      try {
        await AuditLog.create({
          userId: request.userId || null,
          action,
          entity,
          entityId: request.params?.id || null,
          oldValues: request.auditOldValues || null,
          newValues: request.body || null,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'] || null,
        });
      } catch (err) {
        // Don't fail the request if audit logging fails
        request.log.error({ err }, 'Failed to create audit log');
      }
    }
  };
}

module.exports = auditLog;
