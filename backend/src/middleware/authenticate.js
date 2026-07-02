const { UnauthorizedError } = require('../utils/errors');
const { getRedis } = require('../config/redis');

/**
 * JWT authentication middleware for Fastify
 * Verifies JWT token and attaches user to request
 */
async function authenticate(request, reply) {
  try {
    const token = extractToken(request);
    if (!token) {
      throw new UnauthorizedError('Access token is required');
    }

    // Verify JWT
    const decoded = await request.jwtVerify();

    // Check if session exists in cache (token not revoked)
    const redis = getRedis();
    const sessionKey = `session:${decoded.id}`;
    const sessionExists = await redis.exists(sessionKey);

    if (!sessionExists) {
      throw new UnauthorizedError('Session expired. Please login again');
    }

    // Attach user info to request
    request.userId = decoded.id;
    request.userRole = decoded.role;
    request.userEmail = decoded.email;

    // If admin/super_admin is impersonating a user (portal mode)
    const portalUserId = request.headers['x-portal-user-id'];
    if (portalUserId && (decoded.role === 'super_admin' || decoded.role === 'admin')) {
      request.userId = portalUserId;
      request.userRole = 'user'; // override role to 'user' for queries
      request.isImpersonating = true;
      request.adminUserId = decoded.id;
    }
  } catch (err) {
    if (err.statusCode === 401) {
      throw err;
    }
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(request) {
  const authHeader = request.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

module.exports = authenticate;
