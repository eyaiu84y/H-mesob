import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function EmailOutboxMonitoring() {
  const { lang } = useApp();
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [purgeLoading, setPurgeLoading] = useState(false);

  const fetchMonitoringData = useCallback(async () => {
    try {
      const token = localStorage.getItem('mesob_token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const [statsRes, healthRes, logsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/notifications/email-outbox/stats`, { headers }),
        fetch(`${API_BASE_URL}/notifications/email-outbox/health`, { headers }),
        fetch(`${API_BASE_URL}/notifications/email-outbox/logs${statusFilter ? `?status=${statusFilter}` : ''}`, { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.data);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        if (healthData.success) setHealth(healthData.data);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.success) setLogs(logsData.data?.logs || []);
      }

      setError(null);
    } catch (err) {
      console.error('Email monitoring fetch error:', err);
      setError('Failed to fetch real-time email delivery data.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const handlePurge = async (clearAllFailed = false) => {
    const promptMsg = clearAllFailed
      ? (lang === 'am' ? 'ሁሉንም ያልተሳኩ የኢሜይል መዝገቦች ማጽዳት ይፈልጋሉ?' : 'Are you sure you want to clear all failed test email logs?')
      : (lang === 'am' ? 'የሞክ/የሙከራ የኢሜይል መዝገቦችን ማስወገድ ይፈልጋሉ?' : 'Are you sure you want to remove all simulated/mock email records?');
    if (!window.confirm(promptMsg)) return;

    try {
      setPurgeLoading(true);
      const token = localStorage.getItem('mesob_token');
      const res = await fetch(`${API_BASE_URL}/notifications/email-outbox/purge-mock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clearAllFailed }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMonitoringData();
      } else {
        alert(data.message || 'Failed to purge logs');
      }
    } catch (err) {
      console.error('Purge error:', err);
    } finally {
      setPurgeLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchMonitoringData, 5000);
    return () => clearInterval(interval);
  }, [fetchMonitoringData, autoRefresh]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.recipient && log.recipient.toLowerCase().includes(q)) ||
      (log.subject && log.subject.toLowerCase().includes(q)) ||
      (log.templateName && log.templateName.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {lang === 'am' ? 'ተልኳል' : 'SENT'}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {lang === 'am' ? 'በመጠባበቅ ላይ' : 'PENDING'}
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
            {lang === 'am' ? 'በሂደት ላይ' : 'PROCESSING'}
          </span>
        );
      case 'RETRYING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            {lang === 'am' ? 'እንደገና በመሞከር ላይ' : 'RETRYING'}
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            {lang === 'am' ? 'አልተሳካም' : 'FAILED'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1e3a8a]/10 text-[#1e3a8a] border border-[#1e3a8a]/20 uppercase tracking-wide">
              {lang === 'am' ? 'የደህንነት አገልግሎት' : 'Scalable Outbox'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              • Worker: <strong className="text-slate-700">{health?.concurrency || 10} threads</strong>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              • Provider: <strong className="text-slate-700 font-semibold uppercase">{health?.provider?.activeProvider || 'SMTP'}</strong>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              • Speed: <strong className="text-emerald-700 font-semibold">{health?.throughputPerMinute || 0} emails/min</strong>
            </span>
            {health?.backlog && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                health.backlog.health === 'HEALTHY'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                Backlog: {health.backlog.backlogDepth || 0}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {lang === 'am' ? 'የኢሜይል ማድረሻ እና ክትትል ዳሽቦርድ' : 'Email Delivery Monitoring'}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {lang === 'am'
              ? 'የተላኩ፣ በመጠባበቅ ላይ ያሉ እና ያልተሳኩ የኢሜይል ማስታወቂያዎች የቀጥታ ክትትል'
              : 'Real-time monitoring of queue tickets, turn alerts, and verification delivery'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-[#1e3a8a] focus:ring-[#1e3a8a]"
            />
            {lang === 'am' ? 'ራስ-ሰር ማደስ' : 'Auto-refresh (5s)'}
          </label>
          <button
            onClick={() => {
              setLoading(true);
              fetchMonitoringData();
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-[#1e3a8a] to-[#314ea1] text-white hover:from-[#172554] hover:to-[#253d82] text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {lang === 'am' ? 'አድስ' : 'Refresh'}
          </button>
          <button
            onClick={() => handlePurge(false)}
            disabled={purgeLoading}
            className="px-3.5 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Remove simulated sim.* records"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {lang === 'am' ? 'ሞክ አፅዳ' : 'Purge Mock'}
          </button>
          <button
            onClick={() => handlePurge(true)}
            disabled={purgeLoading}
            className="px-3.5 py-2 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Clear all failed test records"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {lang === 'am' ? 'ያልተሳኩ አፅዳ' : 'Clear Failed'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {lang === 'am' ? 'ጠቅላላ ኢሜይሎች' : 'Total Emails'}
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total ?? 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">All time logged</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
            {lang === 'am' ? 'የተላኩ' : 'Sent'}
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats?.sent ?? 0}</p>
          <span className="text-[11px] text-emerald-700/80 mt-0.5 block">Delivered to SMTP</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs bg-amber-50/20">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
            {lang === 'am' ? 'በመጠባበቅ ላይ' : 'Pending'}
          </p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{stats?.pending ?? 0}</p>
          <span className="text-[11px] text-amber-700/80 mt-0.5 block">Awaiting worker</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-xs bg-blue-50/20">
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
            {lang === 'am' ? 'በሂደት ላይ' : 'Processing'}
          </p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{stats?.processing ?? 0}</p>
          <span className="text-[11px] text-blue-700/80 mt-0.5 block">Active transmission</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200/80 shadow-xs bg-purple-50/20">
          <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide">
            {lang === 'am' ? 'እንደገና ሙከራ' : 'Retrying'}
          </p>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">{stats?.retrying ?? 0}</p>
          <span className="text-[11px] text-purple-700/80 mt-0.5 block">Exponential backoff</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs bg-rose-50/20">
          <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide">
            {lang === 'am' ? 'ያልተሳኩ' : 'Failed'}
          </p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{stats?.failed ?? 0}</p>
          <span className="text-[11px] text-rose-700/80 mt-0.5 block">Exceeded 5 retries</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {['', 'SENT', 'PENDING', 'PROCESSING', 'RETRYING', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#1e3a8a] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === '' ? (lang === 'am' ? 'ሁሉም' : 'All') : st}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder={lang === 'am' ? 'በተቀባይ ወይም ርዕስ ፈልግ...' : 'Search recipient or subject...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Delivery Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            {lang === 'am' ? 'የኢሜይል ማድረሻ ታሪክ' : 'Email Dispatch History'}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {filteredLogs.length} {lang === 'am' ? 'መዝገቦች' : 'records found'}
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="font-semibold text-slate-600 text-sm">
              {lang === 'am' ? 'ምንም የኢሜይል መዝገብ አልተገኘም' : 'No email outbox records found'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'am' ? 'አዳዲስ ምዝገባዎች እና የሰልፍ ማስታወቂያዎች እዚህ ይታያሉ።' : 'New registrations and queue actions will automatically log here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject & Template</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Error / Message ID</th>
                  <th className="py-3 px-4">Created / Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {log.recipient}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{log.subject}</p>
                      <span className="text-[10px] text-slate-400 font-mono block uppercase">
                        {log.templateName}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <span className="font-bold text-slate-800">{log.attempts}</span>
                      <span className="text-slate-400">/{log.maxAttempts}</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {log.error ? (
                        <p className="text-[11px] text-rose-600 font-mono truncate" title={log.error}>
                          {log.error}
                        </p>
                      ) : log.messageId ? (
                        <p className="text-[11px] text-emerald-700 font-mono truncate" title={log.messageId}>
                          {log.messageId}
                        </p>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {log.sentAt ? (
                        <span className="text-emerald-700 font-medium">
                          {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      ) : (
                        <span>
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
