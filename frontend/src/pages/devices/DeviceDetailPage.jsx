import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deviceAPI } from '../../api';
import {
  Thermometer, Droplets, Monitor, ArrowLeft, Cpu, Shield,
  Zap, Calendar, Settings, Activity, Gauge, Lock, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeviceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Alert configs states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertConfigs, setAlertConfigs] = useState([]);
  const [password, setPassword] = useState('');
  const [savingConfigs, setSavingConfigs] = useState(false);

  const fetchDeviceDetails = async () => {
    try {
      const res = await deviceAPI.getById(id);
      setDevice(res.data);
    } catch (err) {
      toast.error('Failed to load device details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceDetails();
    const interval = setInterval(fetchDeviceDetails, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [id]);

  const handleOpenAlertModal = async () => {
    try {
      const res = await deviceAPI.getAlertConfigs(id);
      setAlertConfigs(res.data);
      setPassword('');
      setShowAlertModal(true);
    } catch (err) {
      toast.error('Failed to fetch alert configurations');
    }
  };

  const handleSaveAlertConfigs = async (e) => {
    e.preventDefault();
    setSavingConfigs(true);
    try {
      await deviceAPI.updateAlertConfigs(id, {
        password,
        configs: alertConfigs,
      });
      toast.success('Alert configurations updated');
      setShowAlertModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update configurations');
    } finally {
      setSavingConfigs(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="text-center py-16">
        <Monitor size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
        <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>Device not found</p>
        <button onClick={() => navigate('/devices')} className="mt-4 px-4 py-2 bg-primary text-white rounded-xl">Back to list</button>
      </div>
    );
  }

  const t = device.lastTelemetry || {};

  return (
    <>
      <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/devices')} className="p-2.5 rounded-xl hover:bg-gray-800 transition-colors" style={{ color: 'var(--text-primary)', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{device.deviceName}</h1>
            <span className={`status-dot ${device.connectionStatus === 'online' ? 'online' : 'offline'}`} />
            <span className="text-xs font-semibold capitalize" style={{ color: device.connectionStatus === 'online' ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {device.connectionStatus}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Code: {device.deviceCode}</p>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Milk Temperature Card */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Milk Temperature</span>
            <Thermometer size={20} style={{ color: 'var(--color-secondary)' }} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold" style={{ color: t.milkTemperature > 8 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
              {t.milkTemperature != null ? `${t.milkTemperature.toFixed(1)}` : '--'}
            </span>
            <span className="text-lg" style={{ color: 'var(--text-muted)' }}>°C</span>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>Target Setpoint: {device.setTemperature}°C</p>
        </div>

        {/* Milk Volume Card */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Milk Volume</span>
            <Droplets size={20} style={{ color: 'var(--color-info)' }} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {t.milkVolume != null ? t.milkVolume.toLocaleString() : '--'}
            </span>
            <span className="text-lg" style={{ color: 'var(--text-muted)' }}>L</span>
          </div>
          <div className="mt-3 w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400" style={{ width: `${(t.milkVolume / device.tankCapacity) * 100 || 0}%` }} />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Capacity: {device.tankCapacity}L ({( (t.milkVolume / device.tankCapacity) * 100 || 0).toFixed(0)}%)</p>
        </div>

        {/* Energy Consumption Card */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Power Usage</span>
            <Zap size={20} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {t.kwh != null ? t.kwh.toLocaleString() : '--'}
            </span>
            <span className="text-lg" style={{ color: 'var(--text-muted)' }}>kWh</span>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>Grid Status: {t.gridStatus ? 'Available' : 'Unavailable'}</p>
        </div>
      </div>

      {/* Actuators & Hardware Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compressors & Agitators */}
        <div className="lg:col-span-2 rounded-2xl p-6 space-y-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Actuators & Equipment Status</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Compressors */}
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Compressors</span>
              {[1, 2, 3].map((num) => {
                const comp = t[`compressor${num}`] || {};
                return (
                  <div key={num} className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="flex items-center gap-3">
                      <Activity size={16} style={{ color: comp.status ? 'var(--color-success)' : 'var(--text-muted)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Compressor {num}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${comp.status ? 'text-green-400' : 'text-gray-400'}`}>
                        {comp.status ? 'RUNNING' : 'STOPPED'}
                      </span>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Hours: {comp.runningHours || 0}h</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Agitators & Auxiliary */}
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Agitators & Auxiliary</span>
              {[1, 2].map((num) => {
                const agi = t[`agitator${num}`] || {};
                return (
                  <div key={num} className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="flex items-center gap-3">
                      <Cpu size={16} style={{ color: agi.status ? 'var(--color-success)' : 'var(--text-muted)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Agitator {num}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${agi.status ? 'text-green-400' : 'text-gray-400'}`}>
                        {agi.status ? 'RUNNING' : 'STOPPED'}
                      </span>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Hours: {agi.runningHours || 0}h</p>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="flex items-center gap-3">
                  <Shield size={16} style={{ color: t.cipStatus ? 'var(--color-info)' : 'var(--text-muted)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>CIP Status</span>
                </div>
                <span className={`text-xs font-bold ${t.cipStatus ? 'text-blue-400' : 'text-gray-400'}`}>
                  {t.cipStatus ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="flex items-center gap-3">
                  <Gauge size={16} style={{ color: t.dispatchStatus ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Dispatch Status</span>
                </div>
                <span className={`text-xs font-bold ${t.dispatchStatus ? 'text-orange-400' : 'text-gray-400'}`}>
                  {t.dispatchStatus ? 'DISPATCHING' : 'INACTIVE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata & Configuration */}
        <div className="rounded-2xl p-6 space-y-6 flex flex-col justify-between" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Configuration Details</h3>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Route Name</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{device.route?.name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Route Code</span>
                <span className="font-medium font-mono" style={{ color: 'var(--text-primary)' }}>{device.route?.code || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Sub Region</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{device.route?.subRegion?.name || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Hardware Version</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{device.hardwareVersion || 'v1.0'}</span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Firmware Version</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{device.firmwareVersion || 'v1.0.4'}</span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Last Seen Time</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenAlertModal}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:scale-105 transition-all shadow-button"
            style={{ background: 'var(--color-primary)' }}
          >
            <Settings size={16} /> Configure Device Alerts
          </button>
        </div>
      </div>
    </div>

      {/* Alert Configuration Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowAlertModal(false)}>
          <div className="bg-surface-card border border-edge rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in-scale space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-edge pb-3">
              <h3 className="text-xl font-bold text-t-primary flex items-center gap-2">
                <Settings size={20} className="text-brand animate-spin-slow" /> Alert Configuration
              </h3>
              <button onClick={() => setShowAlertModal(false)} className="p-1.5 rounded-lg text-t-muted hover:text-t-primary hover:bg-surface-dim transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAlertConfigs} className="space-y-4">
              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                {alertConfigs.map((config, index) => (
                  <div key={config.id} className="p-3 border border-edge rounded-xl bg-surface-dim/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-t-primary uppercase tracking-wider">
                        {config.alertType.replace(/_/g, ' ')}
                      </span>
                      <label className="flex items-center gap-2 text-xs font-semibold text-t-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setAlertConfigs(prev => prev.map((c, i) => i === index ? { ...c, enabled: val } : c));
                          }}
                          className="rounded border-edge text-brand focus:ring-brand/20"
                        />
                        Enabled
                      </label>
                    </div>

                    {config.enabled && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {config.threshold !== null && (
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-t-muted mb-1">Trigger Threshold</label>
                            <input
                              type="number"
                              step="0.1"
                              value={config.threshold}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setAlertConfigs(prev => prev.map((c, i) => i === index ? { ...c, threshold: isNaN(val) ? 0 : val } : c));
                              }}
                              className="w-full px-3 py-1.5 rounded-lg text-xs bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-t-muted mb-1">Cooldown (min)</label>
                          <input
                            type="number"
                            value={config.cooldownMinutes}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setAlertConfigs(prev => prev.map((c, i) => i === index ? { ...c, cooldownMinutes: isNaN(val) ? 0 : val } : c));
                            }}
                            className="w-full px-3 py-1.5 rounded-lg text-xs bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Password Protection Lock */}
              <div className="border-t border-edge pt-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-t-secondary">
                  <Lock size={14} className="text-brand" /> Password Protected Action
                </div>
                <div>
                  <input
                    type="password"
                    required
                    placeholder="Enter your account password to verify changes"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAlertModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-surface-dim text-t-primary border border-edge hover:border-t-muted transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={savingConfigs}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-brand text-white shadow-button hover:bg-brand-dark hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {savingConfigs ? 'Applying...' : 'Apply Configurations'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
