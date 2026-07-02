const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { User } = require('../../db/models');
const { getRedis } = require('../../config/redis');
const { UnauthorizedError, NotFoundError, BadRequestError } = require('../../utils/errors');
const { CACHE_TTL } = require('../../utils/constants');

class AuthService {
  /**
   * Login with email and password
   */
  async login(email, password, fastify) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('Account is suspended or inactive');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '15m' }
    );

    const refreshToken = fastify.jwt.sign(
      { id: user.id, type: 'refresh' },
      { expiresIn: '7d' }
    );

    // Store session in cache
    const redis = getRedis();
    await redis.setex(`session:${user.id}`, CACHE_TTL.USER_SESSION, JSON.stringify({
      userId: user.id,
      role: user.role,
      loginAt: new Date().toISOString(),
    }));

    // Store refresh token
    await redis.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

    // Update last login
    await user.update({ lastLogin: new Date() });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        organizationId: user.organizationId,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(token, fastify) {
    try {
      const decoded = fastify.jwt.verify(token);
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const redis = getRedis();
      const storedToken = await redis.get(`refresh:${decoded.id}`);
      if (!storedToken || storedToken !== token) {
        throw new UnauthorizedError('Refresh token expired or revoked');
      }

      const user = await User.findByPk(decoded.id);
      if (!user || user.status !== 'active') {
        throw new UnauthorizedError('User not found or inactive');
      }

      // Generate new access token
      const accessToken = fastify.jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        { expiresIn: '15m' }
      );

      // Refresh session TTL
      await redis.setex(`session:${user.id}`, CACHE_TTL.USER_SESSION, JSON.stringify({
        userId: user.id,
        role: user.role,
        loginAt: new Date().toISOString(),
      }));

      return { accessToken };
    } catch (err) {
      if (err.statusCode) throw err;
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  /**
   * Logout - invalidate session
   */
  async logout(userId) {
    const redis = getRedis();
    await redis.del(`session:${userId}`);
    await redis.del(`refresh:${userId}`);
  }

  /**
   * Send password reset email
   */
  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Return success even if user not found (security)
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await user.update({
      passwordResetToken: hashedToken,
      passwordResetExpiry: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });

    // TODO: Send email with reset link
    // await emailService.sendPasswordReset(user.email, resetToken);

    return { message: 'If the email exists, a reset link has been sent', resetToken };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    if (user.passwordResetExpiry < new Date()) {
      throw new BadRequestError('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await user.update({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
    });

    // Invalidate all sessions
    const redis = getRedis();
    await redis.del(`session:${user.id}`);
    await redis.del(`refresh:${user.id}`);

    return { message: 'Password reset successfully' };
  }

  /**
   * Send OTP for mobile login
   */
  async sendOTP(phone) {
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      throw new NotFoundError('No account found with this phone number');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const redis = getRedis();

    // Store OTP in cache with 5 min TTL
    await redis.setex(`otp:${phone}`, CACHE_TTL.OTP, otp);

    // Update user OTP fields
    await user.update({
      otpCode: otp,
      otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
    });

    // TODO: Send OTP via SMS service
    // await smsService.sendOTP(phone, otp);

    return { message: 'OTP sent successfully', otp: process.env.NODE_ENV === 'development' ? otp : undefined };
  }

  /**
   * Verify OTP and login
   */
  async verifyOTP(phone, otp, fastify) {
    const redis = getRedis();
    const storedOTP = await redis.get(`otp:${phone}`);

    if (!storedOTP || storedOTP !== otp) {
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Clear OTP
    await redis.del(`otp:${phone}`);
    await user.update({ otpCode: null, otpExpiry: null });

    // Generate tokens (same as login)
    const accessToken = fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '15m' }
    );

    const refreshToken = fastify.jwt.sign(
      { id: user.id, type: 'refresh' },
      { expiresIn: '7d' }
    );

    // Store session
    await redis.setex(`session:${user.id}`, CACHE_TTL.USER_SESSION, JSON.stringify({
      userId: user.id,
      role: user.role,
      loginAt: new Date().toISOString(),
    }));
    await redis.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

    await user.update({ lastLogin: new Date() });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    };
  }

  /**
   * Change password (authenticated)
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashedPassword });

    return { message: 'Password changed successfully' };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpiry', 'otpCode', 'otpExpiry'] },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}

module.exports = new AuthService();
