# Implementation Plan — Diagnostics Enums Mapping & Display

Implement clear name-to-value mapping for industrial telemetry parameters (`TYPE`, `DI`, `COMPRESSOR`, `MEDIA`, `PROCESS`, `KWH`) on both the backend and frontend.

## Parameters Mapping Reference

| Metric | Raw Variable | Value Mapping |
|--------|--------------|---------------|
| **Packet Type** | `TYPE` | `N` = Normal, `A` = Alarm, `O` = On-demand/Event |
| **Digital Inputs** | `DI` | Active-low: `0` = ACTIVE, `1` = INACTIVE |
| **Compressor Status** | `COMPRESSOR` | `1` = OFF, `2` = ON, `3` = TRIP |
| **Media Type** | `MEDIA` | `0` = EMPTY, `1` = WATER, `2` = MILK |
| **Process Status** | `PROCESS` | `0` = EMPTY, `1` = CIP, `2` = DISPATCH, `3` = CHILLING, `4` = IDLE |
| **Energy Consumption** | `KWH` | Modbus value directly read from meter |

---

## Proposed Changes

### 1. Backend Mapping Extensions

#### [MODIFY] [mqtt.service.js](file:///d:/amitelectric/milk/backend/src/services/mqtt.service.js)
* Update `transformNewTelemetry()` method to include these raw parameters in the output telemetry payload before saving/validation:
  * `packetType`: `payload.TYPE`
  * `process`: `payload.PROCESS`
  * `compressorStates`: `payload.COMPRESSOR`

---

### 2. Frontend Diagnostic Panel Integration

#### [MODIFY] [DeviceDetailPage.jsx](file:///d:/amitelectric/milk/frontend/src/pages/devices/DeviceDetailPage.jsx)
* Add a **"Diagnostic Telemetry Details"** section under the actuators panel.
* Display the current state values alongside their respective text labels dynamically:
  * Map `packetType` -> human readable description.
  * Map `mediaType` -> EMPTY, WATER, MILK with matching badges.
  * Map `process` -> EMPTY, CIP, DISPATCH, CHILLING, IDLE.
  * Render an interactive grid of **Digital Inputs (DI0 - DI7)** showing their current state (ACTIVE for low `0`, INACTIVE for high `1`).
* Update the compressor details list to map status values `1`, `2`, `3` to OFF, ON, TRIP.

---

## Verification Plan

### Manual Verification
1. We will update the logic verification test script in `verify_logic.js` to verify these fields are correctly parsed.
2. We will inspect the docker container logs to verify backend startup success.
