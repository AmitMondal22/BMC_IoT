import { useState, useEffect } from 'react';
import { alertAPI } from '../../api';
import {
  Bell, CheckCircle2, AlertTriangle, AlertOctagon, Info, Check,
  Clock, ShieldAlert, Laptop, Radio
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const severityConfig = {
  info: {
    icon: Info,
    color: '#06b6d4', // cyan-500
    bg: 'rgba(6,182,212,0.08)',
    border: 'border-cyan-500',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
  },
  warning: {
    icon: AlertTriangle,
    color: '#f59e0b', // amber-500
    bg: 'rgba(245,158,11,0.08)',
    border: 'border-amber-500',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  },
  critical: {
    icon: AlertOctagon,
    color: '#ef4444', // red-500
    bg: 'rgba(239,68,68,0.08)',
    border: 'border-red-500',
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400'
  },
  emergency: {
    icon: AlertOctagon,
    color: '#dc2626', // red-600
    bg: 'rgba(220,38,38,0.12)',
    border: 'border-red-600',
    badge: 'bg-red-600/15 text-red-700 dark:text-red-400 font-extrabold animate-pulse'
  },
};

export default function AlertListPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unacknowledged');

  // Count summaries
  const [counts, setCounts] = useState({ critical: 0, warning: 0, info: 0 });

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filter === 'unacknowledged') params.acknowledged = 'false';
      if (filter === 'acknowledged') params.acknowledged = 'true';
      
      const res = await alertAPI.list(params);
      const data = res.data?.data || res.data || [];
      setAlerts(data);

      // Recalculate summary metrics from current fetched list
      const crit = data.filter(a => a.severity === 'critical' || a.severity === 'emergency').length;
      const warn = data.filter(a => a.severity === 'warning').length;
      const inf = data.filter(a => a.severity === 'info').length;
      setCounts({ critical: crit, warning: warn, info: inf });

    } catch (err) {
      toast.error('Failed to fetch alerts list');
    } finally {
      setLoadingReportFalse();
    }
  };

  // Helper workaround to resolve state cleanly
  const setLoadingReportFalse = () => {
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const handleAcknowledge = async (id) => {
    try {
      await alertAPI.acknowledge(id);
      toast.success('Alert marked as acknowledged');
      fetchAlerts();
    } catch (err) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleAcknowledgeAll = async () => {
    if (alerts.length === 0) return;
    try {
      await alertAPI.acknowledgeAll();
      toast.success('All active alerts marked as acknowledged');
      fetchAlerts();
    } catch (err) {
      toast.error('Failed to acknowledge alerts');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-t-primary flex items-center gap-2">
            <Bell className="text-brand shrink-0" /> Alert Center
          </h1>
          <p className="text-sm text-t-secondary">Real-time alerts, critical warnings, and operational notifications</p>
        </div>
        {filter === 'unacknowledged' && alerts.length > 0 && (
          <button
            onClick={handleAcknowledgeAll}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald hover:bg-emerald/90 text-white text-sm font-semibold hover:scale-102 transition-all shadow-button cursor-pointer"
          >
            <CheckCircle2 size={16} /> Acknowledge All
          </button>
        )}
      </div>

      {/* Quick stats indicators */}
      {filter === 'unacknowledged' && alerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-card border border-edge rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="text-xs text-t-secondary font-medium">Critical Issues</div>
              <div className="text-lg font-bold text-t-primary">{counts.critical}</div>
            </div>
          </div>

          <div className="bg-surface-card border border-edge rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="text-xs text-t-secondary font-medium">Warnings</div>
              <div className="text-lg font-bold text-t-primary">{counts.warning}</div>
            </div>
          </div>

          <div className="bg-surface-card border border-edge rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Info size={20} />
            </div>
            <div>
              <div className="text-xs text-t-secondary font-medium">Informational</div>
              <div className="text-lg font-bold text-t-primary">{counts.info}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 bg-surface-card border border-edge rounded-2xl">
        <div className="flex gap-1">
          {[
            { key: 'unacknowledged', label: 'Active Alerts' },
            { key: 'acknowledged', label: 'Acknowledged Log' },
            { key: 'all', label: 'All History' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                filter === tab.key
                  ? 'bg-brand text-white shadow-button'
                  : 'text-t-secondary hover:text-t-primary hover:bg-surface-dim'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchAlerts}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-surface-dim hover:bg-surface-dim/75 border border-edge rounded-xl text-xs font-semibold text-t-primary transition-colors cursor-pointer"
        >
          <Clock size={14} /> Refresh Feed
        </button>
      </div>

      {/* Alert Feed List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-surface-card border border-edge rounded-2xl">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3.5">
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity] || severityConfig.info;
            const Icon = config.icon;
            
            return (
              <div
                key={alert.id}
                className={`bg-surface-card border border-edge hover:border-brand/20 rounded-2xl p-4.5 flex items-start gap-4 transition-all duration-200 shadow-sm border-l-4 ${config.border} hover:-translate-y-0.5`}
              >
                {/* Alert Icon Bubble */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
                  style={{ backgroundColor: config.bg }}
                >
                  <Icon size={20} style={{ color: config.color }} />
                </div>

                {/* Content Block */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-bold text-[14px] text-t-primary leading-tight">
                      {alert.message}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${config.badge}`}>
                      {alert.severity}
                    </span>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-t-muted">
                    <span className="flex items-center gap-1.5 hover:text-brand transition-colors">
                      <Laptop size={13} className="shrink-0" />
                      {alert.device?.deviceName || alert.device?.deviceCode || 'System Controller'}
                    </span>
                    <span className="text-edge font-normal select-none">•</span>
                    <span className="flex items-center gap-1.5 uppercase font-semibold text-[10px] text-t-secondary tracking-wide">
                      <Radio size={13} className="shrink-0 text-brand" />
                      {alert.type?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-edge font-normal select-none">•</span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock size={13} className="shrink-0" />
                      {alert.createdAt ? formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true }) : 'just now'}
                    </span>
                  </div>
                </div>

                {/* Operations Actions */}
                <div className="shrink-0 pl-2">
                  {!alert.acknowledged ? (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      title="Mark as Acknowledged"
                      className="p-2.5 rounded-xl border border-emerald/20 text-emerald hover:bg-emerald/10 hover:border-emerald/40 transition-all cursor-pointer"
                    >
                      <Check size={16} className="stroke-[2.5]" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald/10 text-emerald text-xs font-bold uppercase tracking-wider select-none">
                      <Check size={14} className="stroke-[3]" />
                      Ack
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {alerts.length === 0 && (
            <div className="text-center py-20 bg-surface-card border border-edge rounded-2xl flex flex-col items-center justify-center shadow-inner">
              <div className="w-16 h-16 rounded-full bg-emerald/10 flex items-center justify-center text-emerald mb-4 animate-bounce">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-t-primary">System Secure</h3>
              <p className="text-sm text-t-secondary mt-1">No active unacknowledged alerts found on this filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
