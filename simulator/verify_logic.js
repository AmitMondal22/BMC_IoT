// Off-line Logic Verification script for Antigravity integration
const assert = require('assert');

console.log('🧪 Starting off-line unit verification...');

// ==========================================
// 1. Mocking & Testing Telemetry Transformation
// ==========================================

const mockDevice = {
  deviceCode: 'AE00000001',
  tankCapacity: 5000.0,
  lastTelemetry: {
    timestamp: new Date(new Date() - 30 * 1000).toISOString(),
    compressor1: { status: true, runningHours: 180.0 },
    compressor2: { status: false, runningHours: 108.0 },
    compressor3: { status: false, runningHours: 0.0 },
    agitator1: { status: true, runningHours: 140.0 },
    agitator2: { status: false, runningHours: 0.0 },
    gridHours: 450.0,
    dgHours: 24.0
  }
};

const testPacket = {
  "TYPE":"N", "UID":"AE00000001", "DT":"160726", "TM":"103015", "CSQ":22,
  "POWER":{"GRID":true,"DG":false,"BATTERY":false},
  "AGITATOR":[true,false],
  "DI":[0,1,0,1,0,1,1,1],
  "CT_A":[3.20,0.00,0.00,0.00],
  "COMPRESSOR":[2,1,1],
  "TEMP_C":4.20, "RTD_FAULT":false,
  "LEVEL_MM":650.0, "VOLUME_L":820.0, "KWH":1245.678,
  "MEDIA":2, "PROCESS":3,
  "STATUS":{"CHILLING":true,"DISPATCH":false,"CIP":false,"CIP_NEEDED":false},
  "ALARM":{"HIGH_TEMP":false,"COMP_TRIP":false,"BUZZER":false,"BUZZER_PAUSED":false},
  "NETWORK":{"REGISTERED":true,"DATA":true,"MQTT":true}
};

