const mqtt = require('mqtt');
const env = require('./env');

let mqttClient = null;

/**
 * Initialize MQTT client connection
 */
function initMQTT() {
  const options = {
    clientId: env.mqtt.clientId,
    clean: true,
    connectTimeout: 5000,
    reconnectPeriod: 3000,
  };

  if (env.mqtt.username) {
    options.username = env.mqtt.username;
    options.password = env.mqtt.password;
  }

  mqttClient = mqtt.connect(env.mqtt.brokerUrl, options);

  mqttClient.on('connect', () => {
    console.log('✅ MQTT Broker connected');
  });

  mqttClient.on('error', (err) => {
    console.error('❌ MQTT error:', err.message);
  });

  mqttClient.on('reconnect', () => {
    console.log('🔄 MQTT reconnecting...');
  });

  return mqttClient;
}

function getMQTT() {
  if (!mqttClient) {
    initMQTT();
  }
  return mqttClient;
}

async function closeMQTT() {
  if (mqttClient) {
    return new Promise((resolve) => {
      mqttClient.end(false, () => {
        console.log('MQTT disconnected');
        resolve();
      });
    });
  }
}

module.exports = {
  initMQTT,
  getMQTT,
  closeMQTT,
};
