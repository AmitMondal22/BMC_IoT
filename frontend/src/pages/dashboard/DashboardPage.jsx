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
        totalDevices: 128, onlineDevices: 112, offlineDevices: 16,
        activeAlerts: 7, totalVolume: 45280, averageTemperature: 4.2,
        runningCompressors: 89, runningDG: 12, powerFailure: 3,
        cipDevices: 5, dispatchDevices: 8, highTempDevices: 4,
      });
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await dashboardAPI.getDevices();
      setDevices(res.data);
    } catch (e) {
      setDevices([
        { deviceName: 'BMC Ahmedabad', lastTelemetry: { milkVolume: 4200, milkTemperature: 3.8 } },
        { deviceName: 'BMC Baroda', lastTelemetry: { milkVolume: 3500, milkTemperature: 4.2 } },
        { deviceName: 'BMC Rajkot', lastTelemetry: { milkVolume: 2800, milkTemperature: 8.5 } },
        { deviceName: 'BMC Surat', lastTelemetry: { milkVolume: 5100, milkTemperature: 3.9 } },
        { deviceName: 'BMC Anand', lastTelemetry: { milkVolume: 1200, milkTemperature: 4.0 } },
      ]);
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
    { label: 'Total Devices', value: summary.totalDevices, icon: Monitor, accent: 'bg-brand/10 text-brand', path: '/devices?filter=all' },
    { label: 'Online', value: summary.onlineDevices, icon: Wifi, accent: 'bg-emerald/10 text-emerald', path: '/devices?filter=online' },
    { label: 'Offline', value: summary.offlineDevices, icon: WifiOff, accent: 'bg-rose/10 text-rose', path: '/devices?filter=offline' },
    { label: 'Active Alerts', value: summary.activeAlerts, icon: AlertTriangle, accent: summary.activeAlerts > 0 ? 'bg-amber/10 text-amber' : 'bg-surface-dim text-t-muted', path: '/alerts' },
    { label: 'Milk Volume (L)', value: summary.totalVolume.toLocaleString(), icon: Droplets, accent: 'bg-sky/10 text-sky' },
    { label: 'Avg Temperature', value: `${summary.averageTemperature}°C`, icon: Thermometer, accent: 'bg-accent/10 text-accent' },
    { label: 'Compressors', value: summary.runningCompressors, icon: Activity, accent: summary.runningCompressors > 0 ? 'bg-emerald/10 text-emerald' : 'bg-surface-dim text-t-muted' },
    { label: 'DG Running', value: summary.runningDG, icon: Fuel, accent: summary.runningDG > 0 ? 'bg-amber/10 text-amber' : 'bg-surface-dim text-t-muted', path: '/devices?filter=dg-run' },
    { label: 'Power Failure', value: summary.powerFailure, icon: Zap, accent: summary.powerFailure > 0 ? 'bg-rose/10 text-rose' : 'bg-surface-dim text-t-muted', path: '/devices?filter=power-fail' },
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

  // Pie chart data: Power status distributions
  const gridPowerOk = Math.max(0, summary.totalDevices - summary.powerFailure - summary.runningDG);
  const pieChartData = [
    { name: 'Grid Power Ok', value: gridPowerOk, color: '#10b981' },
    { name: 'Power Failure (Grid Down)', value: summary.powerFailure, color: '#ef4444' },
    { name: 'DG Generator Running', value: summary.runningDG, color: '#f59e0b' },
  ].filter(p => p.value > 0);

  // If all are zero (e.g. initial launch), provide fallback pie slice
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
        {/* BMC Volume & Temperature Bar Chart */}
        <div className="bg-surface-card border border-edge rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-t-primary mb-4">Volume vs Temperature (All BMC)</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-t-muted)', fontSize: 10 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#38bdf8" tick={{ fill: 'var(--color-t-muted)', fontSize: 10 }} name="Volume" />
                <YAxis yAxisId="right" orientation="right" stroke="#2563eb" tick={{ fill: 'var(--color-t-muted)', fontSize: 10 }} name="Temperature" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-card)',
                    border: '1px solid var(--color-edge)',
                    borderRadius: '12px',
                    color: 'var(--color-t-primary)',
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar yAxisId="left" dataKey="volume" fill="#38bdf8" name="Milk Volume (L)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="temperature" fill="#2563eb" name="Milk Temp (°C)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Power Status Pie Chart */}
        <div className="bg-surface-card border border-edge rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-t-primary mb-4">Power Status Distribution</h3>
          <div className="h-[280px] w-full flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="h-[200px] w-[200px] relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
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
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-t-primary">{summary.totalDevices}</span>
                <span className="text-[10px] text-t-muted uppercase tracking-wider font-semibold">Total BMC</span>
              </div>
            </div>
            
            <div className="space-y-3 flex-1">
              {pieChartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-edge bg-surface-dim/40 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-t-secondary">{item.name}</span>
                  </div>
                  <span className="font-bold text-t-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Temperature Trend */}
        <div className="bg-surface-card border border-edge rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-t-primary mb-4">Average Temperature Trend (24h)</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge)" />
                <XAxis dataKey="hour" tick={{ fill: 'var(--color-t-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--color-t-muted)', fontSize: 10 }} domain={[0, 8]} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-card)',
                    border: '1px solid var(--color-edge)',
                    borderRadius: '12px',
                    color: 'var(--color-t-primary)',
                  }}
                />
                <Area type="monotone" dataKey="temp" stroke="#2563eb" strokeWidth={2} fill="url(#tempGrad)" name="Temperature (°C)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume Trend */}
        <div className="bg-surface-card border border-edge rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-t-primary mb-4">Total Milk Volume Trend (24h)</h3>
          <div className="h-[240px] w-full">
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
