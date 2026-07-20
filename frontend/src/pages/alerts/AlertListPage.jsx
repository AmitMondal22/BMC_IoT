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
    color: '#0284c7', // sky-600
    bg: 'rgba(14,165,233,0.08)',
    border: 'border-sky-500',
    badge: 'bg-sky-50 text-sky-700 border border-sky-200/50 dark:bg-sky-500/10 dark:text-sky-400 dark:border-transparent'
  },
  warning: {
    icon: AlertTriangle,
    color: '#d97706', // amber-600
    bg: 'rgba(217,119,6,0.08)',
    border: 'border-amber-600',
    badge: 'bg-amber-50 text-amber-800 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-transparent'
  },
  critical: {
    icon: AlertOctagon,
    color: '#e11d48', // rose-600
    bg: 'rgba(225,29,72,0.08)',
    border: 'border-rose-600',
    badge: 'bg-rose-50 text-rose-700 border border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-transparent'
  },
  emergency: {
    icon: AlertOctagon,
    color: '#dc2626', // red-600
    bg: 'rgba(220,38,38,0.12)',
    border: 'border-red-600',
    badge: 'bg-red-50 text-red-700 border border-red-200/50 dark:bg-red-600/15 dark:text-red-400 dark:border-transparent font-extrabold animate-pulse'
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
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center dark:bg-red-500/10 dark:text-red-400 dark:border-transparent">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="text-xs text-t-secondary font-medium">Critical Issues</div>
              <div className="text-lg font-bold text-t-primary">{counts.critical}</div>
            </div>
          </div>

          <div className="bg-surface-card border border-edge rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 flex items-center justify-center dark:bg-amber-500/10 dark:text-amber-400 dark:border-transparent">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="text-xs text-t-secondary font-medium">Warnings</div>
              <div className="text-lg font-bold text-t-primary">{counts.warning}</div>
            </div>
          </div>

          <div className="bg-surface-card border border-edge rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center dark:bg-sky-500/10 dark:text-sky-400 dark:border-transparent">
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
                  ? 'bg-brand text-gray-950 font-bold shadow-button'
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
        <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-surface-dim font-semibold text-t-secondary border-b border-edge">
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Device</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Triggered</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => {
                  const config = severityConfig[alert.severity] || severityConfig.info;
                  const Icon = config.icon;
                  
                  return (
                    <tr key={alert.id} className="border-t border-edge hover:bg-surface-dim/40 transition-colors">
                      {/* Severity Column */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg flex items-center justify-center w-fit gap-1.5 text-[10px] font-extrabold uppercase tracking-wider ${config.badge}`}>
                          <Icon size={12} style={{ color: config.color }} />
                          {alert.severity}
                        </span>
                      </td>
                      
                      {/* Device Column */}
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-brand/10 text-brand border border-brand/20">
                          {alert.device?.deviceName || alert.device?.deviceCode || 'System'}
                        </span>
                      </td>

                      {/* Message Column */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="font-medium text-t-primary text-[13px] block leading-tight">
                            {alert.message}
                          </span>
                          <span className="inline-flex items-center gap-1 uppercase font-semibold text-[9px] text-t-secondary tracking-wide bg-surface-dim/70 px-1.5 py-0.5 rounded border border-edge/30">
                            <Radio size={10} className="shrink-0 text-brand" />
                            {alert.type?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Triggered Column */}
                      <td className="px-6 py-4 text-t-secondary text-xs">
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} className="shrink-0 text-t-muted" />
                          {alert.createdAt ? formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true }) : 'just now'}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {!alert.acknowledged ? (
                            <button
                              onClick={() => handleAcknowledge(alert.id)}
                              title="Mark as Acknowledged"
                              className="p-1.5 rounded-lg border border-emerald/20 text-emerald hover:bg-emerald/10 hover:border-emerald/40 transition-all cursor-pointer"
                            >
                              <Check size={14} className="stroke-[2.5]" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald/10 text-emerald text-[10px] font-bold uppercase tracking-wider select-none">
                              <Check size={12} className="stroke-[3]" />
                              Ack
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-20 bg-surface-card">
                      <div className="w-16 h-16 rounded-full bg-emerald/10 flex items-center justify-center text-emerald mx-auto mb-4 animate-bounce">
                        <CheckCircle2 size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-t-primary">System Secure</h3>
                      <p className="text-sm text-t-secondary mt-1">No active unacknowledged alerts found on this filter.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
