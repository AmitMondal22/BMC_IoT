const mqtt = require('mqtt');

// Configuration
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const DEVICE_CODE = process.env.DEVICE_CODE || 'AE00000001';
const PUBLISH_INTERVAL = parseInt(process.env.PUBLISH_INTERVAL, 10) || 5000; // 5 seconds default
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

console.log(`🚀 BMC Simulator starting for device: ${DEVICE_CODE}`);
console.log(`📡 Connecting to broker: ${BROKER_URL}`);

const connectOptions = {
  clientId: `bmc-sim-${DEVICE_CODE}-${Math.random().toString(16).substr(2, 6)}`,
  clean: true,
  reconnectPeriod: 2000,
};

if (MQTT_USERNAME) {
  connectOptions.username = MQTT_USERNAME;
  connectOptions.password = MQTT_PASSWORD;
}

const client = mqtt.connect(BROKER_URL, connectOptions);

// Simulated Device State Variables
let temperature = 15.0; // starts warm, cools down
let milkVolume = 820.0; // liters
const TANK_CAPACITY = 5000.0;
let totalKwh = 1245.678;
let gridHours = 450.0;
let dgHours = 24.0;
let comp1RunningHours = 180.0;
let comp2RunningHours = 108.0;
let comp3RunningHours = 0.0;
let agitator1RunningHours = 140.0;
let agitator2RunningHours = 0.0;

// Grid state tracking
let gridStatus = true;
let dgStatus = false;

// Cycle status tracking
let cipStatus = false;
let dispatchStatus = false;
let chillingStatus = false;
let manualDispatchEnabled = true;

// Step counter to orchestrate cycles over time
let step = 0;

