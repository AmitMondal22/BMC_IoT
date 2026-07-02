const nodemailer = require('nodemailer');
const env = require('../config/env');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }

  async send({ to, subject, html, text }) {
    try {
      const info = await this.transporter.sendMail({
        from: `"BMC Platform" <${env.smtp.from}>`,
        to,
        subject,
        html,
        text,
      });
      console.log('📧 Email sent:', info.messageId);
      return info;
    } catch (err) {
      console.error('❌ Email send error:', err.message);
      throw err;
    }
  }

  async sendPasswordReset(email, token) {
    const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`;
    return this.send({
      to: email,
      subject: 'Password Reset - BMC Platform',
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 30 minutes.</p>
      `,
    });
  }

  async sendAlertNotification(email, alert, device) {
    return this.send({
      to: email,
      subject: `⚠️ Alert: ${alert.type} - ${device.deviceName}`,
      html: `
        <h2>Device Alert</h2>
        <p><strong>Device:</strong> ${device.deviceName} (${device.deviceCode})</p>
        <p><strong>Alert:</strong> ${alert.message}</p>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      `,
    });
  }
}

module.exports = new EmailService();
