const mqtt = require('mqtt');

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';
const UID = 'AE00000001';

console.log(`🤖 MQTT Integration Verification Script`);
console.log(`📡 Connecting to broker: ${BROKER_URL}`);

const connectOptions = {
  clientId: 'bmc-verifier',
  clean: true,
};

if (MQTT_USERNAME) {
  connectOptions.username = MQTT_USERNAME;
  connectOptions.password = MQTT_PASSWORD;
}

const client = mqtt.connect(BROKER_URL, connectOptions);

client.on('connect', () => {
  console.log('✅ Verifier connected to MQTT broker');

  // 1. Subscribe to telemetry topic
  const telemetryTopic = `MPDSET/1/${UID}`;
  client.subscribe(telemetryTopic, (err) => {
    if (err) console.error(`❌ Failed to subscribe to ${telemetryTopic}:`, err.message);
    else console.log(`📡 Subscribed to telemetry: ${telemetryTopic}`);
  });

  // 2. Subscribe to command topic to verify it goes out
  const commandTopic = `/MPDSUB/${UID}`;
  client.subscribe(commandTopic, (err) => {
    if (err) console.error(`❌ Failed to subscribe to ${commandTopic}:`, err.message);
    else console.log(`📡 Subscribed to commands: ${commandTopic}`);
  });

  // Wait a moment, then publish a DREAD command
  setTimeout(() => {
    console.log(`\n--- Test 1: Sending DREAD command ---`);
    const dreadCmd = `*DREAD,${UID}#`;
    client.publish(commandTopic, dreadCmd, { qos: 1 }, () => {
      console.log(`📤 Published command: ${dreadCmd}`);
    });
  }, 2000);

  // Then send manual dispatch start command
  setTimeout(() => {
    console.log(`\n--- Test 2: Sending manual dispatch start command ---`);
    const dprocStartCmd = `*DPROC,${UID},1#`;
    client.publish(commandTopic, dprocStartCmd, { qos: 1 }, () => {
      console.log(`📤 Published command: ${dprocStartCmd}`);
    });
  }, 6000);

  // Then send manual dispatch stop command
  setTimeout(() => {
    console.log(`\n--- Test 3: Sending manual dispatch stop command ---`);
    const dprocStopCmd = `*DPROC,${UID},2#`;
    client.publish(commandTopic, dprocStopCmd, { qos: 1 }, () => {
      console.log(`📤 Published command: ${dprocStopCmd}`);
    });
  }, 10000);

  // Wrap up
  setTimeout(() => {
    console.log(`\n✅ Verification run complete. Exiting.`);
    client.end();
    process.exit(0);
  }, 14000);
});

client.on('error', (err) => {
  console.error('❌ MQTT error handler:', err.message);
});

client.on('offline', () => {
  console.log('🔌 MQTT client went offline');
});

client.on('message', (topic, message) => {
  console.log(`\n📥 Received message on [${topic}]:`);
  try {
    const rawContent = message.toString();
    if (topic.includes('MPDDATA')) {
      const parsed = JSON.parse(rawContent);
      console.log(`  - Type: ${parsed.TYPE}`);
      console.log(`  - Temp: ${parsed.TEMP_C} °C`);
      console.log(`  - Volume: ${parsed.VOLUME_L} L`);
      console.log(`  - Level: ${parsed.LEVEL_MM} mm`);
      console.log(`  - Compressor States: ${JSON.stringify(parsed.COMPRESSOR)}`);
      console.log(`  - Process State: ${parsed.PROCESS}`);
      console.log(`  - Status flags: ${JSON.stringify(parsed.STATUS)}`);
      console.log(`  - Alarms flags: ${JSON.stringify(parsed.ALARM)}`);
    } else {
      console.log(`  - Raw Payload: "${rawContent}"`);
    }
  } catch (err) {
    console.log(`  - Error parsing: ${err.message}`);
    console.log(`  - Raw data: ${message.toString()}`);
  }
});
