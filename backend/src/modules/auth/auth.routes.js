const authController = require('./auth.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const {
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  otpSendSchema,
  otpVerifySchema,
  changePasswordSchema,
} = require('./auth.schema');

async function authRoutes(fastify, options) {
  // Public routes
  fastify.post('/login', {
    preHandler: [validate(loginSchema)],
    handler: authController.login,
  });

  fastify.post('/refresh', {
    preHandler: [validate(refreshTokenSchema)],
    handler: authController.refreshToken,
  });

  fastify.post('/forgot-password', {
    preHandler: [validate(forgotPasswordSchema)],
    handler: authController.forgotPassword,
  });

  fastify.post('/reset-password', {
    preHandler: [validate(resetPasswordSchema)],
    handler: authController.resetPassword,
  });

  // OTP routes (mobile)
  fastify.post('/otp/send', {
    preHandler: [validate(otpSendSchema)],
    handler: authController.sendOTP,
  });

  fastify.post('/otp/verify', {
    preHandler: [validate(otpVerifySchema)],
    handler: authController.verifyOTP,
  });

  // Protected routes
  fastify.post('/logout', {
    preHandler: [authenticate],
    handler: authController.logout,
  });

  fastify.post('/change-password', {
    preHandler: [authenticate, validate(changePasswordSchema)],
    handler: authController.changePassword,
  });

  fastify.get('/profile', {
    preHandler: [authenticate],
    handler: authController.getProfile,
  });

  fastify.put('/fcm-token', {
    preHandler: [authenticate],
    handler: authController.updateFCMToken,
  });
}

module.exports = authRoutes;
