# Implementation Plan — Simulator Updates & MQTT Telemetry Integration

Update the BMC simulator to publish the new JSON telemetry packet format, subscribe to and parse serial monitor commands, and update the backend to consume, map, and log this data seamlessly.

## User Review Required

> [!IMPORTANT]
> **New Device UID Registration**:
> We will add the device code `AE00000001` (from the user request packet) to the database seeders so it is registered in the database, allowing telemetry from this UID to be saved and processed.
> We will also make the simulator default to `AE00000001` but fall back to the environment variable `DEVICE_CODE`.

> [!TIP]
> **Serial Command Publish Helper**:
> To make it easy to trigger and test the serial commands on the simulator (such as `*DREAD,<UID>#` or `*DPROC,<UID>,1#`), we will add a backend API endpoint `POST /api/devices/code/:deviceCode/command` that publishes custom commands to the MQTT command topic `/MPDSUB/<deviceCode>`.

---

## Proposed Changes

### 1. Simulator Changes

#### [MODIFY] [index.js](file:///d:/amitelectric/milk/simulator/index.js)
- Update the default `DEVICE_CODE` to `AE00000001`.
- Update the periodic publisher to construct and send the packet according to the exact JSON schema provided:
  - Format `DT` as `DDMMYY` and `TM` as `HHMMSS`.
  - Calculate raw values for `DI`, `CT_A`, `COMPRESSOR` states (ON = 2, OFF = 1, TRIP = 3), `AGITATOR` states, and process types (`PROCESS`).
  - Calculate `LEVEL_MM` based on tank capacity linear mapping.
  - Publish telemetry to `MPDSET/1/<UID>`.
- Subscribe to `/MPDSUB/<UID>` to receive incoming commands.
- Handle received payloads, implementing serial parsing rules:
  - Print the payload to simulate a serial monitor.
  - Reject payloads not starting with `*` or ending with `#`.
  - Validate that the payload UID matches the device's UID.
  - Support `*DREAD,<UID>#` command to print mock dairy settings on the console.
  - Support `*DPROC,<UID>,1#` to start manual dispatch and `*DPROC,<UID>,2#` to stop dispatch.

---

### 2. Backend Integration

#### [MODIFY] [constants.js](file:///d:/amitelectric/milk/backend/src/utils/constants.js)
- Add `MPDSET/1/+` as a telemetry subscription topic pattern `NEW_TELEMETRY`.

#### [MODIFY] [mqtt.service.js](file:///d:/amitelectric/milk/backend/src/services/mqtt.service.js)
- Subscribe to the new telemetry topic pattern on startup.
- In the global `message` event handler:
  - Detect if the topic is a new format topic (contains `MPDSET/1/`).
  - Extract the `deviceCode` (UID) from the topic path.
  - Decode the packet, validate it, and transform/map its fields into the format expected by the existing `handleTelemetry` pipeline:
    - Map `UID` -> `deviceId`
    - Combine `DT` and `TM` -> `timestamp`
    - Map `TEMP_C` -> `temperature`
    - Map `VOLUME_L` -> `milkVolume`
    - Calculate `tankLevel` as percentage
    - Map `KWH` -> `kwh`
    - Map `MEDIA` -> `mediaType`
    - Map `DI`, `COMPRESSOR`, `AGITATOR` arrays into existing fields, including dynamic computation of compressor and agitator running hours based on state time delta.
  - Call the standard telemetry handler with the transformed object so the existing dashboard, InfluxDB, PostgreSQL databases, and real-time cache stay fully operational.

#### [MODIFY] [20240101000001-super-admin.js](file:///d:/amitelectric/milk/backend/src/db/seeders/20240101000001-super-admin.js)
- Add the device `AE00000001` (Simulated BMC Bangalore) as a default seeded active device alongside `123456`.

#### [MODIFY] [device.routes.js](file:///d:/amitelectric/milk/backend/src/modules/device/device.routes.js)
- Add a new route `POST /code/:deviceCode/command` to publish command payloads.

#### [MODIFY] [device.controller.js](file:///d:/amitelectric/milk/backend/src/modules/device/device.controller.js)
- Add controller action `sendCommand` to handle incoming HTTP requests and delegate them to the device service.

#### [MODIFY] [device.service.js](file:///d:/amitelectric/milk/backend/src/modules/device/device.service.js)
- Add a service method `sendCommand(deviceCode, command)` that uses the MQTT client to publish the command string to `/MPDSUB/${deviceCode}`.

---

## Verification Plan

### Automated/Manual Scripted Verification
1. We will write a validation test script under `scratch/test-mqtt-integration.js` to:
   - Establish a temporary subscriber to verify simulator publications.
   - Publish mock commands to `/MPDSUB/AE00000001` and verify simulator output in logs.
   - Run the simulator and verify logs.
2. We will run the backend dev server and verify telemetry values are parsed and loaded correctly into the PostgreSQL and InfluxDB instances.
