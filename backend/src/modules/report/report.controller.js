const reportService = require('./report.service');
const response = require('../../utils/response');

class ReportController {
  async getDailyLog(request, reply) {
    const { deviceId, date, startDate, endDate } = request.query;
    const start = startDate || date;
    const end = endDate || date;
    if (!deviceId || !start) {
      return reply.status(400).send({ success: false, message: 'deviceId and date/startDate are required query parameters' });
    }
    const data = await reportService.getDailyLog(deviceId, start, end);
    return response.success(reply, data, 'Daily log fetched successfully');
  }

  async getCyclesReport(request, reply) {
    const { deviceId, date, startDate, endDate } = request.query;
    const start = startDate || date;
    const end = endDate || date;
    if (!deviceId || !start) {
      return reply.status(400).send({ success: false, message: 'deviceId and date/startDate are required query parameters' });
    }
    const data = await reportService.getCyclesReport(deviceId, start, end);
    return response.success(reply, data, 'Cycles and efficiency report fetched successfully');
  }

  async getFullDailyReport(request, reply) {
    const { deviceId, date, startDate, endDate } = request.query;
    const start = startDate || date;
    const end = endDate || date;
    if (!deviceId || !start) {
      return reply.status(400).send({ success: false, message: 'deviceId and date/startDate are required query parameters' });
    }
    const data = await reportService.getFullDailyReport(deviceId, start, end);
    return response.success(reply, data, 'Full daily report fetched successfully');
  }

  async emailDailyReport(request, reply) {
    const { deviceId, date, email } = request.body;
    if (!deviceId || !date || !email) {
      return reply.status(400).send({ success: false, message: 'deviceId, date, and email are required in request body' });
    }
    await reportService.emailDailyReport(deviceId, date, email);
    return response.success(reply, null, 'Daily report email dispatched successfully');
  }
}

module.exports = new ReportController();
