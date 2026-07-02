const env = require('../config/env');

async function registerSwagger(fastify) {
  await fastify.register(require('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'BMC IoT Monitoring Platform API',
        description: 'API documentation for the Milk BMC IoT Monitoring Platform',
        version: '1.0.0',
      },
      servers: [
        { url: `http://localhost:${env.port}`, description: 'Development' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
}

module.exports = registerSwagger;
