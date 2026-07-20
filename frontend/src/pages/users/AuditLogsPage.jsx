import { useState, useEffect, useCallback } from 'react';
import { auditAPI } from '../../api';
import { Search, Calendar, Shield, Cpu, RefreshCw, Eye, X, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Inspector modal
  const [inspectLog, setInspectLog] = useState(null);

  const fetchLogs = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        limit: 20,
        search: search || undefined,
        action: action || undefined,
        entity: entity || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await auditAPI.list(params);
      setLogs(res.data || []);
      setPagination(res.pagination);
      setPage(targetPage);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [search, action, entity, startDate, endDate]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const params = {
        page: 1,
        limit: 5000,
        search: search || undefined,
        action: action || undefined,
        entity: entity || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await auditAPI.list(params);
      const exportLogs = res.data || [];

      if (exportLogs.length === 0) {
        toast.error('No logs to export');
        return;
      }

      let csv = 'Timestamp,User,Email,Role,Action,Entity,IP Address,User Agent\n';
      exportLogs.forEach((log) => {
        const time = new Date(log.createdAt).toLocaleString().replace(/"/g, '""');
        const name = (log.user?.name || 'System').replace(/"/g, '""');
        const email = (log.user?.email || 'N/A').replace(/"/g, '""');
        const role = (log.user?.role || 'N/A').replace(/"/g, '""');
        const actionStr = (log.action || '').replace(/"/g, '""');
        const entityStr = (log.entity || '').replace(/"/g, '""');
        const ip = (log.ipAddress || '').replace(/"/g, '""');
        const ua = (log.userAgent || '').replace(/"/g, '""');

        csv += `"${time}","${name}","${email}","${role}","${actionStr}","${entityStr}","${ip}","${ua}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `BMC_AuditLogs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Audit logs exported successfully');
    } catch (err) {
      toast.error('Failed to export audit logs');
    } finally {
      setLoading(false);
    }
  };

  const actionColors = {
    LOGIN: 'bg-emerald/15 text-emerald border border-emerald/20',
    FAILED_LOGIN: 'bg-rose/15 text-rose border border-rose/20',
    ACCOUNT_LOCKOUT: 'bg-rose/20 text-rose border border-rose/30 font-bold',
    LOGOUT: 'bg-surface-dim text-t-muted border border-edge',
    CREATE: 'bg-sky/15 text-sky border border-sky/20',
    UPDATE: 'bg-brand/15 text-brand border border-brand/20',
    DELETE: 'bg-rose/15 text-rose border border-rose/20',
    CALIBRATION: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
    ALERT_CONFIG_CHANGE: 'bg-amber/15 text-amber border border-amber/20',
    SNAPSHOT_UPLOAD: 'bg-blue/15 text-blue-500 border border-blue-500/20',
    FORCE_LOGOUT: 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-t-primary flex items-center gap-2">
            <Shield className="text-brand animate-pulse-glow" size={24} /> Audit Logging Records
          </h1>
          <p className="text-sm text-t-secondary">Security activities, configuration updates, and portal mutation records</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchLogs(page)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-edge bg-surface-card text-t-primary text-sm font-medium hover:bg-surface-dim transition-all cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald text-white text-sm font-semibold hover:bg-emerald/90 transition-all shadow-button cursor-pointer"
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Query Filters */}
      <div className="bg-surface-card border border-edge rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actions/IP..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-surface-input border border-edge text-t-primary placeholder:text-t-muted outline-none focus:border-brand transition-all"
            />
          </div>

          {/* Action Filter */}
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-surface-input border border-edge text-t-primary outline-none focus:border-brand cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="FAILED_LOGIN">FAILED LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="CALIBRATION">CALIBRATION</option>
            <option value="ALERT_CONFIG_CHANGE">ALERT CONFIG CHANGE</option>
            <option value="ACCOUNT_LOCKOUT">ACCOUNT LOCKOUT</option>
            <option value="FORCE_LOGOUT">FORCE LOGOUT</option>
          </select>

          {/* Entity Filter */}
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-surface-input border border-edge text-t-primary outline-none focus:border-brand cursor-pointer"
          >
            <option value="">All Entities</option>
            <option value="User">User</option>
            <option value="Device">Device</option>
            <option value="Region">Region</option>
            <option value="SubRegion">SubRegion</option>
            <option value="Route">Route</option>
          </select>

          {/* Start Date */}
          <div className="relative flex items-center">
            <Calendar size={14} className="absolute left-3 text-t-muted pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-surface-input border border-edge text-t-primary outline-none focus:border-brand transition-all"
            />
          </div>

          {/* End Date */}
          <div className="relative flex items-center">
            <Calendar size={14} className="absolute left-3 text-t-muted pointer-events-none" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-surface-input border border-edge text-t-primary outline-none focus:border-brand transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-surface-dim border-b border-edge font-semibold uppercase tracking-wider text-t-secondary">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User Operator</th>
                <th className="px-6 py-4">Security Action</th>
                <th className="px-6 py-4">Entity Type</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">User Agent</th>
                <th className="px-6 py-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const timeStr = new Date(log.createdAt).toLocaleString();
                const isSystem = !log.userId;
                return (
                  <tr
                    key={log.id}
                    className="border-t border-edge hover:bg-surface-dim/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-t-secondary whitespace-nowrap">{timeStr}</td>
                    <td className="px-6 py-4">
                      {isSystem ? (
                        <div className="flex items-center gap-2">
                          <Cpu size={14} className="text-t-muted" />
                          <span className="font-semibold text-t-muted">SYSTEM</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-[10px]">
                            {log.user?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-t-primary">{log.user?.name}</p>
                            <p className="text-[10px] text-t-muted">{log.user?.email}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${actionColors[log.action] || 'bg-surface-dim text-t-muted'}`}>
                        {log.action?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-t-secondary">{log.entity || '-'}</td>
                    <td className="px-6 py-4 font-mono text-t-secondary">{log.ipAddress || '-'}</td>
                    <td className="px-6 py-4 text-t-muted max-w-xs truncate" title={log.userAgent}>
                      {log.userAgent || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(log.oldValues || log.newValues) ? (
                        <button
                          onClick={() => setInspectLog(log)}
                          className="p-1.5 rounded-lg text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                          title="Inspect JSON values"
                        >
                          <Eye size={14} />
                        </button>
                      ) : (
                        <span className="text-t-muted text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-t-muted font-medium">
                    No audit records found matching criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-edge flex items-center justify-between bg-surface-dim/30">
            <span className="text-[10px] text-t-muted">
              Page {page} of {pagination.totalPages} ({pagination.totalItems} total logs)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchLogs(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-edge bg-surface-card hover:bg-surface-dim disabled:opacity-40 text-xs font-semibold cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => fetchLogs(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-edge bg-surface-card hover:bg-surface-dim disabled:opacity-40 text-xs font-semibold cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Values Inspector Modal */}
      {inspectLog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setInspectLog(null)}
        >
          <div
            className="bg-surface-card border border-edge rounded-2xl p-6 w-full max-w-2xl animate-fade-in-scale space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-edge pb-3">
              <div>
                <h3 className="text-md font-bold text-t-primary flex items-center gap-1.5">
                  Inspect Activity Data — {inspectLog.action}
                </h3>
                <p className="text-[10px] text-t-muted mt-0.5">Timestamp: {new Date(inspectLog.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="p-1.5 rounded-lg text-t-muted hover:text-t-primary hover:bg-surface-dim transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Old Values */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose">Old Values (Before Mutation)</span>
                <div className="p-3 bg-surface-dim rounded-xl border border-edge overflow-auto max-h-[300px] font-mono text-[11px] text-rose">
                  {inspectLog.oldValues ? (
                    <pre>{JSON.stringify(inspectLog.oldValues, null, 2)}</pre>
                  ) : (
                    <span className="text-t-muted italic">No initial values recorded</span>
                  )}
                </div>
              </div>

              {/* New Values */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald">New Values (Payload)</span>
                <div className="p-3 bg-surface-dim rounded-xl border border-edge overflow-auto max-h-[300px] font-mono text-[11px] text-emerald">
                  {inspectLog.newValues ? (
                    <pre>{JSON.stringify(inspectLog.newValues, null, 2)}</pre>
                  ) : (
                    <span className="text-t-muted italic">No payload values recorded</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-edge">
              <button
                onClick={() => setInspectLog(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-surface-dim text-t-primary border border-edge hover:border-t-muted transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
