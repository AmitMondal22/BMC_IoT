import api from './axios';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  refresh: (data) => api.post('/auth/refresh', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  getProfile: () => api.get('/auth/profile'),
  sendOTP: (data) => api.post('/auth/otp/send', data),
  verifyOTP: (data) => api.post('/auth/otp/verify', data),
};

export const userAPI = {
  list: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
  assignDevices: (id, data) => api.post(`/users/${id}/assign-devices`, data),
  forceLogout: (id) => api.post(`/users/${id}/force-logout`),
  getLoginHistory: (id) => api.get(`/users/${id}/login-history`),
};

export const organizationAPI = {
  list: (params) => api.get('/organizations', { params }),
  getById: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  delete: (id) => api.delete(`/organizations/${id}`),
};

export const regionAPI = {
  list: (params) => api.get('/regions', { params }),
  getById: (id) => api.get(`/regions/${id}`),
  create: (data) => api.post('/regions', data),
  update: (id, data) => api.put(`/regions/${id}`, data),
  delete: (id) => api.delete(`/regions/${id}`),
};



export const routeAPI = {
  list: (params) => api.get('/routes', { params }),
  getById: (id) => api.get(`/routes/${id}`),
  create: (data) => api.post('/routes', data),
  update: (id, data) => api.put(`/routes/${id}`, data),
  delete: (id) => api.delete(`/routes/${id}`),
};

export const deviceAPI = {
  list: (params) => api.get('/devices', { params }),
  getById: (id) => api.get(`/devices/${id}`),
  create: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  delete: (id) => api.delete(`/devices/${id}`),
  calibrate: (id, data) => api.post(`/devices/${id}/calibrate`, data),
  getCalibrations: (id) => api.get(`/devices/${id}/calibrations`),
  getAlertConfigs: (id) => api.get(`/devices/${id}/alert-configs`),
  updateAlertConfigs: (id, data) => api.put(`/devices/${id}/alert-configs`, data),
  sendCommand: (deviceCode, command) => api.post(`/devices/code/${deviceCode}/command`, { command }),
};

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getDevices: () => api.get('/dashboard/devices'),
  getAlerts: (params) => api.get('/dashboard/alerts', { params }),
};

export const alertAPI = {
  list: (params) => api.get('/alerts', { params }),
  acknowledge: (id) => api.put(`/alerts/${id}/acknowledge`),
  acknowledgeAll: () => api.put('/alerts/acknowledge-all'),
};

export const reportAPI = {
  getDailyLog: (params) => api.get('/reports/daily-log', { params }),
  getCycles: (params) => api.get('/reports/cycles', { params }),
  getFullDaily: (params) => api.get('/reports/full-daily', { params }),
  emailDailyLog: (data) => api.post('/reports/email-daily-log', data),
};

export const auditAPI = {
  list: (params) => api.get('/audit-logs', { params }),
};
