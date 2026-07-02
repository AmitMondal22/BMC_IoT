const authService = require('./auth.service');
const response = require('../../utils/response');

class AuthController {
  async login(request, reply) {
    const { email, password } = request.body;
    const result = await authService.login(email, password, request.server);
    return response.success(reply, result, 'Login successful');
  }

  async refreshToken(request, reply) {
    const { refreshToken } = request.body;
    const result = await authService.refreshToken(refreshToken, request.server);
    return response.success(reply, result, 'Token refreshed');
  }

  async logout(request, reply) {
    await authService.logout(request.userId);
    return response.success(reply, null, 'Logged out successfully');
  }

  async forgotPassword(request, reply) {
    const { email } = request.body;
    const result = await authService.forgotPassword(email);
    return response.success(reply, result, result.message);
  }

  async resetPassword(request, reply) {
    const { token, password } = request.body;
    const result = await authService.resetPassword(token, password);
    return response.success(reply, null, result.message);
  }

  async sendOTP(request, reply) {
    const { phone } = request.body;
    const result = await authService.sendOTP(phone);
    return response.success(reply, result, result.message);
  }

  async verifyOTP(request, reply) {
    const { phone, otp } = request.body;
    const result = await authService.verifyOTP(phone, otp, request.server);
    return response.success(reply, result, 'OTP verified successfully');
  }

  async changePassword(request, reply) {
    const { currentPassword, newPassword } = request.body;
    const result = await authService.changePassword(request.userId, currentPassword, newPassword);
    return response.success(reply, null, result.message);
  }

  async getProfile(request, reply) {
    const user = await authService.getProfile(request.userId);
    return response.success(reply, user, 'Profile fetched');
  }
}

module.exports = new AuthController();
