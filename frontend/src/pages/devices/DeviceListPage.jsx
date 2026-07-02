import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { deviceAPI, routeAPI, userAPI } from '../../api';
import { Plus, Search, Monitor, Thermometer, Droplets, Eye, Edit, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function DeviceListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const urlFilter = searchParams.get('filter') || 'all';

  const [devices, setDevices] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(urlFilter);
  const [showModal, setShowModal] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  
  const [form, setForm] = useState({
    deviceCode: '', deviceName: '', routeId: '',
    tankCapacity: 5000, minTankVolume: 500,
    setTemperature: 4.0, dieselConsumption: 12, status: 'active',
    userIds: [], alertEmails: '',
  });

  // Sync filter with URL parameter if it changes
  useEffect(() => {
    if (searchParams.get('filter')) {
      setFilter(searchParams.get('filter'));
    }
  }, [searchParams]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const params = { search, limit: 100 };
      const res = await deviceAPI.list(params);
      
      let filtered = res.data;

      // Apply client-side filters
      if (filter === 'online') {
        filtered = filtered.filter(d => d.connectionStatus === 'online');
      } else if (filter === 'offline') {
        filtered = filtered.filter(d => d.connectionStatus === 'offline');
      } else if (filter === 'cip') {
        filtered = filtered.filter(d => d.lastTelemetry?.cipStatus === true);
      } else if (filter === 'dispatch') {
        filtered = filtered.filter(d => d.lastTelemetry?.dispatchStatus === true);
      } else if (filter === 'high-temp') {
        filtered = filtered.filter(d => d.lastTelemetry?.milkTemperature > 8);
      } else if (filter === 'power-fail') {
        filtered = filtered.filter(d => d.lastTelemetry && !d.lastTelemetry.gridStatus);
      } else if (filter === 'dg-run') {
        filtered = filtered.filter(d => d.lastTelemetry?.dgStatus === true);
      }

      setDevices(filtered);
    } catch { toast.error('Failed to fetch devices'); }
    finally { setLoading(false); }
  };

  const fetchRoutes = async () => {
    try {
      const res = await routeAPI.list({ limit: 100 });
      setRoutes(res.data);
    } catch (err) { console.log('Routes error', err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await userAPI.list({ limit: 100 });
      setUsers(res.data);
    } catch (err) { console.log('Users error', err); }
  };

  useEffect(() => {
    fetchDevices();
    fetchRoutes();
    fetchUsers();
  }, [search, filter]);

  const resetForm = () => setForm({
    deviceCode: '', deviceName: '', routeId: '',
    tankCapacity: 5000, minTankVolume: 500,
    setTemperature: 4.0, dieselConsumption: 12, status: 'active',
    userIds: [], alertEmails: '',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        tankCapacity: parseFloat(form.tankCapacity),
        minTankVolume: parseFloat(form.minTankVolume),
        setTemperature: parseFloat(form.setTemperature),
        dieselConsumption: parseFloat(form.dieselConsumption),
        routeId: form.routeId || null,
        userIds: form.userIds || [],
        metadata: {
          alertEmails: form.alertEmails.split(',').map(e => e.trim()).filter(Boolean).slice(0, 5)
        }
      };

      if (editDevice) {
        await deviceAPI.update(editDevice.id, payload);
        toast.success('Device updated successfully');
      } else {
        await deviceAPI.create(payload);
        toast.success('Device registered successfully');
      }
      setShowModal(false); setEditDevice(null); resetForm(); fetchDevices();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to save'); }
  };

  const handleEditClick = (device) => {
    setEditDevice(device);
    setForm({
      deviceCode: device.deviceCode,
      deviceName: device.deviceName,
      routeId: device.routeId || '',
      tankCapacity: device.tankCapacity,
      minTankVolume: device.minTankVolume,
      setTemperature: device.setTemperature,
      dieselConsumption: device.dieselConsumption || 0,
      status: device.status,
      userIds: device.users ? device.users.map(u => u.id) : [],
      alertEmails: device.metadata?.alertEmails ? device.metadata.alertEmails.join(', ') : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this device?')) return;
    try { await deviceAPI.delete(id); toast.success('Device deleted'); fetchDevices(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-t-primary">Devices</h1>
          <p className="text-sm text-t-secondary">Manage BMC devices and IoT controllers</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditDevice(null); resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium shadow-button hover:bg-brand-dark hover:scale-105 transition-all"
          >
            <Plus size={18} /> Add Device
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-t-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search devices..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-surface-card border border-edge text-t-primary placeholder:text-t-muted outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'online', 'offline', 'cip', 'dispatch', 'high-temp', 'power-fail', 'dg-run'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                filter === f
                  ? 'bg-brand text-white shadow-button'
                  : 'bg-surface-card text-t-secondary border border-edge hover:border-brand/30'
              }`}
            >
              {f.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Device Table View */}
      <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-surface-dim border-b border-edge text-xs font-semibold uppercase tracking-wider text-t-secondary">
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Device Info</th>
                <th className="px-5 py-4">Route / Location</th>
                <th className="px-5 py-4">Milk Temp</th>
                <th className="px-5 py-4">Milk Volume</th>
                <th className="px-5 py-4">Power Source</th>
                <th className="px-5 py-4">Device Mode</th>
                <th className="px-5 py-4">Last Seen</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge text-t-primary">
              {devices.map((device) => {
                const telemetry = device.liveTelemetry || device.lastTelemetry || {};
                const isOnline = device.connectionStatus === 'online';
                
                // Determine Mode
                let modeText = 'Cooling';
                let modeClass = 'bg-surface-dim text-t-secondary';
                if (telemetry.cipStatus) {
                  modeText = 'CIP';
                  modeClass = 'bg-blue-500/15 text-blue-500 font-bold';
                } else if (telemetry.dispatchStatus) {
                  modeText = 'DISPATCH';
                  modeClass = 'bg-brand/15 text-brand font-bold';
                }

                // Power display
                let powerText = 'GRID OK';
                let powerClass = 'bg-emerald/15 text-emerald';
                if (telemetry.dgStatus) {
                  powerText = 'DG RUNNING';
                  powerClass = 'bg-amber/15 text-amber';
                } else if (telemetry.gridStatus === false) {
                  powerText = 'POWER FAIL';
                  powerClass = 'bg-rose/15 text-rose';
                }

                // Format temperature
                const temp = telemetry.milkTemperature;
                const tempText = temp != null ? `${temp.toFixed(1)}°C` : '--';
                const isHighTemp = temp != null && temp > 8;

                // Format volume
                const vol = telemetry.milkVolume;
                const volText = vol != null ? `${vol.toFixed(0)} L` : '--';
                const capacity = device.tankCapacity || 0;
                const levelPercent = vol != null && capacity > 0 ? Math.round((vol / capacity) * 100) : 0;

                // Format last seen
                let lastSeenText = 'Never';
                if (device.lastSeen) {
                  const date = new Date(device.lastSeen);
                  lastSeenText = date.toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                }

                return (
                  <tr
                    key={device.id}
                    onClick={() => navigate(`/devices/${device.id}`)}
                    className="hover:bg-surface-dim/50 cursor-pointer transition-colors duration-200"
                  >
                    {/* Status indicator */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
                        <span className={`text-xs font-semibold uppercase ${isOnline ? 'text-emerald' : 'text-rose'}`}>
                          {device.connectionStatus}
                        </span>
                      </div>
                    </td>

                    {/* Device info */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-t-primary hover:text-brand transition-colors">
                          {device.deviceName}
                        </div>
                        <div className="text-xs text-t-muted font-mono mt-0.5">
                          {device.deviceCode}
                        </div>
                      </div>
                    </td>

                    {/* Route Location */}
                    <td className="px-5 py-4 whitespace-nowrap text-t-secondary">
                      {device.route ? (
                        <div>
                          <div className="font-medium text-xs text-t-primary">{device.route.name}</div>
                          <div className="text-[10px] text-t-muted">{device.route.subRegion?.name || ''}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-t-muted">Unassigned</span>
                      )}
                    </td>

                    {/* Milk Temp */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`font-mono font-bold ${isHighTemp ? 'text-rose' : 'text-t-primary'}`}>
                        {tempText}
                      </span>
                    </td>

                    {/* Milk Volume */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div>
                        <span className="font-mono font-bold text-sky">{volText}</span>
                        {capacity > 0 && (
                          <div className="text-[10px] text-t-muted mt-0.5">
                            {levelPercent}% of {capacity} L
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Power Source */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${powerClass}`}>
                        {powerText}
                      </span>
                    </td>

                    {/* Device Mode */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase ${modeClass}`}>
                        {modeText}
                      </span>
                    </td>

                    {/* Last Seen */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-t-muted font-medium">
                      {lastSeenText}
                    </td>

                    {/* Action buttons */}
                    <td className="px-5 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/devices/${device.id}`)}
                          title="View Dashboard"
                          className="p-2 rounded-xl text-sky hover:bg-sky/10 transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEditClick(device)}
                              title="Edit settings"
                              className="p-2 rounded-xl text-brand hover:bg-brand/10 transition-colors"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(device.id)}
                              title="Delete device"
                              className="p-2 rounded-xl text-rose hover:bg-rose/10 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {devices.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-t-muted">
                    <Monitor size={48} className="mx-auto mb-4 text-t-muted" />
                    <p className="text-lg font-medium text-t-secondary">No devices found in this filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* Add / Edit Device Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-card border border-edge rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-scale space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-edge pb-3">
              <h3 className="text-xl font-bold text-t-primary">
                {editDevice ? 'Edit Device Settings' : 'Register New Device'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-t-muted hover:text-t-primary hover:bg-surface-dim transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Device Code</label>
                  <input type="text" value={form.deviceCode} onChange={(e) => setForm({ ...form, deviceCode: e.target.value })}
                    disabled={!!editDevice} required
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Device Name</label>
                  <input type="text" value={form.deviceName} onChange={(e) => setForm({ ...form, deviceName: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Assign Route</label>
                <select value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all appearance-none cursor-pointer">
                  <option value="">Unassigned</option>
                  {routes.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.subRegion?.name || ''})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'tankCapacity', label: 'Tank Capacity (L)', type: 'number' },
                  { key: 'minTankVolume', label: 'Min Volume (L)', type: 'number' },
                  { key: 'setTemperature', label: 'Set Temp (°C)', type: 'number', step: '0.1' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">{field.label}</label>
                    <input type={field.type} step={field.step} value={form[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} required
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Diesel Consumption (L/min)</label>
                  <input type="number" step="0.01" value={form.dieselConsumption} onChange={(e) => setForm({ ...form, dieselConsumption: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all appearance-none cursor-pointer">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Align Users checklist */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Align Users (Operators)</label>
                <div className="border border-edge rounded-xl p-3 max-h-[120px] overflow-y-auto space-y-2 bg-surface-input">
                  {users.filter(u => u.role === 'user').map(u => (
                    <label key={u.id} className="flex items-center gap-2.5 text-sm text-t-primary cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.userIds?.includes(u.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm(prev => {
                            const ids = prev.userIds || [];
                            return {
                              ...prev,
                              userIds: checked ? [...ids, u.id] : ids.filter(id => id !== u.id)
                            };
                          });
                        }}
                        className="rounded border-edge bg-surface-dim text-brand focus:ring-brand/20"
                      />
                      <span>{u.name} ({u.email})</span>
                    </label>
                  ))}
                  {users.filter(u => u.role === 'user').length === 0 && (
                    <p className="text-xs text-t-muted">No user operators found to assign</p>
                  )}
                </div>
              </div>

              {/* Alert notification emails */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Alert Emails (Comma-separated, up to 5)</label>
                <input
                  type="text"
                  placeholder="e.g. operator1@bmc.com, operator2@bmc.com"
                  value={form.alertEmails}
                  onChange={(e) => setForm({ ...form, alertEmails: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-edge">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-surface-dim text-t-primary border border-edge hover:border-t-muted transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-brand text-white shadow-button hover:bg-brand-dark hover:scale-[1.02] transition-all">
                  {editDevice ? 'Save Changes' : 'Register Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
