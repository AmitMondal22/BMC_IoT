const mqtt = require('mqtt');

// Configuration
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const DEVICE_CODE = process.env.DEVICE_CODE || '123456';
const PUBLISH_INTERVAL = parseInt(process.env.PUBLISH_INTERVAL, 10) || 5000; // 5 seconds default

console.log(`🚀 BMC Simulator starting for device: ${DEVICE_CODE}`);
console.log(`📡 Connecting to broker: ${BROKER_URL}`);

const client = mqtt.connect(BROKER_URL, {
  clientId: `bmc-sim-${DEVICE_CODE}-${Math.random().toString(16).substr(2, 6)}`,
  clean: true,
  reconnectPeriod: 2000,
});

// Simulated Device State Variables
let milkTemperature = 15.0; // starts warm, cools down
let waterTemperature = 22.0;
let milkVolume = 100.0; // liters
const TANK_CAPACITY = 5000.0;
let totalKwh = 12000.0;
let gridHours = 450.0;
let dgHours = 24.0;
let compressorRunningHours = 180.0;
let agitatorRunningHours = 140.0;

// Grid state tracking
let gridStatus = true;
let dgStatus = false;

// Cycle status tracking
let cipStatus = false;
let dispatchStatus = false;

// Step counter to orchestrate cycles over time (e.g. periodically run CIP or Dispatch)
let step = 0;

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  // Start periodic publisher
  const intervalId = setInterval(publishTelemetry, PUBLISH_INTERVAL);

  client.on('close', () => {
    console.warn('⚠️ Connection closed');
  });

  client.on('error', (err) => {
    console.error('❌ MQTT Error:', err.message);
  });
});

function publishTelemetry() {
  step++;

  // --- Dynamic state transitions simulation ---
  
  // 1. Grid failure simulation: 3% chance to switch grid status
  if (Math.random() < 0.03) {
    gridStatus = !gridStatus;
    dgStatus = !gridStatus; // DG runs immediately if grid fails
    console.log(`⚡ Power Grid status changed: Grid OK = ${gridStatus}, DG running = ${dgStatus}`);
  }

  // 2. Periodic state transitions:
  // - CIP cleaning every 120 steps (~10 mins at 5s interval), lasts 15 steps (~1.2 mins)
  // - Dispatch every 240 steps (~20 mins), lasts 15 steps
  const cipTriggerStep = 120;
  const dispatchTriggerStep = 240;
  const cycleDuration = 15;

  if (step % cipTriggerStep >= 0 && step % cipTriggerStep < cycleDuration) {
    cipStatus = true;
    dispatchStatus = false;
  } else if (step % dispatchTriggerStep >= 0 && step % dispatchTriggerStep < cycleDuration) {
    cipStatus = false;
    dispatchStatus = true;
  } else {
    cipStatus = false;
    dispatchStatus = false;
  }

  // 3. Milk accumulation & temperature behavior
  if (cipStatus) {
    // During CIP cleaning
    milkVolume = 0.0; // empty tank
    if (milkTemperature < 45.0) milkTemperature += 2.0; // hot water cycle
    waterTemperature = 55.0;
  } else if (dispatchStatus) {
    // During Milk Dispatching
    if (milkVolume > 0) {
      milkVolume -= TANK_CAPACITY * 0.08; // empty rapidly
      if (milkVolume < 0) milkVolume = 0;
    }
    milkTemperature = 4.0; // pre-cooled
    waterTemperature = 20.0;
  } else {
    // Normal cooling mode
    // Milk level increases slowly (milk intake)
    if (milkVolume < TANK_CAPACITY) {
      milkVolume += (Math.random() * 20.0 + 5.0); // gradual filling
      if (milkVolume > TANK_CAPACITY) milkVolume = TANK_CAPACITY;
    }

    // Cooling logic: Compressor status depends on temperature
    const compressorActive = milkTemperature > 4.0;
    
    if (compressorActive) {
      // Cools down rapidly with compressor load
      milkTemperature -= 0.3;
      if (milkTemperature < 3.6) milkTemperature = 3.6; // target temp limit
      totalKwh += 0.05; // draws energy
      compressorRunningHours += (PUBLISH_INTERVAL / 3600000);
      agitatorRunningHours += (PUBLISH_INTERVAL / 3600000);
    } else {
      // Warms up slowly if compressor is off
      milkTemperature += 0.03;
      // Agitator runs occasionally when not cooling to prevent fat separation
      if (step % 4 === 0) agitatorRunningHours += (PUBLISH_INTERVAL / 3600000);
    }
    waterTemperature = 18.0 + Math.sin(step * 0.1) * 2.0;
  }

  // 4. Power & Energy accumulations
  totalKwh += 0.01; // constant idle controller load
  if (gridStatus) {
    gridHours += (PUBLISH_INTERVAL / 3600000);
  } else {
    dgHours += (PUBLISH_INTERVAL / 3600000);
  }

  // Calculate percentage
  const tankLevel = Math.round((milkVolume / TANK_CAPACITY) * 100);

  // 5. Construct payload matching telemetrySchema exactly
  const payload = {
    deviceId: DEVICE_CODE,
    timestamp: new Date().toISOString(),
    milkTemperature: Math.round(milkTemperature * 10) / 10,
    waterTemperature: Math.round(waterTemperature * 10) / 10,
    milkVolume: Math.round(milkVolume),
    tankLevel: Math.min(100, Math.max(0, tankLevel)),
    compressor1: { status: milkTemperature > 4.0 && !cipStatus, runningHours: Math.round(compressorRunningHours * 10) / 10 },
    compressor2: { status: milkTemperature > 6.0 && !cipStatus, runningHours: Math.round((compressorRunningHours * 0.6) * 10) / 10 },
    compressor3: { status: false, runningHours: 0.0 },
    compressor4: { status: false, runningHours: 0.0 },
    agitator1: { status: (milkTemperature > 4.0 && !cipStatus) || (step % 4 === 0), runningHours: Math.round(agitatorRunningHours * 10) / 10 },
    agitator2: { status: false, runningHours: 0.0 },
    gridStatus,
    gridHours: Math.round(gridHours * 10) / 10,
    dgStatus,
    dgHours: Math.round(dgHours * 10) / 10,
    kwh: Math.round(totalKwh * 10) / 10,
    cipStatus,
    dispatchStatus,
    milkMode: !cipStatus,
    waterMode: cipStatus,
    firmware: "v1.2.5",
    hardwareVersion: "v2.0"
  };

  const topic = `bmc/device/${DEVICE_CODE}/telemetry`;
  client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
    if (err) {
      console.error(`❌ Failed to publish to ${topic}:`, err.message);
    } else {
      console.log(`📤 [${step}] Published to ${topic}: Temp=${payload.milkTemperature}°C, Vol=${payload.milkVolume}L, CIP=${cipStatus}, DISP=${dispatchStatus}`);
    }
  });
}
