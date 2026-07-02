import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../../api';
import {
  Monitor, Wifi, WifiOff, Thermometer, Droplets, Zap,
  AlertTriangle, Power, Factory, Fuel, Activity, Bell, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await dashboardAPI.getSummary();
      setSummary(res.data);
    } catch {
      setSummary({
        totalDevices: 0, onlineDevices: 0, offlineDevices: 0,
        activeAlerts: 0, totalVolume: 0, averageTemperature: 0,
        runningCompressors: 0, runningDG: 0, powerFailure: 0,
        cipDevices: 0, dispatchDevices: 0, highTempDevices: 0,
      });
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await dashboardAPI.getDevices();
      setDevices(res.data);
    } catch (e) {
      setDevices([]);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchDevices()]);
    setLoading(false);
  }, [fetchSummary, fetchDevices]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: 'Active Alerts', value: summary.activeAlerts, icon: AlertTriangle, accent: summary.activeAlerts > 0 ? 'bg-amber/10 text-amber' : 'bg-surface-dim text-t-muted', path: '/alerts' },
    { label: 'Milk Volume (L)', value: summary.totalVolume.toLocaleString(), icon: Droplets, accent: 'bg-sky/10 text-sky' },
    { label: 'Compressors', value: summary.runningCompressors, icon: Activity, accent: summary.runningCompressors > 0 ? 'bg-emerald/10 text-emerald' : 'bg-surface-dim text-t-muted' },
    { label: 'CIP Active', value: summary.cipDevices, icon: Factory, accent: summary.cipDevices > 0 ? 'bg-sky/10 text-sky' : 'bg-surface-dim text-t-muted', path: '/devices?filter=cip' },
    { label: 'Dispatch', value: summary.dispatchDevices, icon: Power, accent: summary.dispatchDevices > 0 ? 'bg-brand/10 text-brand' : 'bg-surface-dim text-t-muted', path: '/devices?filter=dispatch' },
    { label: 'High Temp', value: summary.highTempDevices, icon: Bell, accent: summary.highTempDevices > 0 ? 'bg-rose/10 text-rose' : 'bg-surface-dim text-t-muted', path: '/devices?filter=high-temp' },
  ];

  // Bar chart data: Active devices comparative Volume & Temperature
  const barChartData = devices.slice(0, 10).map(d => ({
    name: d.deviceName,
    volume: d.lastTelemetry?.milkVolume || 0,
    temperature: d.lastTelemetry?.milkTemperature || 0,
  }));

  // Connection status distribution pie chart data
  const connectionPieChartData = [
    { name: 'Online Devices', value: summary.onlineDevices, color: '#10b981' },
    { name: 'Offline Devices', value: summary.offlineDevices, color: '#ef4444' },
  ].filter(c => c.value > 0);

  if (connectionPieChartData.length === 0) {
    connectionPieChartData.push({ name: 'No data', value: 1, color: '#6b7280' });
  }

  // Pie chart data: Power status distributions
  const gridPowerOk = Math.max(0, summary.totalDevices - summary.powerFailure - summary.runningDG);
  const pieChartData = [
    { name: 'Grid Power Ok', value: gridPowerOk, color: '#10b981' },
    { name: 'Power Failure (Grid Down)', value: summary.powerFailure, color: '#ef4444' },
    { name: 'DG Generator Running', value: summary.runningDG, color: '#f59e0b' },
  ].filter(p => p.value > 0);

  if (pieChartData.length === 0) {
    pieChartData.push({ name: 'No data', value: 1, color: '#6b7280' });
  }

  // Hourly Mock Data for Trend lines
  const mockTrendData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    temp: 3.5 + Math.random() * 1.5,
    volume: 1800 + Math.random() * 500,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-t-primary">Dashboard</h1>
          <p className="text-sm text-t-secondary mt-1">Real-time BMC monitoring overview</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium shadow-button hover:bg-brand-dark hover:scale-105 transition-all"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 stagger">
        {stats.map((stat) => (
          <div
            key={stat.label}
            onClick={() => stat.path && navigate(stat.path)}
            className={`bg-surface-card border border-edge rounded-2xl p-4 hover:border-brand/30 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 ${stat.path ? 'cursor-pointer hover:bg-surface-dim/35' : 'cursor-default'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.accent}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-t-primary">{stat.value}</div>
            <div className="text-xs text-t-muted mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Connection Status Pie Chart */}
        <div className="bg-surface-card border border-edge rounded-2xl p-5 shadow-sm">
          <h3 className="text-md font-semibold text-t-primary mb-3">Device Status Distribution</h3>
          <div className="h-[200px] w-full flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="h-[140px] w-[140px] relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={connectionPieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {connectionPieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface-card)',
                      border: '1px solid var(--color-edge)',
                      borderRadius: '12px',
                      color: 'var(--color-t-primary)',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-t-primary">{summary.totalDevices}</span>
                <span className="text-[9px] text-t-muted uppercase tracking-wider font-bold">Total BMC</span>
              </div>
            </div>
            
            <div className="space-y-2 flex-1 w-full">
              {connectionPieChartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl border border-edge bg-surface-dim/40 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-t-secondary text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-bold text-t-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Power Status Pie Chart */}
        <div className="bg-surface-card border border-edge rounded-2xl p-5 shadow-sm">
          <h3 className="text-md font-semibold text-t-primary mb-3">Power Status Distribution</h3>
          <div className="h-[200px] w-full flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="h-[140px] w-[140px] relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface-card)',
                      border: '1px solid var(--color-edge)',
                      borderRadius: '12px',
                      color: 'var(--color-t-primary)',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-t-primary">{summary.totalDevices}</span>
                <span className="text-[9px] text-t-muted uppercase tracking-wider font-bold">Total BMC</span>
              </div>
            </div>
            
            <div className="space-y-2 flex-1 w-full">
              {pieChartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl border border-edge bg-surface-dim/40 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-t-secondary text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-bold text-t-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Volume Trend */}
        <div className="bg-surface-card border border-edge rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-t-primary mb-4">Total Milk Volume Trend (24h)</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge)" />
                <XAxis dataKey="hour" tick={{ fill: 'var(--color-t-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--color-t-muted)', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-card)',
                    border: '1px solid var(--color-edge)',
                    borderRadius: '12px',
                    color: 'var(--color-t-primary)',
                  }}
                />
                <Area type="monotone" dataKey="volume" stroke="#38bdf8" strokeWidth={2} fill="url(#volGrad)" name="Volume (L)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
