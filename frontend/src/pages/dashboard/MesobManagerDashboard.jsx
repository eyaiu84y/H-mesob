import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { organizationsData } from '../../data/organizations';
import { getAnnouncements, createAnnouncement, getMaintenanceTasks, createAnnouncementNotification } from '../../utils/sharedData';

// ─── Navigation sections ──────────────────────────────────────────
const SECTIONS = [
  'Dashboard',
  'Institution Monitoring',
  'Queue Monitoring',
  'Application Monitoring',
  'Maintenance Oversight',
  'Reports',
  'Analytics',
  'Announcements',
  'My Profile',
];

// No mock data - ready for backend integration
// Queue, applications, and maintenance data will come from API

// ─── Badge helpers ────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const cls = { High: 'badge bg-red-100 text-red-800', Medium: 'badge bg-amber-100 text-amber-800', Normal: 'badge bg-gray-100 text-gray-700' }[priority] || 'badge bg-gray-100 text-gray-700';
  return <span className={cls}>{priority}</span>;
}

function StatusBadge({ status }) {
  const cls = {
    Normal: 'badge bg-green-100 text-green-800',
    Busy:   'badge bg-amber-100 text-amber-800',
    Pending: 'badge bg-amber-100 text-amber-800',
    Waiting: 'badge bg-amber-100 text-amber-800',
    Assigned: 'badge bg-amber-100 text-amber-800',
    'In Progress': 'badge bg-blue-100 text-blue-800',
    Processing: 'badge bg-blue-100 text-blue-800',
    Completed: 'badge bg-green-100 text-green-800',
    Submitted: 'badge bg-green-100 text-green-800',
  }[status] || 'badge bg-gray-100 text-gray-700';
  return <span className={cls}>{status}</span>;
}

