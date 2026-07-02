import { useState, useEffect } from 'react';
import { alertAPI } from '../../api';
import { Bell, CheckCircle, AlertTriangle, AlertOctagon, Info, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const severityConfig = {
  info: { icon: Info, color: 'var(--color-info)', bg: 'rgba(102,204,255,0.1)' },
  warning: { icon: AlertTriangle, color: 'var(--color-warning)', bg: 'rgba(255,204,0,0.1)' },
  critical: { icon: AlertOctagon, color: 'var(--color-danger)', bg: 'rgba(255,68,68,0.1)' },
  emergency: { icon: AlertOctagon, color: '#ff0000', bg: 'rgba(255,0,0,0.15)' },
};

export default function AlertListPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unacknowledged');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filter === 'unacknowledged') params.acknowledged = 'false';
      if (filter === 'acknowledged') params.acknowledged = 'true';
      const res = await alertAPI.list(params);
      setAlerts(res.data);
    } catch (err) { toast.error('Failed to fetch alerts'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, [filter]);

  const handleAcknowledge = async (id) => {
    try { await alertAPI.acknowledge(id); toast.success('Alert acknowledged'); fetchAlerts(); }
    catch (err) { toast.error('Failed'); }
  };

  const handleAcknowledgeAll = async () => {
    try { await alertAPI.acknowledgeAll(); toast.success('All alerts acknowledged'); fetchAlerts(); }
    catch (err) { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Alerts</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Monitor device alerts and notifications</p>
        </div>
        <button onClick={handleAcknowledgeAll}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:scale-105 transition-all"
          style={{ background: 'var(--color-success)' }}>
          <CheckCircle size={18} /> Acknowledge All
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['unacknowledged', 'acknowledged', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
            style={{
              background: filter === f ? 'var(--color-primary)' : 'var(--bg-card)',
              color: filter === f ? 'white' : 'var(--text-secondary)',
              border: filter === f ? 'none' : '1px solid var(--border-color)',
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity] || severityConfig.info;
          const Icon = config.icon;
          return (
            <div key={alert.id} className="rounded-2xl p-4 flex items-start gap-4 transition-all hover:shadow-md"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeftWidth: '4px', borderLeftColor: config.color }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: config.bg }}>
                <Icon size={20} style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{alert.message}</span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase text-white" style={{ background: config.color }}>
                    {alert.severity}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{alert.device?.deviceName || alert.device?.deviceCode}</span>
                  <span>•</span>
                  <span>{alert.type?.replace(/_/g, ' ')}</span>
                  <span>•</span>
                  <span>{alert.createdAt ? formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true }) : ''}</span>
                </div>
              </div>
              {!alert.acknowledged && (
                <button onClick={() => handleAcknowledge(alert.id)}
                  className="p-2 rounded-xl hover:bg-green-500/10 transition-colors shrink-0" style={{ color: 'var(--color-success)' }}>
                  <Check size={18} />
                </button>
              )}
              {alert.acknowledged && (
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(51,204,153,0.1)', color: 'var(--color-success)' }}>
                  ✓ Acknowledged
                </span>
              )}
            </div>
          );
        })}

        {alerts.length === 0 && !loading && (
          <div className="text-center py-16">
            <Bell size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>No alerts</p>
          </div>
        )}
      </div>
    </div>
  );
}
