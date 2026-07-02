const Joi = require('joi');

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required().label('Email'),
    password: Joi.string().min(6).required().label('Password'),
  }),
};

const refreshTokenSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required().label('Refresh Token'),
  }),
};

const forgotPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email().required().label('Email'),
  }),
};

const resetPasswordSchema = {
  body: Joi.object({
    token: Joi.string().required().label('Reset Token'),
    password: Joi.string().min(8).required().label('New Password'),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .label('Confirm Password')
      .messages({ 'any.only': 'Passwords do not match' }),
  }),
};

const otpSendSchema = {
  body: Joi.object({
    phone: Joi.string().pattern(/^\+?[1-9]\d{7,14}$/).required().label('Phone'),
  }),
};

const otpVerifySchema = {
  body: Joi.object({
    phone: Joi.string().pattern(/^\+?[1-9]\d{7,14}$/).required().label('Phone'),
    otp: Joi.string().length(6).required().label('OTP'),
  }),
};

const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required().label('Current Password'),
    newPassword: Joi.string().min(8).required().label('New Password'),
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .label('Confirm Password')
      .messages({ 'any.only': 'Passwords do not match' }),
  }),
};

module.exports = {
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  otpSendSchema,
  otpVerifySchema,
  changePasswordSchema,
};