// Helper to format Date and Time
function getDTAndTM() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).substring(2);
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return { dt: `${dd}${mm}${yy}`, tm: `${hh}${min}${ss}` };
}

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  // Start periodic publisher
  const intervalId = setInterval(publishTelemetry, PUBLISH_INTERVAL);

  // Subscribe to command topic: /MPDSUB/<UID>
  const commandTopic = `/MPDSUB/${DEVICE_CODE}`;
  client.subscribe(commandTopic, { qos: 1 }, (err) => {
    if (err) {
      console.error(`❌ Failed to subscribe to command topic ${commandTopic}:`, err.message);
    } else {
      console.log(`📥 Subscribed to command topic: ${commandTopic}`);
    }
  });

  client.on('message', (topic, message) => {
    if (topic === commandTopic) {
      const payloadStr = message.toString().trim();
      console.log(`[Serial Monitor] Received payload: ${payloadStr}`);

      // Check if command format starts with * and ends with #
      if (!payloadStr.startsWith('*') || !payloadStr.endsWith('#')) {
        console.warn(`[Serial Monitor] Ignored command: invalid format (must start with * and end with #)`);
        return;
      }

      // Extract body
      const commandBody = payloadStr.slice(1, -1);
      const parts = commandBody.split(',');
      const commandType = parts[0];
      const commandUid = parts[1];

      // Check UID
      if (commandUid !== DEVICE_CODE) {
        console.warn(`[Serial Monitor] Ignored command: UID mismatch (expected ${DEVICE_CODE}, got ${commandUid})`);
        return;
      }

      console.log(`[Serial Monitor] Processing command: ${commandType}`);

      if (commandType === 'DREAD') {
        console.log(`[Serial Monitor] --- Saved Dairy Settings for UID: ${DEVICE_CODE} ---`);
        console.log(`  - Target Temp: 4.0 °C`);
        console.log(`  - Tank Capacity: ${TANK_CAPACITY} L`);
        console.log(`  - Min Tank Volume: 500 L`);
        console.log(`  - Diesel Consumption Rate: 4.0 L/h`);
        console.log(`  - Status: ACTIVE`);
        console.log(`  - Manual Dispatch Enabled: ${manualDispatchEnabled}`);
        console.log(`[Serial Monitor] ---------------------------------------------`);
      } else if (commandType === 'DPROC') {
        const mode = parts[2];
        if (mode === '1') {
          if (manualDispatchEnabled) {
            dispatchStatus = true;
            cipStatus = false;
            chillingStatus = false;
            console.log(`[Serial Monitor] Manual Dispatch request accepted. Starting dispatch process.`);
          } else {
            console.warn(`[Serial Monitor] Manual Dispatch request rejected: Manual Dispatch is disabled.`);
          }
        } else if (mode === '2') {
          dispatchStatus = false;
          console.log(`[Serial Monitor] Dispatch stop request accepted. Stopping dispatch process.`);
        } else if (mode === '3') {
          cipStatus = true;
          dispatchStatus = false;
          chillingStatus = false;
          console.log(`[Serial Monitor] CIP cleaning cycle start request accepted.`);
        } else if (mode === '4') {
          cipStatus = false;
          console.log(`[Serial Monitor] CIP cleaning cycle stop request accepted.`);
        } else if (mode === '5') {
          chillingStatus = true;
          cipStatus = false;
          dispatchStatus = false;
          console.log(`[Serial Monitor] Chilling override start request accepted. Starting chilling process.`);
        } else if (mode === '6') {
          chillingStatus = false;
          console.log(`[Serial Monitor] Chilling override stop request accepted. Stopping chilling process.`);
        } else {
          console.warn(`[Serial Monitor] Unknown dispatch/process mode: ${mode}`);
        }
      } else if (commandType === 'DCT') {
        const channel = parts[2];
        const high = parts[3];
        const low = parts[4];
        console.log(`[Serial Monitor] CT settings updated successfully: Channel: ${channel}, High Limit: ${high} A, Low Limit: ${low} A`);
      } else if (commandType === 'DCTCAL') {
        const channel = parts[2];
        const calCurrent = parts[3];
        console.log(`[Serial Monitor] CT auto-calibration successful: Channel: ${channel}, Reference Current: ${calCurrent} A`);
      } else if (commandType === 'DLEVEL') {
        const mode = parts[2];
        const start = parts[3];
        const span = parts[4];
        const offset = parts[5];
        console.log(`[Serial Monitor] Level sensor parameters updated successfully: Mode: ${mode}, Start: ${start} mm, Span: ${span} mm, Offset: ${offset} mm`);
      } else if (commandType === 'DLEVELCAL') {
        const calHeight = parts[2];
        console.log(`[Serial Monitor] Level sensor auto-calibrated successful. Reference height set to: ${calHeight} mm`);
      } else if (commandType === 'DVOLPT') {
        const pt = parts[2];
        const vol = parts[3];
        const lvl = parts[4];
        console.log(`[Serial Monitor] Strapping point ${pt} configured successfully: Volume: ${vol} L, Sensor Level: ${lvl} mm`);
      } else {
        console.warn(`[Serial Monitor] Unknown command type: ${commandType}`);
      }
    }
  });

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
    if (!dispatchStatus) dispatchStatus = true;
  } else {
    cipStatus = false;
    if (step % dispatchTriggerStep === cycleDuration) {
      dispatchStatus = false;
    }
  }

  // 3. RTD Fault simulation
  // Every 200 steps, RTD sensor has a fault for 10 steps
  const rtdFaultActive = (step % 200 >= 180 && step % 200 < 190);

  // 4. Tank content & temperature behavior
  // mediaType: 0=Empty, 1=Water, 2=Milk
  let mediaType = 1; 
  let processType = 4; // IDLE
  if (cipStatus) {
    milkVolume = 0.0;
    if (temperature < 45.0) temperature += 2.0;
    mediaType = 1; // Water
    processType = 1; // CIP
  } else if (dispatchStatus) {
    if (milkVolume > 0) {
      milkVolume -= TANK_CAPACITY * 0.08; 
      if (milkVolume < 0) milkVolume = 0;
    }
    temperature = 4.0;
    mediaType = milkVolume > 0 ? 1 : 0; // Water
    processType = 2; // DISPATCH
  } else if (chillingStatus) {
    if (milkVolume < TANK_CAPACITY) {
      milkVolume += (Math.random() * 20.0 + 5.0);
      if (milkVolume > TANK_CAPACITY) milkVolume = TANK_CAPACITY;
    }
    const compressorActive = temperature > 4.0;
    if (compressorActive) {
      temperature -= 0.3;
      if (temperature < 3.6) temperature = 3.6;
    } else {
      temperature += 0.03;
    }
    processType = 3; // CHILLING
    mediaType = milkVolume > 0 ? 2 : 0; // Milk (2) if there is volume
  } else {
    if (milkVolume < TANK_CAPACITY) {
      milkVolume += (Math.random() * 20.0 + 5.0);
      if (milkVolume > TANK_CAPACITY) milkVolume = TANK_CAPACITY;
    }

    const compressorActive = temperature > 4.0;
    if (compressorActive) {
      temperature -= 0.3;
      if (temperature < 3.6) temperature = 3.6;
      processType = 3; // CHILLING
    } else {
      temperature += 0.03;
      processType = 4; // IDLE
    }
    mediaType = milkVolume > 0 ? 1 : 0; // Water
  }

  // Override temperature during RTD fault
  const displayTemperature = rtdFaultActive ? 99.9 : temperature;

  // 5. Compressor and Agitator State Calculations
  // 1 = OFF, 2 = ON, 3 = TRIP
  let comp1 = 1;
  let comp2 = 1;
  let comp3 = 1;

  // Simulate Compressor 3 Trip every 150 steps for 15 steps
  const comp3TripActive = (step % 150 >= 130 && step % 150 < 145);

  if (!cipStatus && !rtdFaultActive) {
    if (temperature > 4.0) {
      comp1 = 2; // Compressor 1 ON
    }
    if (temperature > 7.0) {
      comp2 = 2; // Compressor 2 ON
    }
    if (comp3TripActive) {
      comp3 = 3; // Compressor 3 TRIP
    } else if (temperature > 9.0) {
      comp3 = 2; // Compressor 3 ON
    }
  }

  const agi1 = (!cipStatus && !rtdFaultActive && (temperature > 4.0 || step % 4 === 0));
  const agi2 = (!cipStatus && !rtdFaultActive && (temperature > 6.0 || step % 5 === 0));

  // 6. Running Hours Accumulations
  const deltaHours = PUBLISH_INTERVAL / 3600000;
  if (gridStatus) {
    gridHours += deltaHours;
  } else {
    dgHours += deltaHours;
  }

  if (comp1 === 2) comp1RunningHours += deltaHours;
  if (comp2 === 2) comp2RunningHours += deltaHours;
  if (comp3 === 2) comp3RunningHours += deltaHours;
  if (agi1) agitator1RunningHours += deltaHours;
  if (agi2) agitator2RunningHours += deltaHours;

  // 7. Active-low DI: 0 = active, 1 = inactive
  const diPowerGrid = gridStatus ? 0 : 1;
  const diPowerDg = dgStatus ? 0 : 1;
  const diAgi1 = agi1 ? 0 : 1;
  const diAgi2 = agi2 ? 0 : 1;
  const diComp1 = comp1 === 2 ? 0 : 1;
  const diComp2 = comp2 === 2 ? 0 : 1;
  const diComp3 = comp3 === 2 ? 0 : 1;
  const diRtdFault = rtdFaultActive ? 0 : 1;

  const diArray = [diPowerGrid, diPowerDg, diAgi1, diAgi2, diComp1, diComp2, diComp3, diRtdFault];

  // 8. Current sensors (Amps with noise)
  const addNoise = (base) => base > 0 ? Math.round((base + (Math.random() * 0.4 - 0.2)) * 100) / 100 : 0.0;
  const ctComp1 = addNoise(comp1 === 2 ? 5.5 : 0.0);
  const ctComp2 = addNoise(comp2 === 2 ? 5.5 : 0.0);
  const ctComp3 = addNoise(comp3 === 2 ? 5.5 : 0.0);
  const ctAgi = addNoise(agi1 ? 1.2 : 0.0);

  // Send 4 CT channels: CT1=Comp1, CT2=Comp2, CT3=Comp3, CT4=Agi1
  const ctArray = [ctComp1, ctComp2, ctComp3, ctAgi];

  // 9. Power & Energy accumulations based on load
  let activeLoad = 0.1; // Base load kW
  if (comp1 === 2) activeLoad += 2.2;
  if (comp2 === 2) activeLoad += 2.2;
  if (comp3 === 2) activeLoad += 2.2;
  if (agi1) activeLoad += 0.3;
  if (agi2) activeLoad += 0.3;

  totalKwh += activeLoad * deltaHours;

  const levelMm = Math.round((milkVolume / TANK_CAPACITY) * 1500 * 10) / 10;
  const volumeL = Math.round(milkVolume * 10) / 10;

  const { dt, tm } = getDTAndTM();
  const alarmActive = (temperature > 8.0) || comp3 === 3 || rtdFaultActive;

  const payload = {
    TYPE: alarmActive ? "A" : "N",
    UID: DEVICE_CODE,
    DT: dt,
    TM: tm,
    CSQ: 22,
    POWER: {
      GRID: gridStatus,
      DG: dgStatus,
      BATTERY: false
    },
    AGITATOR: [agi1, agi2],
    DI: diArray,
    CT_A: ctArray,
    COMPRESSOR: [comp1, comp2, comp3],
    TEMP_C: Math.round(displayTemperature * 100) / 100,
    RTD_FAULT: rtdFaultActive,
    LEVEL_MM: levelMm,
    VOLUME_L: volumeL,
    KWH: Math.round(totalKwh * 1000) / 1000,
    MEDIA: mediaType,
    PROCESS: processType,
    STATUS: {
      CHILLING: processType === 3,
      DISPATCH: processType === 2,
      CIP: processType === 1,
      CIP_NEEDED: step > 100 && processType !== 1
    },
    ALARM: {
      HIGH_TEMP: temperature > 8.0,
      COMP_TRIP: comp3 === 3,
      BUZZER: alarmActive,
      BUZZER_PAUSED: false
    },
    NETWORK: {
      REGISTERED: true,
      DATA: true,
      MQTT: true
    }
  };

  const topic = `MPDSET/1/${DEVICE_CODE}`;
  client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
    if (err) {
      console.error(`❌ Failed to publish to ${topic}:`, err.message);
    } else {
      console.log(`📤 [${step}] Published to ${topic}: TYPE=${payload.TYPE}, Temp=${payload.TEMP_C}°C, Vol=${payload.VOLUME_L}L, PROCESS=${processType}`);
    }
  });
}
