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
  
  // Date Range pickers: From Date & To Date
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

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

  // Fetch the full report over a date range in one API call
  const fetchReport = useCallback(async () => {
    if (!selectedDevice) {
      toast.error('Please select a device');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Please select both Start and End dates');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start Date cannot be after End Date');
      return;
    }

    setLoadingReport(true);
    try {
      const res = await reportAPI.getFullDaily({
        deviceId: selectedDevice,
        startDate: startDate,
        endDate: endDate
      });
      setReportData(res.data?.data || res.data);
    } catch (err) {
      toast.error('Failed to fetch report data');
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  }, [selectedDevice, startDate, endDate]);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setSendingEmail(true);
    try {
      // Email works for a specific date (auto-sends single daily logbook report)
      await reportAPI.emailDailyLog({
        deviceId: selectedDevice,
        date: startDate,
        email: recipientEmail,
      });
      toast.success(`Logbook report for ${startDate} emailed to ${recipientEmail}`);
      setEmailModal(false);
    } catch (err) {
      toast.error('Failed to send report email');
    } finally {
      setSendingEmail(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = "";
    const filename = `${reportData.device?.deviceName || 'Device'}_Report_${formatPeriodText().replace(/\s+/g, '_')}.csv`;

    if (activeTab === 'day-report') {
      csvContent += `DEVICE DAY REPORT SUMMARY\n`;
      csvContent += `Device Name,"${reportData.device?.deviceName || ''}"\n`;
      csvContent += `Device Code,"${reportData.device?.deviceCode || ''}"\n`;
      csvContent += `Period,"${formatPeriodText()}"\n\n`;

      csvContent += `POWER & RESOURCE SUMMARY\n`;
      csvContent += `Grid Hours,"${reportData.powerStats?.gridHours || 0} hrs"\n`;
      csvContent += `DG Hours,"${reportData.powerStats?.dgHours || 0} hrs"\n`;
      csvContent += `Diesel Consumed,"${reportData.powerStats?.dieselConsumed || 0} L (Rate: ${reportData.powerStats?.dieselAvgRate || 0} L/hr)"\n`;
      csvContent += `Total Energy,"${reportData.powerStats?.kwhConsumed || 0} kWh"\n`;
      csvContent += `Energy With Compressor,"${reportData.powerStats?.kwhWithCompressor || 0} kWh"\n`;
      csvContent += `Energy Without Compressor,"${reportData.powerStats?.kwhWithoutCompressor || 0} kWh"\n\n`;

      csvContent += `MILK VOLUME & SESSION SUMMARY\n`;
      csvContent += `Volume Before Morning Session,"${reportData.sessionVolumes?.morningVolume ?? 0} L"\n`;
      csvContent += `Volume After Evening Session,"${reportData.sessionVolumes?.eveningVolume ?? 0} L"\n\n`;

      csvContent += `MILK DISPATCH CYCLES\n`;
      csvContent += `#,Start Time,End Time,Volume Dispatched (L),Avg Temperature (°C)\n`;
      if (reportData.dispatchCycles && reportData.dispatchCycles.length > 0) {
        reportData.dispatchCycles.forEach((c, idx) => {
          csvContent += `${idx + 1},"${new Date(c.startTime).toLocaleString()}","${new Date(c.endTime).toLocaleString()}",${c.volumeDispatched},${c.avgTemperature}\n`;
        });
      } else {
        csvContent += `No dispatch cycles recorded for this period.\n`;
      }
      csvContent += `\n`;

      csvContent += `CIP CLEANING CYCLES\n`;
      csvContent += `#,Start Time,End Time,Max Temperature (°C)\n`;
      if (reportData.cipCycles && reportData.cipCycles.length > 0) {
        reportData.cipCycles.forEach((c, idx) => {
          csvContent += `${idx + 1},"${new Date(c.startTime).toLocaleString()}","${new Date(c.endTime).toLocaleString()}",${c.maxTemperature}\n`;
        });
      } else {
        csvContent += `No CIP cleaning cycles recorded for this period.\n`;
      }

    } else {
      csvContent += `DAILY LOGBOOK TELEMETRY LOGS\n`;
      csvContent += `Device Name,"${reportData.device?.deviceName || ''}"\n`;
      csvContent += `Device Code,"${reportData.device?.deviceCode || ''}"\n`;
      csvContent += `Period,"${formatPeriodText()}"\n\n`;

      csvContent += `Date & Time,Milk Temp (°C),Water Temp (°C),Volume (L),Grid Status,DG Status,Energy (kWh),Mode\n`;
      if (reportData.logs && reportData.logs.length > 0) {
        reportData.logs.forEach((log) => {
          const timeStr = new Date(log._time || log.timestamp).toLocaleString();
          const mode = log.cip_status ? 'CIP' : log.dispatch_status ? 'DISPATCH' : 'Cooling';
          csvContent += `"${timeStr}",${log.milk_temperature?.toFixed(1)},${log.water_temperature?.toFixed(1)},${log.milk_volume},${log.grid_status ? 'OK' : 'FAIL'},${log.dg_status ? 'RUNNING' : 'OFF'},${log.kwh?.toFixed(1)},"${mode}"\n`;
        });
      } else {
        csvContent += `No log entries available for this period.\n`;
      }
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report successfully exported to Excel (CSV)');
  };

  const tabs = [
    { key: 'day-report', label: 'Device Day Report', icon: BarChart3 },
    { key: 'logbook', label: 'Daily Logbook', icon: ClipboardList },
  ];

  const formatPeriodText = () => {
    if (!reportData) return '';
    const start = reportData.startDate;
    const end = reportData.endDate;
    return start === end ? start : `${start} to ${end}`;
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-t-primary flex items-center gap-2">
              <FileText className="text-brand" /> Reports & Analytics
            </h1>
            <p className="text-sm text-t-secondary">Generate date range reports for device daily efficiency and logbook data</p>
          </div>
          {selectedDevice && reportData && (
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={exportToCSV}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald text-white text-sm font-semibold hover:bg-emerald/90 hover:scale-105 transition-all shadow-button shrink-0 cursor-pointer"
              >
                <FileText size={16} /> Export Excel
              </button>
              <button
                onClick={() => { setRecipientEmail(user?.email || ''); setEmailModal(true); }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark hover:scale-105 transition-all shadow-button shrink-0 cursor-pointer"
              >
                <Mail size={16} /> Email Logbook Report
              </button>
            </div>
          )}
        </div>

        {/* Selector controls */}
        <form onSubmit={(e) => { e.preventDefault(); fetchReport(); }} className="bg-surface-card border border-edge rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end shadow-sm">
          {/* Target Device */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-t-secondary flex items-center gap-1.5">
              <Monitor size={14} /> Target BMC Device
            </label>
            <div className="relative">
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand transition-all appearance-none cursor-pointer pr-10"
              >
                <option value="">Select Device</option>
                {devices.map(d => <option key={d.id} value={d.id}>{d.deviceName} ({d.deviceCode})</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-t-muted pointer-events-none" />
            </div>
          </div>

          {/* From Date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-t-secondary flex items-center gap-1.5">
              <Calendar size={14} /> From Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand transition-all"
            />
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-t-secondary flex items-center gap-1.5">
              <Calendar size={14} /> To Date
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand transition-all"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loadingReport}
            className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-button disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={16} className={loadingReport ? 'animate-spin' : ''} /> Generate Report
          </button>
        </form>

        {/* 2 Report Tabs */}
        {reportData && (
          <div className="flex border-b border-edge">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap cursor-pointer ${
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
        )}

        {/* Loading / Empty */}
        {loadingReport ? (
          <div className="flex items-center justify-center py-20 bg-surface-card border border-edge rounded-2xl">
            <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !reportData ? (
          <div className="flex flex-col items-center justify-center py-20 bg-surface-card border border-edge rounded-2xl">
            <FileText size={48} className="text-t-muted mb-4" />
            <h3 className="font-bold text-t-primary text-md">No Report Generated</h3>
            <p className="text-t-muted text-xs mt-1">Select target device and date range to query report data</p>
          </div>
        ) : (
          <div className="animate-fade-in">

            {/* ================================================================ */}
            {/* REPORT 1: DEVICE DAY REPORT                                      */}
            {/* Dispatch Cycles + CIP Cycles + Grid/DG/Diesel/KWH               */}
            {/* ================================================================ */}
            {activeTab === 'day-report' && (
              <div className="space-y-6">

                {/* ---- Power & Energy Section Table ---- */}
                <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-edge bg-surface-dim/50 flex justify-between items-center">
                    <h3 className="text-md font-bold text-t-primary flex items-center gap-2">
                      <Zap size={18} className="text-amber" />
                      Grid / DG / Diesel / KWH Summary Report
                    </h3>
                    <span className="text-xs text-t-muted font-mono">{formatPeriodText()}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-surface-dim border-b border-edge text-xs font-semibold uppercase tracking-wider text-t-secondary">
                          <th className="px-5 py-3.5">Resource Parameter</th>
                          <th className="px-5 py-3.5">Calculated Value</th>
                          <th className="px-5 py-3.5">Details & Contextual Insights</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-edge text-t-primary">
                        {/* Grid Hours */}
                        <tr className="hover:bg-surface-dim/40 transition-colors">
                          <td className="px-5 py-3.5 font-medium flex items-center gap-2.5">
                            <Zap size={16} className="text-emerald" />
                            Grid Run-time
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-emerald">{reportData.powerStats?.gridHours ?? 0} hrs</td>
                          <td className="px-5 py-3.5 text-xs text-t-secondary">Utility grid active operating hours</td>
                        </tr>

                        {/* DG Hours */}
                        <tr className="hover:bg-surface-dim/40 transition-colors">
                          <td className="px-5 py-3.5 font-medium flex items-center gap-2.5">
                            <Fuel size={16} className="text-amber" />
                            DG Run-time
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-amber">{reportData.powerStats?.dgHours ?? 0} hrs</td>
                          <td className="px-5 py-3.5 text-xs text-t-secondary">Backup Diesel Generator operating hours</td>
                        </tr>

                        {/* Diesel Consumption */}
                        <tr className="hover:bg-surface-dim/40 transition-colors">
                          <td className="px-5 py-3.5 font-medium flex items-center gap-2.5">
                            <Fuel size={16} className="text-rose" />
                            Diesel Consumed
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-rose">{reportData.powerStats?.dieselConsumed ?? 0} L</td>
                          <td className="px-5 py-3.5 text-xs text-t-secondary">
                            Estimated fuel usage (Avg Rate: {reportData.powerStats?.dieselAvgRate ?? 0} L/hr during generator run)
                          </td>
                        </tr>

                        {/* Total Energy footprint */}
                        <tr className="hover:bg-surface-dim/40 transition-colors">
                          <td className="px-5 py-3.5 font-medium flex items-center gap-2.5">
                            <Zap size={16} className="text-sky" />
                            Total Energy (KWH)
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-sky">{reportData.powerStats?.kwhConsumed ?? 0} kWh</td>
                          <td className="px-5 py-3.5 text-xs text-t-secondary">Cumulative electricity footprint consumed</td>
                        </tr>

                        {/* Energy with Compressor */}
                        <tr className="hover:bg-surface-dim/40 transition-colors">
                          <td className="px-5 py-3.5 font-medium flex items-center gap-2.5 ml-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose inline-block" />
                            Energy with Compressor Load
                          </td>
                          <td className="px-5 py-3.5 font-mono font-semibold text-t-primary">{reportData.powerStats?.kwhWithCompressor ?? 0} kWh</td>
                          <td className="px-5 py-3.5 text-xs text-t-secondary">
                            {reportData.powerStats?.kwhConsumed > 0 
                              ? `${Math.round((reportData.powerStats.kwhWithCompressor / reportData.powerStats.kwhConsumed) * 100)}% of total energy footprint` 
                              : '0%'}
                          </td>
                        </tr>

                        {/* Energy without Compressor */}
                        <tr className="hover:bg-surface-dim/40 transition-colors">
                          <td className="px-5 py-3.5 font-medium flex items-center gap-2.5 ml-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald inline-block" />
                            Energy without Compressor Load
                          </td>
                          <td className="px-5 py-3.5 font-mono font-semibold text-t-primary">{reportData.powerStats?.kwhWithoutCompressor ?? 0} kWh</td>
                          <td className="px-5 py-3.5 text-xs text-t-secondary">
                            {reportData.powerStats?.kwhConsumed > 0 
                              ? `${Math.round((reportData.powerStats.kwhWithoutCompressor / reportData.powerStats.kwhConsumed) * 100)}% of total energy footprint` 
                              : '0%'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ---- Milk Volume & Session Summary Table ---- */}
                <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-edge bg-surface-dim/50 flex justify-between items-center">
                    <h3 className="text-md font-bold text-t-primary flex items-center gap-2">
                      <Activity size={18} className="text-brand" />
                      Milk Volume & Session Summary
                    </h3>
                    <span className="text-xs text-t-muted font-mono">{formatPeriodText()}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-surface-dim border-b border-edge text-xs font-semibold uppercase tracking-wider text-t-secondary">
                          <th className="px-5 py-3.5">Session Metric</th>
                          <th className="px-5 py-3.5">Calculated Volume</th>
                          <th className="px-5 py-3.5">Measurement Condition & Logic</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-edge text-t-primary">
                        <tr className="hover:bg-surface-dim/40 transition-colors">
                          <td className="px-5 py-3.5 font-medium flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-brand inline-block" />
                            Volume Before Morning Session
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-brand">
                            {reportData.sessionVolumes?.morningVolume?.toLocaleString() ?? 0} L
                          </td>
                          <td className="px-5 py-3.5 text-xs text-t-secondary">
                            Accumulated milk volume after the dispatch process (reset to zero) starts increasing again.
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-dim/40 transition-colors">
                          <td className="px-5 py-3.5 font-medium flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-sky inline-block" />
                            Volume After Evening Session
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-sky">
                            {reportData.sessionVolumes?.eveningVolume?.toLocaleString() ?? 0} L
                          </td>
                          <td className="px-5 py-3.5 text-xs text-t-secondary">
                            Measured milk volume once incoming increases halt (volume stable/non-increasing for 60 minutes).
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ---- Dispatch Cycles Section ---- */}
                <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-edge bg-surface-dim/50 flex justify-between items-center">
                    <div>
                      <h3 className="text-md font-bold text-t-primary flex items-center gap-2">
                        <Play size={18} className="text-brand" />
                        Dispatch Cycles — Milk Temperature & Volume
                      </h3>
                      <p className="text-xs text-t-muted mt-1">Dispatch start time to end time, volume dispatched, avg temperature</p>
                    </div>
                    <span className="text-xs text-t-muted font-mono">{formatPeriodText()}</span>
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
                            <td className="px-5 py-3.5 font-mono">{new Date(c.startTime).toLocaleString()}</td>
                            <td className="px-5 py-3.5 font-mono">{new Date(c.endTime).toLocaleString()}</td>
                            <td className="px-5 py-3.5 font-bold text-sky">{c.volumeDispatched?.toLocaleString()} L</td>
                            <td className="px-5 py-3.5 font-semibold">{c.avgTemperature?.toFixed(1)}°C</td>
                          </tr>
                        ))}
                        {(!reportData.dispatchCycles || reportData.dispatchCycles.length === 0) && (
                          <tr><td colSpan={5} className="text-center py-12 text-t-muted">No dispatch cycles recorded for this period</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ---- CIP Cycles Section ---- */}
                <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-edge bg-surface-dim/50 flex justify-between items-center">
                    <div>
                      <h3 className="text-md font-bold text-t-primary flex items-center gap-2">
                        <BarChart3 size={18} className="text-sky" />
                        CIP Cycles
                      </h3>
                      <p className="text-xs text-t-muted mt-1">Start time to end time, max temperature</p>
                    </div>
                    <span className="text-xs text-t-muted font-mono">{formatPeriodText()}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-surface-dim border-b border-edge text-xs font-semibold uppercase tracking-wider text-t-secondary">
                          <th className="px-5 py-3.5">#</th>
                          <th className="px-5 py-3.5">Start Time</th>
                          <th className="px-5 py-3.5">End Time</th>
                          <th className="px-5 py-3.5">Max Temperature</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-edge text-t-primary">
                        {reportData.cipCycles?.map((c, idx) => (
                          <tr key={idx} className="hover:bg-surface-dim/40 transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-t-muted">{idx + 1}</td>
                            <td className="px-5 py-3.5 font-mono">{new Date(c.startTime).toLocaleString()}</td>
                            <td className="px-5 py-3.5 font-mono">{new Date(c.endTime).toLocaleString()}</td>
                            <td className="px-5 py-3.5 font-semibold text-brand">{c.maxTemperature?.toFixed(1)}°C</td>
                          </tr>
                        ))}
                        {(!reportData.cipCycles || reportData.cipCycles.length === 0) && (
                          <tr><td colSpan={4} className="text-center py-12 text-t-muted">No CIP cycles recorded for this period</td></tr>
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
                    <p className="text-xs text-t-muted mt-1">All telemetry logs over the queried date range</p>
                  </div>
                  <span className="text-xs text-t-muted font-mono">{formatPeriodText()}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-surface-dim border-b border-edge text-xs font-semibold uppercase tracking-wider text-t-secondary">
                        <th className="px-5 py-3.5">Date & Time</th>
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
                            {new Date(log._time || log.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
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
                        <tr><td colSpan={8} className="text-center py-16 text-t-muted">No telemetry log records available for this date range</td></tr>
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
              Sends the full daily logbook report for <strong>{reportData?.device?.deviceName}</strong> on <strong>{startDate}</strong> via email.
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