function transformNewTelemetry(payload, device) {
  const capacity = device ? device.tankCapacity : 5000;
  
  let timestamp = new Date();
  if (payload.DT && payload.TM) {
    const day = parseInt(payload.DT.substring(0, 2), 10);
    const month = parseInt(payload.DT.substring(2, 4), 10) - 1;
    const year = 2000 + parseInt(payload.DT.substring(4, 6), 10);
    const hours = parseInt(payload.TM.substring(0, 2), 10);
    const minutes = parseInt(payload.TM.substring(2, 4), 10);
    const seconds = parseInt(payload.TM.substring(4, 6), 10);
    
    const parsedDate = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(parsedDate.getTime())) {
      timestamp = parsedDate;
    }
  }
  
  const comp1Val = Array.isArray(payload.COMPRESSOR) && payload.COMPRESSOR[0] !== undefined ? payload.COMPRESSOR[0] : 1;
  const comp2Val = Array.isArray(payload.COMPRESSOR) && payload.COMPRESSOR[1] !== undefined ? payload.COMPRESSOR[1] : 1;
  const comp3Val = Array.isArray(payload.COMPRESSOR) && payload.COMPRESSOR[2] !== undefined ? payload.COMPRESSOR[2] : 1;

  const agitator1Val = Array.isArray(payload.AGITATOR) && payload.AGITATOR[0] !== undefined ? payload.AGITATOR[0] : false;
  const agitator2Val = Array.isArray(payload.AGITATOR) && payload.AGITATOR[1] !== undefined ? payload.AGITATOR[1] : false;

  let compressor1Hours = 0;
  let compressor2Hours = 0;
  let compressor3Hours = 0;
  let agitator1Hours = 0;
  let agitator2Hours = 0;
  let gridHours = 0;
  let dgHours = 0;

  const lastTelemetry = device ? device.lastTelemetry : null;
  if (lastTelemetry) {
    compressor1Hours = lastTelemetry.compressor1?.runningHours || 0;
    compressor2Hours = lastTelemetry.compressor2?.runningHours || 0;
    compressor3Hours = lastTelemetry.compressor3?.runningHours || 0;
    agitator1Hours = lastTelemetry.agitator1?.runningHours || 0;
    agitator2Hours = lastTelemetry.agitator2?.runningHours || 0;
    gridHours = lastTelemetry.gridHours || 0;
    dgHours = lastTelemetry.dgHours || 0;

    const timeDiffHrs = (timestamp - new Date(lastTelemetry.timestamp)) / 3600000;
    if (timeDiffHrs > 0 && timeDiffHrs < 1.0) {
      if (comp1Val === 2) compressor1Hours += timeDiffHrs;
      if (comp2Val === 2) compressor2Hours += timeDiffHrs;
      if (comp3Val === 2) compressor3Hours += timeDiffHrs;
      if (agitator1Val) agitator1Hours += timeDiffHrs;
      if (agitator2Val) agitator2Hours += timeDiffHrs;
      if (payload.POWER?.GRID) gridHours += timeDiffHrs;
      if (payload.POWER?.DG) dgHours += timeDiffHrs;
    }
  }

  const volume = payload.VOLUME_L !== undefined ? payload.VOLUME_L : 0;
  const tankLevel = capacity > 0 ? Math.round((volume / capacity) * 100) : 0;

  const getCompStateName = (val) => {
    if (val === 2) return 'ON';
    if (val === 3) return 'TRIP';
    return 'OFF';
  };

  const getProcessName = (val) => {
    const names = ['EMPTY', 'CIP', 'DISPATCH', 'CHILLING', 'IDLE'];
    return names[val] || 'UNKNOWN';
  };

  const getMediaName = (val) => {
    const names = ['EMPTY', 'WATER', 'MILK'];
    return names[val] || 'UNKNOWN';
  };

  const getTypeName = (val) => {
    if (val === 'N') return 'Normal';
    if (val === 'A') return 'Alarm';
    if (val === 'O') return 'On-demand/Event';
    return 'Unknown';
  };

  const getDiName = (index) => {
    const names = [
      'Power Grid Status',
      'Diesel Generator Status',
      'Agitator 1 Status',
      'Agitator 2 Status',
      'Compressor 1 Status',
      'Compressor 2 Status',
      'Compressor 3 Status',
      'RTD Fault Status'
    ];
    return names[index] || `DI Pin ${index}`;
  };

  return {
    deviceId: payload.UID || device?.deviceCode || 'unknown',
    timestamp: timestamp.toISOString(),
    temperature: payload.TEMP_C !== undefined ? payload.TEMP_C : null,
    milkVolume: volume,
    tankLevel: Math.min(100, Math.max(0, tankLevel)),
    compressor1: { 
      status: comp1Val === 2, 
      runningHours: Math.round(compressor1Hours * 10) / 10,
      state: comp1Val,
      stateName: getCompStateName(comp1Val)
    },
    compressor2: { 
      status: comp2Val === 2, 
      runningHours: Math.round(compressor2Hours * 10) / 10,
      state: comp2Val,
      stateName: getCompStateName(comp2Val)
    },
    compressor3: { 
      status: comp3Val === 2, 
      runningHours: Math.round(compressor3Hours * 10) / 10,
      state: comp3Val,
      stateName: getCompStateName(comp3Val)
    },
    agitator1: { status: agitator1Val, runningHours: Math.round(agitator1Hours * 10) / 10 },
    agitator2: { status: agitator2Val, runningHours: Math.round(agitator2Hours * 10) / 10 },
    gridStatus: payload.POWER?.GRID || false,
    gridHours: Math.round(gridHours * 10) / 10,
    dgStatus: payload.POWER?.DG || false,
    dgHours: Math.round(dgHours * 10) / 10,
    kwh: payload.KWH !== undefined ? payload.KWH : null,
    cipStatus: payload.STATUS?.CIP || false,
    dispatchStatus: payload.STATUS?.DISPATCH || false,
    milkMode: payload.STATUS?.CHILLING || false,
    waterMode: payload.STATUS?.CIP || false,
    mediaType: payload.MEDIA !== undefined ? payload.MEDIA : 0,
    mediaName: getMediaName(payload.MEDIA),
    processType: payload.PROCESS !== undefined ? payload.PROCESS : 4,
    processName: getProcessName(payload.PROCESS),
    packetType: payload.TYPE || 'N',
    packetTypeName: getTypeName(payload.TYPE),
    fat: payload.MEDIA === 2 ? 4.2 : 0.0,
    snf: payload.MEDIA === 2 ? 8.5 : 0.0,
    levelMm: payload.LEVEL_MM !== undefined ? payload.LEVEL_MM : null,
    rtdFault: payload.RTD_FAULT || false,
    digitalInputs: Array.isArray(payload.DI) ? payload.DI.map((val, idx) => ({
      pin: idx,
      name: getDiName(idx),
      value: val,
      isActive: val === 0
    })) : [],
    rawDi: payload.DI || [],
    rawCtA: payload.CT_A || [],
  };
}

