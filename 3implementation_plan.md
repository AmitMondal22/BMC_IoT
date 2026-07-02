# Implementation Plan - Convert user-notifications-config to Fastify & Simplify Action Trigger

The goal of this task is to simplify the `user-notifications-config` service and align it with the recent architecture updates in the `notification_syatems` service. This includes converting the Express framework to Fastify, simplifying the action trigger routes, and ensuring correct instantiation of proxy-wrapped Mongoose models.

## User Review Required

> [!IMPORTANT]
> - Converting the service from Express to Fastify will change how routes and middleware/validation are registered. 
> - We will migrate the current Joi validation middleware to Fastify hooks/schemas so that it remains robust but simpler.

## Open Questions

> [!WARNING]
> 1. **Framework Conversion:** Do you want us to convert the entire `user-notifications-config` service to Fastify (like `notification_syatems`)? Or should we only simplify the Express controllers/routes?
> 2. **Simplifying "Generate and Action" Code:** By "more simple generate and action", do you mean simplifying the Postman generation script (`generate-postman.js`) and the Action Trigger execution workflow? Or does it refer to specific logic in `actionTriggerController.js` and the HTML UI generator (`test-notification-ui.html`)?
> 3. **Proxy Model Initialization:** Are there any other models in the codebase where the proxy construct fix (adding the `construct` handler to the proxy) needs to be verified?

## Proposed Changes

### [Framework Migration & Route Simplification]

We will convert `user-notifications-config` from Express to Fastify.

#### [MODIFY] [package.json](file:///d:/iot-app/services/norification/user-notifications-config/package.json)
- Add `fastify`, `@fastify/cors`, `@fastify/static`.
- Remove `express`, `cors`.

#### [MODIFY] [app.js](file:///d:/iot-app/services/norification/user-notifications-config/app.js)
- Rewrite server setup to use Fastify.
- Register Fastify plugins for CORS and Static files.
- Register all routes using Fastify's plugin architecture.

#### [MODIFY] [server.js](file:///d:/iot-app/services/norification/user-notifications-config/server.js)
- Adapt the clustering and initialization server code for Fastify.

#### [MODIFY] [routes/actionTrigger.routes.js](file:///d:/iot-app/services/norification/user-notifications-config/routes/actionTrigger.routes.js) (and all other routes)
- Convert routes to Fastify plugin style: `async function routes(fastify, options)`.

#### [MODIFY] [controllers/actionTriggerController.js](file:///d:/iot-app/services/norification/user-notifications-config/controllers/actionTriggerController.js) (and other controllers)
- Adapt method signatures from Express `(req, res)` to Fastify `(request, reply)`.
- Use Fastify's `reply.send()` and `reply.status()` instead of Express `res.json()` and `res.status()`.

#### [MODIFY] [middleware/validation.js](file:///d:/iot-app/services/norification/user-notifications-config/middleware/validation.js)
- Adapt Joi validation to run inside a Fastify hook (`preHandler`) or register validations using Joi.

## Verification Plan

### Automated Tests
- Run `npm run dev` to verify the Fastify server starts successfully.
- Test endpoint health using curl/Postman commands.

### Manual Verification
- Test action trigger CRUD and stats endpoints via Fastify.
- Open `test-notification-ui.html` and verify the UI payloads are correctly generated and processed by the updated backend.
