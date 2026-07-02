import { useState, useEffect, useCallback } from 'react';
import { deviceAPI, reportAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  FileText, Calendar, Monitor, Zap, Fuel, Activity,
  Mail, Send, Play, RefreshCw, X, ChevronDown,
  ClipboardList, BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // 2 reports: 'day-report' | 'logbook'
  const [activeTab, setActiveTab] = useState('day-report');

  // Full report data (fetched once, rendered per tab)
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Email modal
  const [emailModal, setEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(user?.email || '');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Fetch devices on mount
  useEffect(() => {
    deviceAPI.list({ limit: 100 })
      .then(res => {
        const data = res.data?.data || res.data;
        setDevices(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) setSelectedDevice(data[0].id);
      })
      .catch(() => toast.error('Failed to load devices list'));
  }, []);

  // Fetch the full daily report in one API call
  const fetchReport = useCallback(async () => {
    if (!selectedDevice || !selectedDate) return;
    setLoadingReport(true);
    try {
      const res = await reportAPI.getFullDaily({ deviceId: selectedDevice, date: selectedDate });
      setReportData(res.data?.data || res.data);
    } catch (err) {
      toast.error('Failed to fetch report data');
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  }, [selectedDevice, selectedDate]);

  useEffect(() => {
    if (selectedDevice) fetchReport();
  }, [fetchReport, selectedDevice]);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setSendingEmail(true);
    try {
      await reportAPI.emailDailyLog({
        deviceId: selectedDevice,
        date: selectedDate,
        email: recipientEmail,
      });
      toast.success(`Daily logbook report emailed to ${recipientEmail}`);
      setEmailModal(false);
    } catch (err) {
      toast.error('Failed to send report email');
    } finally {
      setSendingEmail(false);
    }
  };

  const tabs = [
    { key: 'day-report', label: 'Device Day Report', icon: BarChart3 },
    { key: 'logbook', label: 'Daily Logbook', icon: ClipboardList },
  ];

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-t-primary flex items-center gap-2">
              <FileText className="text-brand" /> Reports
            </h1>
            <p className="text-sm text-t-secondary">Device day report and daily logbook with auto-email</p>
          </div>
          {selectedDevice && (
            <button
              onClick={() => { setRecipientEmail(user?.email || ''); setEmailModal(true); }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark hover:scale-105 transition-all shadow-button shrink-0"
            >
              <Mail size={16} /> Email Logbook Report
            </button>
          )}
        </div>

        {/* Selector controls */}
        <div className="bg-surface-card border border-edge rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-t-secondary flex items-center gap-1.5">
              <Monitor size={14} /> Target BMC Device
            </label>
            <div className="relative">
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand transition-all appearance-none cursor-pointer pr-10"
              >
                <option value="">Select Device</option>
                {devices.map(d => <option key={d.id} value={d.id}>{d.deviceName} ({d.deviceCode})</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-t-muted pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-t-secondary flex items-center gap-1.5">
              <Calendar size={14} /> Report Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand transition-all"
            />
          </div>

          <button
            onClick={fetchReport}
            disabled={loadingReport}
            className="px-5 py-2.5 bg-surface-dim hover:bg-surface-dim/75 text-t-primary rounded-xl text-sm font-semibold border border-edge flex items-center gap-2 transition-colors hover:border-brand/40 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loadingReport ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* 2 Report Tabs */}
        <div className="flex border-b border-edge">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-t-secondary hover:text-t-primary'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading / Empty */}
        {loadingReport ? (
          <div className="flex items-center justify-center py-20 bg-surface-card border border-edge rounded-2xl">
            <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !reportData ? (
          <div className="flex flex-col items-center justify-center py-20 bg-surface-card border border-edge rounded-2xl">
            <FileText size={48} className="text-t-muted mb-4" />
            <p className="text-t-muted text-sm">Select a device and date to generate report</p>
          </div>
        ) : (
          <div className="animate-fade-in">

            {/* ================================================================ */}
            {/* REPORT 1: DEVICE DAY REPORT                                      */}
            {/* Dispatch Cycles + CIP Cycles + Grid/DG/Diesel/KWH               */}
            {/* ================================================================ */}
            {activeTab === 'day-report' && (
              <div className="space-y-6">

                {/* ---- Power & Energy Section ---- */}
                <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-edge bg-surface-dim/50">
                    <h3 className="text-md font-bold text-t-primary flex items-center gap-2">
                      <Zap size={18} className="text-amber" />
                      Grid / DG / Diesel / KWH Consumption
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {/* Grid Hours */}
                      <div className="bg-surface-dim/40 border border-edge rounded-xl p-4 hover:border-brand/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-emerald">
                          <Zap size={16} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-t-secondary">Grid Hours</span>
                        </div>
                        <div className="text-2xl font-bold text-t-primary">{reportData.powerStats?.gridHours ?? 0} <span className="text-sm font-normal text-t-muted">hrs</span></div>
                      </div>
                      {/* DG Hours */}
                      <div className="bg-surface-dim/40 border border-edge rounded-xl p-4 hover:border-brand/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-amber">
                          <Fuel size={16} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-t-secondary">DG Hours</span>
                        </div>
                        <div className="text-2xl font-bold text-t-primary">{reportData.powerStats?.dgHours ?? 0} <span className="text-sm font-normal text-t-muted">hrs</span></div>
                      </div>
                      {/* Diesel Consumed */}
                      <div className="bg-surface-dim/40 border border-edge rounded-xl p-4 hover:border-brand/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-rose">
                          <Fuel size={16} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-t-secondary">Diesel Consumed</span>
                        </div>
                        <div className="text-2xl font-bold text-t-primary">{reportData.powerStats?.dieselConsumed ?? 0} <span className="text-sm font-normal text-t-muted">L</span></div>
                        <p className="text-[10px] text-t-muted mt-1">Rate: {reportData.powerStats?.dieselAvgRate ?? 0} L/hr</p>
                      </div>
                      {/* Total KWH */}
                      <div className="bg-surface-dim/40 border border-edge rounded-xl p-4 hover:border-brand/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-sky">
                          <Zap size={16} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-t-secondary">Total KWH</span>
                        </div>
                        <div className="text-2xl font-bold text-t-primary">{reportData.powerStats?.kwhConsumed ?? 0} <span className="text-sm font-normal text-t-muted">kWh</span></div>
                      </div>
                    </div>

                    {/* KWH with / without compressor */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="bg-surface-dim/40 border border-edge rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2 text-rose">
                          <Activity size={16} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-t-secondary">KWH with Compressor Load</span>
                        </div>
                        <div className="text-2xl font-bold text-t-primary">{reportData.powerStats?.kwhWithCompressor ?? 0} <span className="text-sm font-normal text-t-muted">kWh</span></div>
                      </div>
                      <div className="bg-surface-dim/40 border border-edge rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2 text-emerald">
                          <Activity size={16} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-t-secondary">KWH without Compressor Load</span>
                        </div>
                        <div className="text-2xl font-bold text-t-primary">{reportData.powerStats?.kwhWithoutCompressor ?? 0} <span className="text-sm font-normal text-t-muted">kWh</span></div>
                      </div>
                    </div>

                    {/* KWH breakdown bar */}
                    {(reportData.powerStats?.kwhConsumed ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-t-secondary mb-2">KWH Breakdown</p>
                        <div className="flex rounded-xl overflow-hidden h-7">
                          <div
                            className="bg-rose flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ width: `${(reportData.powerStats.kwhWithCompressor / reportData.powerStats.kwhConsumed * 100).toFixed(1)}%`, minWidth: reportData.powerStats.kwhWithCompressor > 0 ? '36px' : '0' }}
                          >
                            {reportData.powerStats.kwhWithCompressor > 0 && `${(reportData.powerStats.kwhWithCompressor / reportData.powerStats.kwhConsumed * 100).toFixed(0)}%`}
                          </div>
                          <div
                            className="bg-emerald flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ width: `${(reportData.powerStats.kwhWithoutCompressor / reportData.powerStats.kwhConsumed * 100).toFixed(1)}%`, minWidth: reportData.powerStats.kwhWithoutCompressor > 0 ? '36px' : '0' }}
                          >
                            {reportData.powerStats.kwhWithoutCompressor > 0 && `${(reportData.powerStats.kwhWithoutCompressor / reportData.powerStats.kwhConsumed * 100).toFixed(0)}%`}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 mt-2">
                          <span className="flex items-center gap-1.5 text-[11px] text-t-secondary"><span className="w-2.5 h-2.5 rounded-sm bg-rose inline-block" /> Compressor ({reportData.powerStats.kwhWithCompressor} kWh)</span>
                          <span className="flex items-center gap-1.5 text-[11px] text-t-secondary"><span className="w-2.5 h-2.5 rounded-sm bg-emerald inline-block" /> No Compressor ({reportData.powerStats.kwhWithoutCompressor} kWh)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ---- Dispatch Cycles Section ---- */}
                <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-edge bg-surface-dim/50">
                    <h3 className="text-md font-bold text-t-primary flex items-center gap-2">
                      <Play size={18} className="text-brand" />
                      Dispatch Cycles — Milk Temperature & Volume
                    </h3>
                    <p className="text-xs text-t-muted mt-1">Dispatch start time to end time, volume dispatched, avg temperature</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-surface-dim border-b border-edge text-xs font-semibold uppercase tracking-wider text-t-secondary">
                          <th className="px-5 py-3.5">#</th>
                          <th className="px-5 py-3.5">Start Time</th>
                          <th className="px-5 py-3.5">End Time</th>
                          <th className="px-5 py-3.5">Volume Dispatched</th>
                          <th className="px-5 py-3.5">Avg Milk Temp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-edge text-t-primary">
                        {reportData.dispatchCycles?.map((c, idx) => (
                          <tr key={idx} className="hover:bg-surface-dim/40 transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-t-muted">{idx + 1}</td>
                            <td className="px-5 py-3.5 font-mono">{new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-5 py-3.5 font-mono">{new Date(c.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-5 py-3.5 font-bold text-sky">{c.volumeDispatched?.toLocaleString()} L</td>
                            <td className="px-5 py-3.5 font-semibold">{c.avgTemperature?.toFixed(1)}°C</td>
                          </tr>
                        ))}
                        {(!reportData.dispatchCycles || reportData.dispatchCycles.length === 0) && (
                          <tr><td colSpan={5} className="text-center py-12 text-t-muted">No dispatch cycles recorded for this day</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ---- CIP Cycles Section ---- */}
                <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-edge bg-surface-dim/50">
                    <h3 className="text-md font-bold text-t-primary flex items-center gap-2">
                      <BarChart3 size={18} className="text-sky" />
                      CIP Cycles
                    </h3>
                    <p className="text-xs text-t-muted mt-1">Start time to end time, volume dispatched, avg temperature</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-surface-dim border-b border-edge text-xs font-semibold uppercase tracking-wider text-t-secondary">
                          <th className="px-5 py-3.5">#</th>
                          <th className="px-5 py-3.5">Start Time</th>
                          <th className="px-5 py-3.5">End Time</th>
                          <th className="px-5 py-3.5">Volume Dispatched</th>
                          <th className="px-5 py-3.5">Avg Temperature</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-edge text-t-primary">
                        {reportData.cipCycles?.map((c, idx) => (
                          <tr key={idx} className="hover:bg-surface-dim/40 transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-t-muted">{idx + 1}</td>
                            <td className="px-5 py-3.5 font-mono">{new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-5 py-3.5 font-mono">{new Date(c.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-5 py-3.5 font-bold text-sky">{c.volumeDispatched?.toLocaleString()} L</td>
                            <td className="px-5 py-3.5 font-semibold text-brand">{c.avgTemperature?.toFixed(1)}°C</td>
                          </tr>
                        ))}
                        {(!reportData.cipCycles || reportData.cipCycles.length === 0) && (
                          <tr><td colSpan={5} className="text-center py-12 text-t-muted">No CIP cycles recorded for this day</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ================================================================ */}
            {/* REPORT 2: DAILY LOGBOOK (all data of particular day)             */}
            {/* Auto-emailed daily at midnight                                   */}
            {/* ================================================================ */}
            {activeTab === 'logbook' && (
              <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-edge bg-surface-dim/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-md font-bold text-t-primary flex items-center gap-2">
                      <ClipboardList size={18} className="text-brand" />
                      Daily Logbook — {reportData.device?.deviceName}
                    </h3>
                    <p className="text-xs text-t-muted mt-1">All data of {reportData.date} • Auto-emailed daily at midnight</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-surface-dim border-b border-edge text-xs font-semibold uppercase tracking-wider text-t-secondary">
                        <th className="px-5 py-3.5">Time</th>
                        <th className="px-5 py-3.5">Milk Temp</th>
                        <th className="px-5 py-3.5">Water Temp</th>
                        <th className="px-5 py-3.5">Volume</th>
                        <th className="px-5 py-3.5">Grid</th>
                        <th className="px-5 py-3.5">DG</th>
                        <th className="px-5 py-3.5">KWH</th>
                        <th className="px-5 py-3.5">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-edge text-t-primary">
                      {reportData.logs?.map((log, idx) => (
                        <tr key={idx} className="hover:bg-surface-dim/40 transition-colors">
                          <td className="px-5 py-3 font-mono font-medium">
                            {new Date(log._time || log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`font-semibold ${log.milk_temperature > 8 ? 'text-rose font-bold' : ''}`}>
                              {log.milk_temperature?.toFixed(1)}°C
                            </span>
                          </td>
                          <td className="px-5 py-3 text-t-secondary">{log.water_temperature?.toFixed(1)}°C</td>
                          <td className="px-5 py-3 font-semibold text-sky">{log.milk_volume?.toLocaleString()} L</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${log.grid_status ? 'bg-emerald/15 text-emerald' : 'bg-rose/15 text-rose'}`}>
                              {log.grid_status ? 'OK' : 'FAIL'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${log.dg_status ? 'bg-amber/15 text-amber' : 'bg-surface-dim text-t-muted'}`}>
                              {log.dg_status ? 'RUN' : 'OFF'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-t-secondary font-mono text-xs">{log.kwh?.toFixed(1)}</td>
                          <td className="px-5 py-3">
                            {log.cip_status ? (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-blue/15 text-blue-500">CIP</span>
                            ) : log.dispatch_status ? (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-brand/15 text-brand">DISPATCH</span>
                            ) : (
                              <span className="text-t-muted text-xs">Cooling</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!reportData.logs || reportData.logs.length === 0) && (
                        <tr><td colSpan={8} className="text-center py-16 text-t-muted">No hourly log records available for this date</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Email Modal — sends Daily Logbook report */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setEmailModal(false)}>
          <div className="bg-surface-card border border-edge rounded-2xl p-6 w-full max-w-md animate-fade-in-scale space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-edge pb-3">
              <h3 className="text-lg font-bold text-t-primary flex items-center gap-2">
                <Send size={18} className="text-brand" /> Email Daily Logbook
              </h3>
              <button onClick={() => setEmailModal(false)} className="p-1.5 rounded-lg text-t-muted hover:text-t-primary hover:bg-surface-dim transition-colors">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-t-secondary">
              Sends the full daily logbook report for <strong>{reportData?.device?.deviceName}</strong> on <strong>{selectedDate}</strong> via email.
            </p>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary">Recipient Email</label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. admin@example.com"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEmailModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-surface-dim text-t-primary border border-edge hover:border-t-muted transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={sendingEmail}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-brand text-white shadow-button hover:bg-brand-dark hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {sendingEmail ? 'Sending...' : 'Send Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