console.log('  Testing telemetry transformation...');
const transformed = transformNewTelemetry(testPacket, mockDevice);

assert.strictEqual(transformed.deviceId, 'AE00000001');
assert.strictEqual(transformed.temperature, 4.20);
assert.strictEqual(transformed.milkVolume, 820.0);
assert.strictEqual(transformed.tankLevel, 16);
assert.strictEqual(transformed.compressor1.status, true);
assert.strictEqual(transformed.compressor2.status, false);
assert.strictEqual(transformed.agitator1.status, true);
assert.strictEqual(transformed.gridStatus, true);
assert.strictEqual(transformed.dgStatus, false);
assert.strictEqual(transformed.kwh, 1245.678);
assert.strictEqual(transformed.mediaType, 2);
assert.strictEqual(transformed.cipStatus, false);
assert.strictEqual(transformed.dispatchStatus, false);
assert.strictEqual(transformed.milkMode, true);
assert.strictEqual(transformed.levelMm, 650.0);

console.log('  ✅ Telemetry transformation tests PASSED');

// ==========================================
// 2. Testing Simulator Command Parser Logic
// ==========================================
console.log('  Testing simulator command parser logic...');

const DEVICE_CODE = 'AE00000001';
let dispatchStatus = false;
let cipStatus = false;
const manualDispatchEnabled = true;

function handleCommand(payloadStr) {
  const output = [];
  const log = (...msg) => output.push(msg.join(' '));

  if (!payloadStr.startsWith('*') || !payloadStr.endsWith('#')) {
    log(`Ignored command: invalid format`);
    return output;
  }

  const commandBody = payloadStr.slice(1, -1);
  const parts = commandBody.split(',');
  const commandType = parts[0];
  const commandUid = parts[1];

  if (commandUid !== DEVICE_CODE) {
    log(`Ignored command: UID mismatch`);
    return output;
  }

  log(`Processing command: ${commandType}`);

  if (commandType === 'DREAD') {
    log(`Saved Dairy Settings for UID: ${DEVICE_CODE}`);
  } else if (commandType === 'DPROC') {
    const mode = parts[2];
    if (mode === '1') {
      if (manualDispatchEnabled) {
        dispatchStatus = true;
        cipStatus = false;
        log(`Manual Dispatch request accepted`);
      } else {
        log(`Manual Dispatch request rejected`);
      }
    } else if (mode === '2') {
      dispatchStatus = false;
      log(`Dispatch stop request accepted`);
    } else if (mode === '3') {
      cipStatus = true;
      dispatchStatus = false;
      log(`CIP cleaning cycle start request accepted`);
    } else if (mode === '4') {
      cipStatus = false;
      log(`CIP cleaning cycle stop request accepted`);
    }
  } else if (commandType === 'DCT') {
    log(`CT settings updated successfully: Channel: ${parts[2]}, High Limit: ${parts[3]} A, Low Limit: ${parts[4]} A`);
  } else if (commandType === 'DCTCAL') {
    log(`CT auto-calibration successful: Channel: ${parts[2]}, Reference Current: ${parts[3]} A`);
  } else if (commandType === 'DLEVEL') {
    log(`Level sensor parameters updated successfully: Mode: ${parts[2]}, Start: ${parts[3]} mm, Span: ${parts[4]} mm, Offset: ${parts[5]} mm`);
  } else if (commandType === 'DLEVELCAL') {
    log(`Level sensor auto-calibrated successful. Reference height set to: ${parts[2]} mm`);
  } else if (commandType === 'DVOLPT') {
    log(`Strapping point ${parts[2]} configured successfully: Volume: ${parts[3]} L, Sensor Level: ${parts[4]} mm`);
  }
  return output;
}

