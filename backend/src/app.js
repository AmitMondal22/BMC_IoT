const Fastify = require('fastify');
const env = require('./config/env');

function buildApp() {
  const fastify = Fastify({
    logger: {
      level: env.isDev ? 'info' : 'warn',
      transport: env.isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
    },
    trustProxy: true,
  });

  // ===== PLUGINS =====

  // CORS
  fastify.register(require('@fastify/cors'), {
    origin: [env.frontendUrl, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Security headers
  fastify.register(require('@fastify/helmet'), { contentSecurityPolicy: false });

  // Rate limiting
  fastify.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  });

  // JWT
  fastify.register(require('@fastify/jwt'), {
    secret: env.jwt.secret,
  });

  // Multipart file uploads
  fastify.register(require('@fastify/multipart'), {
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Static files serving (for uploads)
  const path = require('path');
  fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, '../public'),
    prefix: '/public/',
  });

  // WebSocket
  fastify.register(require('@fastify/websocket'));

  // Swagger docs
  fastify.register(require('./plugins/swagger'));

  // ===== GLOBAL ERROR HANDLER =====
  fastify.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;

    request.log.error({
      err: error,
      url: request.url,
      method: request.method,
    });

    reply.status(statusCode).send({
      success: false,
      message: error.message || 'Internal Server Error',
      errors: error.errors || null,
      timestamp: new Date().toISOString(),
    });
  });

  // ===== HEALTH CHECK =====
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // ===== API ROUTES =====
  fastify.register(require('./modules/auth/auth.routes'), { prefix: '/api/auth' });
  fastify.register(require('./modules/user/user.routes'), { prefix: '/api/users' });
  fastify.register(require('./modules/organization/organization.routes'), { prefix: '/api/organizations' });
  fastify.register(require('./modules/region/region.routes'), { prefix: '/api' });
  fastify.register(require('./modules/route/route.routes'), { prefix: '/api/routes' });
  fastify.register(require('./modules/device/device.routes'), { prefix: '/api/devices' });
  fastify.register(require('./modules/dashboard/dashboard.routes'), { prefix: '/api/dashboard' });
  fastify.register(require('./modules/alert/alert.routes'), { prefix: '/api/alerts' });
  fastify.register(require('./modules/report/report.routes'), { prefix: '/api/reports' });
  fastify.register(require('./modules/audit/audit.routes'), { prefix: '/api/audit-logs' });

  // ===== WEBSOCKET ROUTE =====
  fastify.register(async function (fastify) {
    const mqttService = require('./services/mqtt.service');

    fastify.get('/ws/dashboard', { websocket: true }, (socket, req) => {
      console.log('WebSocket client connected');
      mqttService.addWSClient(socket);

      socket.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          // Handle client messages if needed (e.g., subscribe to specific devices)
        } catch (e) {
          // ignore
        }
      });
    });
  });

  return fastify;
}

module.exports = buildApp;
