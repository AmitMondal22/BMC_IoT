const deviceService = require('./device.service');
const response = require('../../utils/response');

class DeviceController {
  async list(req, reply) {
    const r = await deviceService.list(req.query, req.userId, req.userRole);
    return response.paginated(reply, r.devices, r.pagination);
  }

  async getById(req, reply) {
    return response.success(reply, await deviceService.getById(req.params.id));
  }

  async create(req, reply) {
    return response.created(reply, await deviceService.create(req.body));
  }

  async update(req, reply) {
    return response.success(reply, await deviceService.update(req.params.id, req.body), 'Updated');
  }

  async delete(req, reply) {
    await deviceService.delete(req.params.id);
    return response.success(reply, null, 'Deleted');
  }

  async calibrate(req, reply) {
    const cal = await deviceService.calibrate(req.params.id, req.body, req.userId);
    return response.created(reply, cal, 'Calibration saved');
  }

  async getCalibrations(req, reply) {
    const cals = await deviceService.getCalibrations(req.params.id);
    return response.success(reply, cals);
  }

  async getAlertConfigs(req, reply) {
    const configs = await deviceService.getAlertConfigs(req.params.id);
    return response.success(reply, configs);
  }

  async updateAlertConfigs(req, reply) {
    const result = await deviceService.updateAlertConfigs(req.params.id, req.body, req.userId);
    return response.success(reply, result, 'Alert configurations updated');
  }

  async uploadSnapshot(req, reply) {
    const data = await req.file();
    if (!data) {
      throw new Error('No snapshot image file uploaded');
    }

    const remarks = data.fields.remarks?.value || '';
    const latitude = data.fields.latitude?.value ? parseFloat(data.fields.latitude.value) : null;
    const longitude = data.fields.longitude?.value ? parseFloat(data.fields.longitude.value) : null;
    const capturedAt = data.fields.capturedAt?.value || new Date().toISOString();

    const fileBuffer = await data.toBuffer();
    const filename = `${req.params.id}_${Date.now()}_snapshot.jpg`;

    const result = await deviceService.saveSnapshot(req.params.id, fileBuffer, filename, {
      remarks,
      latitude,
      longitude,
      capturedAt
    });

    return response.success(reply, result, 'Snapshot uploaded successfully');
  }

  async sendCommand(req, reply) {
    const { deviceCode } = req.params;
    const { command } = req.body;

    if (!command) {
      throw new Error('Command content is required');
    }

    await deviceService.sendCommand(deviceCode, command);
    return response.success(reply, null, `Command published successfully to /MPDSUB/${deviceCode}`);
  }
}

module.exports = new DeviceController();
