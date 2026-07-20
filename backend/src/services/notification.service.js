const admin = require('firebase-admin');
const config = require('../config/env');
const { User, Route, Region } = require('../db/models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK if credentials are present
let firebaseInitialized = false;

try {
  const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully using serviceAccountKey.json.');
  } else {
    const { projectId, clientEmail, privateKey } = config.firebase;
    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully using env credentials.');
    } else {
      console.log('⚠️ serviceAccountKey.json or Firebase env credentials missing. Using mock fallback logger for push notifications.');
    }
  }
} catch (e) {
  console.error('❌ Firebase Admin SDK initialization failed:', e.message);
}

class NotificationService {
  async sendAlertNotifications(device, alertData) {
    try {
      let routeId = device.routeId;
      let regionId = device.regionId;

      // Ensure we have route and region information
      if (!routeId || !regionId) {
        const dbDevice = await device.constructor.findByPk(device.id, {
          include: [
            {
              model: Route,
              as: 'route',
              attributes: ['id', 'regionId'],
            },
          ],
        });
        if (dbDevice) {
          routeId = routeId || dbDevice.routeId;
          regionId = regionId || dbDevice.regionId || (dbDevice.route && dbDevice.route.regionId);
        }
      }

      // Build target scoping list
      const whereConditions = [];
      if (routeId) whereConditions.push({ routeId });
      if (regionId) whereConditions.push({ regionId });

      if (whereConditions.length === 0) {
        console.log(`ℹ️ Device ${device.deviceName} has no route or region assignment. Notification skipped.`);
        return;
      }

      // Query active operators assigned to the target route/region
      const users = await User.findAll({
        where: {
          [Op.or]: whereConditions,
          status: 'active',
        },
        attributes: ['id', 'name', 'fcmToken'],
      });

      // Filter users who have registered push tokens
      const fcmTokens = users.map(u => u.fcmToken).filter(token => !!token);

      if (fcmTokens.length === 0) {
        console.log(`ℹ️ No active FCM tokens found for route ${routeId} / region ${regionId}.`);
        return;
      }

      console.log(`📱 Routing notification for device ${device.deviceName} to ${fcmTokens.length} registered FCM client(s)...`);

      // Dispatch notifications via Firebase Admin SDK or Fallback
      if (firebaseInitialized) {
        const payload = {
          notification: {
            title: `${alertData.severity.toUpperCase()} ALERT — ${device.deviceName}`,
            body: alertData.message,
          },
          data: {
            deviceId: String(device.id),
            deviceCode: String(device.deviceCode),
            alertType: String(alertData.type),
            severity: String(alertData.severity),
          },
        };

        const response = await admin.messaging().sendEachForMulticast({
          tokens: fcmTokens,
          notification: payload.notification,
          data: payload.data,
        });

        console.log(`✅ FCM Broadcast complete: ${response.successCount} successful, ${response.failureCount} failed.`);
      } else {
        // Fallback logger for local test environments
        for (const token of fcmTokens) {
          console.log(`[MOCK FCM PUSH] Token: ${token}`);
          console.log(`Title: ${alertData.severity.toUpperCase()} ALERT — ${device.deviceName}`);
          console.log(`Body: ${alertData.message}`);
        }
      }
    } catch (err) {
      console.error('❌ Failed to route alert notifications:', err.message);
    }
  }
}

module.exports = new NotificationService();
