import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deviceAPI } from '../../api';
import {
  Thermometer, Droplets, Monitor, ArrowLeft, Cpu, Shield,
  Zap, Calendar, Settings, Activity, Gauge, Lock, X, Snowflake
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

  // Device settings states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [sendingCommand, setSendingCommand] = useState(false);

  // CT Form States
  const [ctChannel, setCtChannel] = useState('1');
  const [ctHigh, setCtHigh] = useState('2.00');
  const [ctLow, setCtLow] = useState('1.50');
  const [ctCalChannel, setCtCalChannel] = useState('1');
  const [ctCalVal, setCtCalVal] = useState('5.000');

  // Level Form States
  const [levelMode, setLevelMode] = useState('0');
  const [levelStart, setLevelStart] = useState('1500');
  const [levelSpan, setLevelSpan] = useState('1500');
  const [levelOffset, setLevelOffset] = useState('0');
  const [levelCalVal, setLevelCalVal] = useState('12.000');

  // Volume Form States
  const [volPoint, setVolPoint] = useState('1');
  const [volVal, setVolVal] = useState('0');
  const [volLvl, setVolLvl] = useState('0');

  const handleSendCommand = async (commandString, successMessage) => {
    setSendingCommand(true);
    try {
      await deviceAPI.sendCommand(device.deviceCode, commandString);
      toast.success(successMessage || 'Configuration update command sent to device successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send command to device');
    } finally {
      setSendingCommand(false);
    }
  };

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
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/devices')} className="p-2.5 rounded-xl hover:bg-gray-800 transition-colors" style={{ color: 'var(--text-primary)', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{device.deviceName}</h1>
                <div className="flex items-center gap-1.5">
                  <span className={`status-dot ${device.connectionStatus === 'online' ? 'online' : 'offline'}`} />
                  <span className="text-xs font-semibold capitalize" style={{ color: device.connectionStatus === 'online' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {device.connectionStatus}
                  </span>
                </div>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Code: {device.deviceCode}</p>
            </div>
          </div>

          {/* Process display */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface border border-edge animate-fade-in" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Current Process:</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase bg-brand/10 text-brand border border-brand/20">
              {t.processName || 'IDLE'}
            </span>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-3 ${t.mediaType === 2 ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-6`}>
          {/* Temperature Card — dynamic based on mediaType */}
          <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {t.mediaType === 1 ? 'Water Temperature' : t.mediaType === 2 ? 'Milk Temperature' : 'Temperature'}
              </span>
              <div className="flex items-center gap-2">
                {t.mediaType === 1 ? (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">Water</span>
                ) : t.mediaType === 2 ? (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(var(--color-primary-rgb, 99, 102, 241), 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(var(--color-primary-rgb, 99, 102, 241), 0.2)' }}>Milk</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>Empty</span>
                )}
                <Thermometer size={20} style={{ color: 'var(--color-secondary)' }} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold" style={{ color: t.temperature > 8 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                {t.temperature != null ? `${t.temperature.toFixed(1)}` : '--'}
              </span>
              <span className="text-lg" style={{ color: 'var(--text-muted)' }}>°C</span>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>Target Setpoint: {device.setTemperature}°C</p>
          </div>

          {/* Milk/Water Volume Card */}
          <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {t.mediaType === 1 ? 'Water Volume' : t.mediaType === 2 ? 'Milk Volume' : 'Volume'}
              </span>
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
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Capacity: {device.tankCapacity}L ({((t.milkVolume / device.tankCapacity) * 100 || 0).toFixed(0)}%)</p>
          </div>

          {/* FAT Card (shows only when mediaType is Milk) */}
          {t.mediaType === 2 && (
            <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Milk FAT</span>
                <Activity size={20} className="text-brand" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {t.fat != null ? `${t.fat.toFixed(1)}` : '4.2'}
                </span>
                <span className="text-lg font-semibold" style={{ color: 'var(--text-muted)' }}>%</span>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>Milk quality FAT content</p>
            </div>
          )}

          {/* SNF Card (shows only when mediaType is Milk) */}
          {t.mediaType === 2 && (
            <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Milk SNF</span>
                <Activity size={20} className="text-sky" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {t.snf != null ? `${t.snf.toFixed(1)}` : '8.5'}
                </span>
                <span className="text-lg font-semibold" style={{ color: 'var(--text-muted)' }}>%</span>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>Solids-Not-Fat content</p>
            </div>
          )}

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
                  const stateColor = comp.state === 2 ? 'text-green-400' : comp.state === 3 ? 'text-red-400 animate-pulse' : 'text-gray-400';
                  const stateText = comp.stateName || (comp.status ? 'ON' : 'OFF');
                  return (
                    <div key={num} className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="flex items-center gap-3">
                        <Activity size={16} style={{ color: comp.state === 2 ? 'var(--color-success)' : comp.state === 3 ? 'var(--color-danger)' : 'var(--text-muted)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Compressor {num}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold ${stateColor}`}>
                          {stateText}
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
                <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="flex items-center gap-3">
                    <Snowflake size={16} style={{ color: t.status?.CHILLING ? 'var(--color-warning)' : 'var(--text-muted)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Chilling Status</span>
                  </div>
                  <span className={`text-xs font-bold ${t.status?.CHILLING ? 'text-amber-500' : 'text-gray-400'}`}>
                    {t.status?.CHILLING ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata & Configuration */}
          <div className="rounded-2xl p-6 space-y-6 flex flex-col justify-between" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="space-y-6">
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
                    <span style={{ color: 'var(--text-secondary)' }}>Region</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{device.route?.region?.name || '-'}</span>
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

              {/* System Process Status flags */}
              {/* <div className="border-t border-edge pt-5 space-y-3.5" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Operational Status Flags</h4>
                <div className="grid grid-cols-2 gap-2.5">

                  <div className="p-2.5 rounded-xl flex items-center justify-between bg-surface-dim border border-edge/80" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                    <span className="font-medium text-xs" style={{ color: 'var(--text-secondary)' }}>Dispatch</span>
                    <span className={`px-2 py-0.5 rounded font-extrabold text-[9px] uppercase ${t.status?.DISPATCH ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'}`}>
                      {t.status?.DISPATCH ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl flex items-center justify-between bg-surface-dim border border-edge/80" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                    <span className="font-medium text-xs" style={{ color: 'var(--text-secondary)' }}>CIP Status</span>
                    <span className={`px-2 py-0.5 rounded font-extrabold text-[9px] uppercase ${t.status?.CIP ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'}`}>
                      {t.status?.CIP ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl flex items-center justify-between bg-surface-dim border border-edge/80" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                    <span className="font-medium text-xs" style={{ color: 'var(--text-secondary)' }}>CIP Needed</span>
                    <span className={`px-2 py-0.5 rounded font-extrabold text-[9px] uppercase ${t.status?.CIP_NEEDED ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                      {t.status?.CIP_NEEDED ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div> */}
            </div>

            <button
              onClick={handleOpenAlertModal}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:scale-105 transition-all shadow-button"
              style={{ background: 'var(--color-primary)' }}
            >
              <Settings size={16} /> Configure Device Alerts
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:scale-105 transition-all shadow-button"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              <Settings size={16} /> Device Settings & Calibration
            </button>
          </div>
        </div>

        {/* Diagnostic & Digital Inputs Panel */}
        {/* <div className="rounded-2xl p-6 space-y-6 animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Digital Inputs & System Diagnostics</h3>
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold animate-pulse-slow" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
              Packet Type: {t.packetTypeName || 'Normal'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.isArray(t.digitalInputs) && t.digitalInputs.length > 0 ? t.digitalInputs.map((di) => (
              <div key={di.pin} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-800/20 border border-gray-800/40" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{di.name}</span>
                  <span className="text-[9px] text-gray-500 font-mono">Pin DI{di.pin} (Active Low)</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${di.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse-slow' : 'bg-gray-700/20 text-gray-500 border border-gray-700/40'}`}>
                  {di.isActive ? 'ACTIVE (0)' : 'INACTIVE (1)'}
                </span>
              </div>
            )) : (
              <div className="col-span-4 text-center py-6 text-xs text-gray-500">
                No digital input telemetry received
              </div>
            )}
          </div>


          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-3 rounded-xl bg-gray-900/10 border border-gray-800/30">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Current Process</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.processName || 'IDLE'}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-900/10 border border-gray-800/30">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Media Status</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.mediaName || 'EMPTY'}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-900/10 border border-gray-800/30">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">RTD Sensor</span>
              <span className={`text-sm font-semibold ${t.rtdFault ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                {t.rtdFault ? 'FAULT' : 'OK'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-900/10 border border-gray-800/30">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Signal Quality (CSQ)</span>
              <span className="text-sm font-semibold text-t-primary" style={{ color: 'var(--text-primary)' }}>{t.csq != null ? `${t.csq} dBm` : '--'}</span>
            </div>
          </div>
        </div> */}
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

      {/* Device Command Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-scale space-y-6 text-gray-800" onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <Settings size={20} className="animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Device Settings & Calibration</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Configure hardware thresholds, cycles, and calibration profiles.</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-gray-50 border border-gray-200">
              {[
                { id: 'general', label: 'General' },
                { id: 'current_transformer', label: 'CT Sensor' },
                { id: 'level_sensor', label: 'Level Sensor' },
                { id: 'volume_strapping', label: 'Strapping Points' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.id
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-850 hover:bg-gray-200/50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="space-y-4 min-h-[280px]">

              {/* Tab 1: General & Operations */}
              {activeTab === 'general' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Operations Control</h4>
                      <p className="text-xs text-gray-500 mt-1">Force start manual processes or trigger diagnostic settings readouts.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Read Settings */}
                      <div className="p-4 border border-gray-200 rounded-xl space-y-3 bg-white shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-bold text-gray-700 block">Read Device Settings</span>
                          <p className="text-[11px] text-gray-500 mt-1">Query the controller's current calibrated thresholds and active status parameters.</p>
                        </div>
                        <button
                          onClick={() => handleSendCommand(`*DREAD,${device.deviceCode}#`, 'Read Settings request sent to device successfully')}
                          disabled={sendingCommand}
                          className="w-full py-2 bg-teal-50 hover:bg-teal-100/80 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          Read Settings
                        </button>
                      </div>

                      {/* Dispatch Control */}
                      <div className="p-4 border border-gray-200 rounded-xl space-y-3 bg-white shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-bold text-gray-700 block">Dispatch Cycle Override</span>
                          <p className="text-[11px] text-gray-500 mt-1">Force start manual dispatch (emptying the cooler) or stop the current process.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendCommand(`*DPROC,${device.deviceCode},1#`, 'Start Dispatch command sent successfully')}
                            disabled={sendingCommand}
                            className="flex-1 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          >
                            Start Dispatch
                          </button>
                          <button
                            onClick={() => handleSendCommand(`*DPROC,${device.deviceCode},2#`, 'Stop Dispatch command sent successfully')}
                            disabled={sendingCommand}
                            className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          >
                            Stop Dispatch
                          </button>
                        </div>
                      </div>

                      {/* CIP Override */}
                      <div className="p-4 border border-gray-200 rounded-xl space-y-3 bg-white shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-bold text-gray-700 block">Clean-In-Place (CIP) override</span>
                          <p className="text-[11px] text-gray-500 mt-1">Manually trigger clean-in-place sanitization routine or abort active cleaning.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendCommand(`*DPROC,${device.deviceCode},3#`, 'Start CIP Cleaning command sent successfully')}
                            disabled={sendingCommand}
                            className="flex-1 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          >
                            Start CIP
                          </button>
                          <button
                            onClick={() => handleSendCommand(`*DPROC,${device.deviceCode},4#`, 'Stop CIP Cleaning command sent successfully')}
                            disabled={sendingCommand}
                            className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          >
                            Stop CIP
                          </button>
                        </div>
                      </div>

                      {/* Chilling Override */}
                      <div className="p-4 border border-gray-200 rounded-xl space-y-3 bg-white shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-bold text-gray-700 block">Chilling Override</span>
                          <p className="text-[11px] text-gray-500 mt-1">Manually force start milk cooling/chilling process or cancel manual override.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendCommand(`*DPROC,${device.deviceCode},5#`, 'Start Chilling Override command sent successfully')}
                            disabled={sendingCommand}
                            className="flex-1 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-750 border border-yellow-250 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          >
                            Start Chilling
                          </button>
                          <button
                            onClick={() => handleSendCommand(`*DPROC,${device.deviceCode},6#`, 'Stop Chilling Override command sent successfully')}
                            disabled={sendingCommand}
                            className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          >
                            Stop Chilling
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: CT Settings */}
              {activeTab === 'current_transformer' && (
                <div className="space-y-4 animate-fade-in">

                  {/* Threshold Settings */}
                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 font-sans">CT Current Threshold Configuration</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Specify current limits to trigger over-current or under-current alerts.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">CT Channel</label>
                        <select
                          value={ctChannel}
                          onChange={(e) => setCtChannel(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-gray-300 text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-semibold"
                        >
                          <option value="1">CT1 (Comp 1)</option>
                          <option value="2">CT2 (Comp 2)</option>
                          <option value="3">CT3 (Comp 3)</option>
                          <option value="4">CT4 (Aux/Agi)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">High Limit (A)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={ctHigh}
                          onChange={(e) => setCtHigh(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-gray-300 text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Low Limit (A)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={ctLow}
                          onChange={(e) => setCtLow(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-gray-300 text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleSendCommand(
                          `*DCT,${device.deviceCode},${ctChannel},${parseFloat(ctHigh || 0).toFixed(2)},${parseFloat(ctLow || 0).toFixed(2)}#`,
                          'CT Current Threshold configurations successfully sent to device'
                        )}
                        disabled={sendingCommand}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold text-xs hover:bg-teal-700 transition-all disabled:opacity-50"
                      >
                        Apply CT Thresholds
                      </button>
                    </div>
                  </div>

                  {/* Auto Calibration */}
                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">CT Auto Calibration</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Calibrate CT sensor channels against a known reference current load.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Calibration Channel</label>
                        <select
                          value={ctCalChannel}
                          onChange={(e) => setCtCalChannel(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-gray-300 text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-semibold"
                        >
                          <option value="1">CT1</option>
                          <option value="2">CT2</option>
                          <option value="3">CT3</option>
                          <option value="4">CT4</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Calibration Reference (A)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={ctCalVal}
                          onChange={(e) => setCtCalVal(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-gray-300 text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleSendCommand(
                          `*DCTCAL,${device.deviceCode},${ctCalChannel},${parseFloat(ctCalVal || 0).toFixed(3)}#`,
                          'CT current auto-calibration command successfully sent to device'
                        )}
                        disabled={sendingCommand}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold text-xs hover:bg-teal-700 transition-all disabled:opacity-50"
                      >
                        Calibrate CT Current
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Level Sensor */}
              {activeTab === 'level_sensor' && (
                <div className="space-y-4 animate-fade-in">

                  {/* Start/Span/Offset */}
                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Level Sensor Parameters</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Adjust settings, measuring spans, and start calibration parameters.</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Mode</label>
                        <input
                          type="number"
                          value={levelMode}
                          onChange={(e) => setLevelMode(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-gray-300 text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Start (mm)</label>
                        <input
                          type="number"
                          value={levelStart}
                          onChange={(e) => setLevelStart(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-gray-300 text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Span (mm)</label>
                        <input
                          type="number"
                          value={levelSpan}
                          onChange={(e) => setLevelSpan(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-gray-300 text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Offset (mm)</label>
                        <input
                          type="number"
                          value={levelOffset}
                          onChange={(e) => setLevelOffset(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-gray-300 text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleSendCommand(
                          `*DLEVEL,${device.deviceCode},${levelMode},${levelStart},${levelSpan},${levelOffset}#`,
                          'Level sensor parameter configurations successfully sent to device'
                        )}
                        disabled={sendingCommand}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold text-xs hover:bg-teal-700 transition-all disabled:opacity-50"
                      >
                        Apply Level Parameters
                      </button>
                    </div>
                  </div>

                  {/* Level Calibration */}
                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Level Auto Calibration</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Calibrate the raw sensor reading by providing the current actual level height.</p>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Actual Material Level (mm)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={levelCalVal}
                        onChange={(e) => setLevelCalVal(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-gray-300 text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleSendCommand(
                          `*DLEVELCAL,${device.deviceCode},${parseFloat(levelCalVal || 0).toFixed(3)}#`,
                          'Level auto-calibration command successfully sent to device'
                        )}
                        disabled={sendingCommand}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold text-xs hover:bg-teal-700 transition-all disabled:opacity-50"
                      >
                        Calibrate Sensor Level
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Volume Calibration */}
              {activeTab === 'volume_strapping' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Volume Strapping Points Calibration</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Map physical heights (Level in mm) to exact milk contents (Volume in Liters).</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Point Number (1-10)</label>
                        <select
                          value={volPoint}
                          onChange={(e) => setVolPoint(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-gray-300 text-gray-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-semibold"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(pt => (
                            <option key={pt} value={pt}>Point {pt}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Volume (Liters)</label>
                        <input
                          type="number"
                          value={volVal}
                          onChange={(e) => setVolVal(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-gray-300 text-gray-805 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Level (mm)</label>
                        <input
                          type="number"
                          value={volLvl}
                          onChange={(e) => setVolLvl(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-gray-300 text-gray-805 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleSendCommand(
                          `*DVOLPT,${device.deviceCode},${volPoint},${volVal},${volLvl}#`,
                          'Volume strapping point configuration command successfully sent to device'
                        )}
                        disabled={sendingCommand}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold text-xs hover:bg-teal-700 transition-all disabled:opacity-50"
                      >
                        Configure Strapping Point
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border border-gray-250 transition-all"
              >
                Close Settings Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