// Test DREAD
let logs = handleCommand(`*DREAD,${DEVICE_CODE}#`);
assert.deepStrictEqual(logs, ['Processing command: DREAD', `Saved Dairy Settings for UID: ${DEVICE_CODE}`]);

// Test DPROC 1 & 2 (Dispatch Start / Stop)
dispatchStatus = false;
logs = handleCommand(`*DPROC,${DEVICE_CODE},1#`);
assert.deepStrictEqual(logs, ['Processing command: DPROC', 'Manual Dispatch request accepted']);
assert.strictEqual(dispatchStatus, true);

logs = handleCommand(`*DPROC,${DEVICE_CODE},2#`);
assert.deepStrictEqual(logs, ['Processing command: DPROC', 'Dispatch stop request accepted']);
assert.strictEqual(dispatchStatus, false);

// Test DPROC 3 & 4 (CIP Start / Stop)
cipStatus = false;
logs = handleCommand(`*DPROC,${DEVICE_CODE},3#`);
assert.deepStrictEqual(logs, ['Processing command: DPROC', 'CIP cleaning cycle start request accepted']);
assert.strictEqual(cipStatus, true);

logs = handleCommand(`*DPROC,${DEVICE_CODE},4#`);
assert.deepStrictEqual(logs, ['Processing command: DPROC', 'CIP cleaning cycle stop request accepted']);
assert.strictEqual(cipStatus, false);

// Test DCT Thresholds
logs = handleCommand(`*DCT,${DEVICE_CODE},1,2.00,1.50#`);
assert.deepStrictEqual(logs, ['Processing command: DCT', 'CT settings updated successfully: Channel: 1, High Limit: 2.00 A, Low Limit: 1.50 A']);

// Test DCTCAL Auto Calibration
logs = handleCommand(`*DCTCAL,${DEVICE_CODE},1,5.000#`);
assert.deepStrictEqual(logs, ['Processing command: DCTCAL', 'CT auto-calibration successful: Channel: 1, Reference Current: 5.000 A']);

// Test DLEVEL Start/Span
logs = handleCommand(`*DLEVEL,${DEVICE_CODE},0,1500,1500,0#`);
assert.deepStrictEqual(logs, ['Processing command: DLEVEL', 'Level sensor parameters updated successfully: Mode: 0, Start: 1500 mm, Span: 1500 mm, Offset: 0 mm']);

// Test DLEVELCAL Level Calibration
logs = handleCommand(`*DLEVELCAL,${DEVICE_CODE},12.000#`);
assert.deepStrictEqual(logs, ['Processing command: DLEVELCAL', 'Level sensor auto-calibrated successful. Reference height set to: 12.000 mm']);

// Test DVOLPT Volume point 1
logs = handleCommand(`*DVOLPT,${DEVICE_CODE},1,0,0#`);
assert.deepStrictEqual(logs, ['Processing command: DVOLPT', 'Strapping point 1 configured successfully: Volume: 0 L, Sensor Level: 0 mm']);

console.log('  ✅ Simulator command parser tests PASSED');
console.log('\n🎉 ALL LOGIC VERIFICATIONS COMPLETED SUCCESSFULLY!');