// ─── SECTION: Dashboard Overview ─────────────────────────────────
function SectionDashboard({ setActiveSection }) {
  const totalInstitutions = organizationsData.length;
  // TODO: Replace with API data when backend is integrated
  const totalQueue = 0; // Will come from queue management API
  const totalApps = 0; // Will come from application tracking API
  const tasks = getMaintenanceTasks({}); // Using real maintenance task system
  const totalMaint = tasks.filter(t => t.status !== 'Completed').length;

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Institutions</p>
          <p className="text-2xl font-bold">{totalInstitutions}</p>
          <p className="text-xs text-gray-500 mt-1">Active under MESOB</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Queue Status</p>
          <p className="text-2xl font-bold">{totalQueue}</p>
          <p className="text-xs text-amber-600 mt-1">Active tickets</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Applications</p>
          <p className="text-2xl font-bold">{totalApps}</p>
          <p className="text-xs text-gray-500 mt-1">MESOB-wide</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Maintenance</p>
          <p className="text-2xl font-bold">{totalMaint}</p>
          <p className="text-xs text-gray-500 mt-1">Open tasks</p>
        </div>
      </div>

      {/* Institution overview table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Institution Overview</h2>
          <button onClick={() => setActiveSection('Institution Monitoring')} className="text-sm text-blue-600 hover:underline font-medium">View all</button>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr><th>Institution</th><th>Queue</th><th>Applications</th><th>Maintenance</th><th>Status</th></tr>
            </thead>
            <tbody>
              {organizationsData.slice(0, 6).map(org => {
                // TODO: Replace with real API data
                const s = { queue: 0, applications: 0, maintenance: 0, status: 'Normal' };
                return (
                  <tr key={org.id}>
                    <td className="font-medium">{org.name_en}</td>
                    <td>{s.queue}</td>
                    <td>{s.applications}</td>
                    <td>{s.maintenance}</td>
                    <td><StatusBadge status={s.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Queue + Maintenance row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Queue snapshot */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Queue Snapshot</h2>
            <button onClick={() => setActiveSection('Queue Monitoring')} className="text-sm text-blue-600 hover:underline font-medium">View all</button>
          </div>
          <div className="p-6 text-center text-gray-400 py-12">
            <p className="text-sm">Queue management system will be integrated with backend API.</p>
            <p className="text-xs mt-2">Active queue items will appear here.</p>
          </div>
        </div>

        {/* Maintenance snapshot */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Maintenance Snapshot</h2>
            <button onClick={() => setActiveSection('Maintenance Oversight')} className="text-sm text-blue-600 hover:underline font-medium">View all</button>
          </div>
          {tasks.filter(t => t.status !== 'Completed').length > 0 ? (
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Task ID</th><th>Institution</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>
                  {tasks.filter(t => t.status !== 'Completed').slice(0, 4).map(t => (
                    <tr key={t.id}>
                      <td className="font-medium">{t.id}</td>
                      <td>{t.institution}</td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400">
              <p className="text-sm">No open maintenance tasks</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
        <strong>MESOB Manager:</strong> Monitor institution operations, queue conditions, applications, and maintenance across Hawassa MESOB. System administration belongs to Super Admin.
      </div>
    </>
  );
}

// ─── SECTION: Institution Monitoring ─────────────────────────────
function SectionInstitutionMonitoring() {
  const [selected, setSelected] = useState(null);

  if (selected) {
    const org = organizationsData.find(o => o.id === selected);
    // TODO: Replace with real API data
    const s = { queue: 0, applications: 0, maintenance: 0, status: 'Normal' };
    return (
      <>
        <div className="mb-6">
          <button onClick={() => setSelected(null)} className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Back to Institutions
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <img src={org.image} alt={org.name_en} className="w-14 h-14 object-contain rounded-xl bg-gray-50 p-1" onError={e => { e.target.style.display = 'none'; }} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{org.name_en}</h2>
              <p className="text-sm text-gray-500">{org.name_am}</p>
              <StatusBadge status={s.status} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Active Queue</p><p className="text-2xl font-bold">{s.queue}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Applications</p><p className="text-2xl font-bold">{s.applications}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Maintenance Tasks</p><p className="text-2xl font-bold">{s.maintenance}</p></div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-3">Services Offered</p>
            <div className="space-y-2">
              {org.services.map((svc, i) => (
                <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm">
                  <span className="font-medium text-gray-900">{svc.title_en}</span>
                  <span className="text-gray-500 ml-4 flex-shrink-0">{svc.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Institution Monitoring</h2>
        <p className="text-sm text-gray-500">Monitor all institutions operating under Hawassa MESOB.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead><tr><th>Institution</th><th>Queue</th><th>Applications</th><th>Maintenance</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {organizationsData.map(org => {
                // TODO: Replace with real API data
                const s = { queue: 0, applications: 0, maintenance: 0, status: 'Normal' };
                return (
                  <tr key={org.id}>
                    <td className="font-medium">{org.name_en}</td>
                    <td>{s.queue}</td>
                    <td>{s.applications}</td>
                    <td>{s.maintenance}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td><button onClick={() => setSelected(org.id)} className="text-blue-600 hover:underline text-sm font-medium">View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
        <strong>Institution Monitoring:</strong> View operational metrics for each institution. Institution creation and configuration belong to Super Admin.
      </div>
    </>
  );
}

// ─── SECTION: Queue Monitoring ────────────────────────────────────
function SectionQueueMonitoring() {
  // TODO: Replace with real queue data from API
  const queueItems = []; // Will come from queue management system
  
  const waiting = 0;
  const processing = 0;
  const completed = 0;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Queue Monitoring</h2>
        <p className="text-sm text-gray-500">Monitor queue conditions across MESOB institutions.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Waiting</p><p className="text-2xl font-bold">{waiting}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Processing</p><p className="text-2xl font-bold">{processing}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Completed</p><p className="text-2xl font-bold text-green-600">{completed}</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Queue Items</h3>
          <span className="text-sm text-gray-500">{queueItems.length} items</span>
        </div>
        <div className="p-6 text-center text-gray-400 py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium mb-2">Queue Management System Not Yet Integrated</p>
          <p className="text-xs">Active queue items from all institutions will appear here once the queue management system is connected to the backend.</p>
        </div>
      </div>
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
        <strong>Note:</strong> Queue monitoring across all MESOB institutions will be available when the queue management system is integrated with the backend API.
      </div>
    </>
  );
}

// ─── SECTION: Application Monitoring ─────────────────────────────
function SectionApplicationMonitoring() {
  // TODO: Replace with real application data from API
  const applications = []; // Will come from application tracking system
  
  const pending = 0;
  const inProg = 0;
  const done = 0;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Application Monitoring</h2>
        <p className="text-sm text-gray-500">Monitor application workload across MESOB institutions.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Pending / Waiting</p><p className="text-2xl font-bold">{pending}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">In Progress</p><p className="text-2xl font-bold">{inProg}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Completed</p><p className="text-2xl font-bold text-green-600">{done}</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Applications</h3>
          <span className="text-sm text-gray-500">{applications.length} result{applications.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="p-6 text-center text-gray-400 py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium mb-2">Application Tracking System Not Yet Integrated</p>
          <p className="text-xs">Applications from all institutions will appear here once the application tracking system is connected to the backend.</p>
        </div>
      </div>
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
        <strong>Note:</strong> Application monitoring across all MESOB institutions will be available when the application tracking system is integrated with the backend API.
      </div>
    </>
  );
}

// ─── SECTION: Maintenance Oversight ──────────────────────────────
function SectionMaintenanceOversight() {
  const tasks = getMaintenanceTasks(); // All tasks across institutions
  const open      = tasks.filter(t => t.status !== 'Completed').length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const highPri   = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Maintenance Oversight</h2>
        <p className="text-sm text-gray-500">Monitor technical maintenance across MESOB institutions.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Open Tasks</p><p className="text-2xl font-bold">{open}</p>{highPri > 0 && <p className="text-xs text-red-600 mt-1">{highPri} high priority</p>}</div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Completed</p><p className="text-2xl font-bold text-green-600">{completed}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Total Tasks</p><p className="text-2xl font-bold">{tasks.length}</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Maintenance Tasks – MESOB-wide</h3></div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead><tr><th>Task ID</th><th>Institution</th><th>Task</th><th>Priority</th><th>Assigned To</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-400 py-6">No maintenance tasks.</td></tr>
              ) : tasks.map(t => (
                <tr key={t.id}>
                  <td className="font-medium">{t.id}</td>
                  <td>{t.institution}</td>
                  <td>{t.title}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td>{t.assignedTo}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{t.assignedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
        <strong>Maintenance Oversight:</strong> Monitor technical tasks and reports across all MESOB institutions. Task assignment is performed by Institution Managers.
      </div>
    </>
  );
}

// ─── SECTION: Reports ────────────────────────────────────────────
function SectionReports() {
  const [activeReport, setActiveReport] = useState('queue');

  // TODO: Connect to backend API for real MESOB-wide reports data
  const qWaiting = 0;
  const qProcessing = 0;
  const qCompleted = 0;
  const appPending = 0;
  const appInProg = 0;
  const appDone = 0;
  const maintOpen = 0;
  const maintDone = 0;
  const maintReport = 0;

  const tabs = [
    { key: 'queue',       label: 'Queue Report'       },
    { key: 'application', label: 'Application Report' },
    { key: 'maintenance', label: 'Maintenance Report' },
    { key: 'institution', label: 'Institution Report' },
  ];

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Reports</h2>
        <p className="text-sm text-gray-500">MESOB-wide operational reports based on existing system data.</p>
      </div>

      {/* Report type tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveReport(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
              activeReport === tab.key
                ? 'bg-[#1e3a8a] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Queue Report ── */}
      {activeReport === 'queue' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Waiting</p><p className="text-2xl font-bold">{qWaiting}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Processing</p><p className="text-2xl font-bold">{qProcessing}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Completed</p><p className="text-2xl font-bold text-green-600">{qCompleted}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Queue Activity – MESOB-wide</h3></div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Ticket</th><th>Institution</th><th>Service</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-8">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="font-medium text-gray-500">No queue data available yet</p>
                      <p className="text-sm text-gray-400 mt-1">Queue reports will appear when the queue management system is integrated</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Application Report ── */}
      {activeReport === 'application' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Pending / Waiting</p><p className="text-2xl font-bold">{appPending}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">In Progress</p><p className="text-2xl font-bold">{appInProg}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Completed</p><p className="text-2xl font-bold text-green-600">{appDone}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Application Report – MESOB-wide</h3></div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>App ID</th><th>Institution</th><th>Service</th><th>Submitted</th><th>Status</th></tr></thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-8">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="font-medium text-gray-500">No application data available yet</p>
                      <p className="text-sm text-gray-400 mt-1">Application reports will appear when the application tracking system is integrated</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Maintenance Report ── */}
      {activeReport === 'maintenance' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Open Tasks</p><p className="text-2xl font-bold">{maintOpen}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Completed</p><p className="text-2xl font-bold text-green-600">{maintDone}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Reports Submitted</p><p className="text-2xl font-bold">{maintReport}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Maintenance Report – MESOB-wide</h3></div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Task ID</th><th>Institution</th><th>Task</th><th>Priority</th><th>Technician</th><th>Status</th><th>Report</th></tr></thead>
                <tbody>
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-8">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="font-medium text-gray-500">Using live maintenance data</p>
                      <p className="text-sm text-gray-400 mt-1">See Maintenance Oversight for current maintenance tasks</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Institution Report ── */}
      {activeReport === 'institution' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Total Institutions</p><p className="text-2xl font-bold">{organizationsData.length}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Busy</p><p className="text-2xl font-bold text-amber-600">0</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Normal</p><p className="text-2xl font-bold text-green-600">{organizationsData.length}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Institution Report – MESOB-wide</h3></div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Institution</th><th>Queue</th><th>Applications</th><th>Maintenance</th><th>Status</th></tr></thead>
                <tbody>
                  {organizationsData.map(org => (
                    <tr key={org.id}>
                      <td className="font-medium">{org.name_en}</td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td><StatusBadge status="Normal" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
        <strong>Reports:</strong> MESOB-wide operational reporting. Payment, appointment, and grievance reports are not part of the approved system scope.
      </div>
    </>
  );
}

// ─── SECTION: Analytics ───────────────────────────────────────────
function SectionAnalytics() {
  const [filterInst, setFilterInst] = useState('');
  const institutions = organizationsData;

  const displayInsts = filterInst
    ? institutions.filter(o => o.id === filterInst)
    : institutions;

  // TODO: Connect to backend API for real institution statistics
  const totalQueue = 0;
  const totalApps = 0;
  const totalMaint = 0;
  const busyCount = 0;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Analytics</h2>
        <p className="text-sm text-gray-500">Operational performance metrics across Hawassa MESOB.</p>
      </div>

      {/* Filter */}
      <div className="mb-6 flex items-center gap-3">
        <select value={filterInst} onChange={e => setFilterInst(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-400 outline-none transition text-sm bg-white">
          <option value="">All Institutions</option>
          {institutions.map(o => <option key={o.id} value={o.id}>{o.name_en}</option>)}
        </select>
        {filterInst && <button onClick={() => setFilterInst('')} className="text-sm text-blue-600 hover:underline">Show all</button>}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Active Queue</p><p className="text-2xl font-bold">{totalQueue}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Applications</p><p className="text-2xl font-bold">{totalApps}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Open Maintenance</p><p className="text-2xl font-bold">{totalMaint}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Busy Institutions</p><p className={`text-2xl font-bold ${busyCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>{busyCount}</p></div>
      </div>

      {/* Per-institution breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Institution Performance Breakdown</h3>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead><tr><th>Institution</th><th>Queue</th><th>Applications</th><th>Maintenance</th><th>Status</th></tr></thead>
            <tbody>
              {displayInsts.map(org => (
                <tr key={org.id}>
                  <td className="font-medium">{org.name_en}</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                  <td><StatusBadge status="Normal" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
        <strong>Analytics:</strong> Operational metrics for monitoring purposes. Financial and payment analytics are not part of the approved system scope.
      </div>
    </>
  );
}

// ─── SECTION: Announcements ───────────────────────────────────────
function SectionAnnouncements({ user }) {
  const { getUsers } = useAuth();
  const { createNotification } = useNotifications();
  const [announcements, setAnnouncements] = useState(() => getAnnouncements({ scope: 'mesob' }));
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'new'
  const [form, setForm] = useState({ title: '', body: '' });
  const [formError, setFormError] = useState('');

  function markRead(id) { setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, read: true } : a)); }

  function submitAnnouncement(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setFormError('Title and content are required.');
      return;
    }

    const result = createAnnouncement({
      title: form.title.trim(),
      body: form.body.trim(),
      author: user?.name || 'MESOB Manager',
      scope: 'mesob',
      institution: null,
    });

    if (result.success) {
      // Notify all MESOB staff (all users with institution = 'MESOB Center' or roles in MESOB)
      const allUsers = getUsers ? getUsers() : [];
      const mesobStaff = allUsers.filter(u => 
        u.institution === 'MESOB Center' || 
        u.role === 'mesobManager' || 
        u.role === 'superAdmin'
      );

      mesobStaff.forEach(staff => {
        const notificationData = createAnnouncementNotification(result.announcement, staff.email);
        createNotification(notificationData);
      });

      setAnnouncements(prev => [result.announcement, ...prev]);
      setForm({ title: '', body: '' });
      setFormError('');
      setView('list');
      alert(`Announcement published successfully!\n\n${mesobStaff.length} MESOB staff members have been notified.`);
    } else {
      setFormError(result.message || 'Failed to create announcement.');
    }
  }

  // New announcement form
  if (view === 'new') {
    return (
      <>
        <div className="mb-6">
          <button onClick={() => { setView('list'); setFormError(''); }} className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Cancel
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">New MESOB Announcement</h2>
          <form onSubmit={submitAnnouncement} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Brief announcement title"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Content <span className="text-red-500">*</span></label>
              <textarea rows={5} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Announcement content"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition text-sm resize-y" />
            </div>
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
              <strong>Scope:</strong> This announcement will be visible to all MESOB staff across all institutions.
            </div>
            {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{formError}</div>}
            <button type="submit" className="px-6 py-3 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold rounded-xl transition text-sm">
              Publish Announcement
            </button>
          </form>
        </div>
      </>
    );
  }

  // Announcement detail view
  if (selected) {
    const ann = announcements.find(a => a.id === selected);
    return (
      <>
        <div className="mb-6">
          <button onClick={() => setSelected(null)} className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Back to Announcements
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{ann.title}</h2>
            {!ann.read && <span className="badge bg-blue-100 text-blue-800 flex-shrink-0">New</span>}
          </div>
          <p className="text-sm text-gray-500 mb-4">{ann.date} {ann.author && `• ${ann.author}`}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{ann.body}</p>
        </div>
      </>
    );
  }

  // Announcement list view
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Announcements</h2>
          <p className="text-sm text-gray-500">MESOB-wide operational announcements and notifications.</p>
        </div>
        <button onClick={() => setView('new')} className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition">
          + New Announcement
        </button>
      </div>
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No announcements available.</div>
        ) : announcements.map(ann => (
          <div key={ann.id} onClick={() => { setSelected(ann.id); markRead(ann.id); }}
            className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all duration-200 ${ann.read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!ann.read && <span className="inline-block w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />}
                  <h3 className="font-semibold text-sm text-gray-900 leading-snug">{ann.title}</h3>
                </div>
                <p className="text-xs text-gray-500">{ann.date} {ann.author && `• ${ann.author}`}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── SECTION: My Profile ──────────────────────────────────────────
function SectionMyProfile({ user }) {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">My Profile</h2>
        <p className="text-sm text-gray-500">Your account information.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
            {user?.name?.charAt(0) || 'M'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="badge bg-red-100 text-red-800 mt-1">MESOB Manager</span>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Full Name</span><span className="font-medium text-gray-900">{user?.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-gray-900">{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium text-gray-900">MESOB Manager</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Scope</span><span className="font-medium text-gray-900">Hawassa MESOB</span></div>
        </div>
      </div>
      <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
        <strong>Note:</strong> To update your profile or change your password, contact the Super Admin.
      </div>
    </>
  );
}

// ─── Main MesobManagerDashboard ───────────────────────────────────
export default function MesobManagerDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function navigate(section) {
    setActiveSection(section);
    setSidebarOpen(false);
  }

  function renderSection() {
    switch (activeSection) {
      case 'Dashboard':              return <SectionDashboard setActiveSection={navigate} />;
      case 'Institution Monitoring': return <SectionInstitutionMonitoring />;
      case 'Queue Monitoring':       return <SectionQueueMonitoring />;
      case 'Application Monitoring': return <SectionApplicationMonitoring />;
      case 'Maintenance Oversight':  return <SectionMaintenanceOversight />;
      case 'Reports':                return <SectionReports />;
      case 'Analytics':              return <SectionAnalytics />;
      case 'Announcements':          return <SectionAnnouncements user={user} />;
      case 'My Profile':             return <SectionMyProfile user={user} />;
      default:                       return <SectionDashboard setActiveSection={navigate} />;
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex min-h-screen">

        {/* ── Sidebar ── */}
        <aside className={`db-sidebar fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200${sidebarOpen ? ' open' : ''}`}>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg">M</div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">MESOB Center</p>
                <p className="text-xs text-gray-500">MESOB Manager</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {SECTIONS.map(section => (
              <button key={section} onClick={() => navigate(section)}
                className={`sidebar-link w-full text-left${activeSection === section ? ' active' : ''}`}>
                {section}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button onClick={() => { localStorage.removeItem('mesob_auth'); window.location.href = '/'; }}
              className="sidebar-link w-full text-left text-red-600 hover:bg-red-50">
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {activeSection === 'Dashboard' ? 'MESOB Manager Dashboard' : activeSection}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge bg-red-100 text-red-800">MESOB Manager</span>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8">
            {renderSection()}
          </main>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
