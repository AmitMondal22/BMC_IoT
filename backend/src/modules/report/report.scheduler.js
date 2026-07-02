const { Device, User } = require('../../db/models');
const reportService = require('./report.service');
const { ROLES } = require('../../utils/constants');

let schedulerInterval = null;

function start() {
  console.log('⏰ Report Scheduler: Initialized daily logbook auto-email scheduler.');

  // Run a check every hour
  schedulerInterval = setInterval(async () => {
    try {
      const now = new Date();
      // Only execute the daily mail dispatcher at midnight (00:00 - 01:00 window)
      if (now.getHours() !== 0) return;

      console.log('⏰ Report Scheduler: Midnight detected. Dispatching daily reports...');

      // Yesterday's date in YYYY-MM-DD format
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Fetch all active devices
      const devices = await Device.findAll({
        where: { status: 'active' },
      });

      if (devices.length === 0) {
        console.log('⏰ Report Scheduler: No active devices found. Skipping.');
        return;
      }

      // Collect all admin/super_admin emails (they get reports for all devices)
      const admins = await User.findAll({
        where: {
          role: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
          status: 'active',
        },
      });
      const adminEmails = admins.map(a => a.email).filter(Boolean);

      for (const device of devices) {
        const recipientEmails = new Set(adminEmails);

        // Also send to users mapped to this device
        try {
          const mappedUsers = await device.getUsers();
          mappedUsers.forEach(u => {
            if (u.email && u.status === 'active') recipientEmails.add(u.email);
          });
        } catch (err) {
          console.warn(`⚠️ Report Scheduler: Could not fetch mapped users for ${device.deviceName}:`, err.message);
        }

        // Send daily report email to each recipient
        for (const email of recipientEmails) {
          try {
            console.log(`📧 Report Scheduler: Mailing daily logbook of ${device.deviceName} to ${email}`);
            await reportService.emailDailyReport(device.id, yesterdayStr, email);
          } catch (mailErr) {
            console.error(`❌ Report Scheduler: Failed to email ${device.deviceName} report to ${email}:`, mailErr.message);
          }
        }
      }

      console.log('✅ Report Scheduler: Daily report dispatch completed.');
    } catch (err) {
      console.error('❌ Report Scheduler: Background scheduler job failed:', err.message);
    }
  }, 3600000); // once per hour
}

function stop() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('⏰ Report Scheduler: Stopped.');
  }
}

module.exports = { start, stop };
