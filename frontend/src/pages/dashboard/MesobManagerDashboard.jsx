import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAnnouncements } from '../../context/AnnouncementContext';
import { useServices } from '../../context/ServiceContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import { useQueue } from '../../context/QueueContext';
import { useApplications } from '../../context/ApplicationContext';
import { useApp } from '../../context/AppContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import MesobFeedbackOverview from '../../components/dashboard/MesobFeedbackOverview';

// ─── Navigation sections ──────────────────────────────────────────
function getSections(t) {
  return [
    t.dashboard,
    t.institution_monitoring,
    t.queue_monitoring,
    t.application_monitoring,
    t.maintenance_oversight,
    t.feedback_overview,
    t.reports,
    t.analytics,
    t.announcements,
    t.my_profile,
  ];
}

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
  const { institutions } = useServices();
  const { reports } = useMaintenance();
  const { myTickets } = useQueue();
  const { applications } = useApplications();
  
  const totalInstitutions = institutions.length;
  const totalQueue = myTickets.filter(t => t.status === 'waiting' || t.status === 'called').length;
  const totalApps = applications.length;
  const totalMaint = reports.filter(t => t.status !== 'Completed' && t.status !== 'COMPLETED').length;

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
              {institutions.slice(0, 6).map(inst => {
                const instQueue = myTickets.filter(t => t.institutionId === inst.id && (t.status === 'waiting' || t.status === 'called')).length;
                const instApps = applications.filter(app => app.institutionId === inst.id).length;
                const instMaint = reports.filter(r => r.institution === (inst.name_en || inst.name) && r.status !== 'Completed' && r.status !== 'COMPLETED').length;
                const status = instQueue > 5 ? 'Busy' : 'Normal';
                
                return (
                  <tr key={inst.id}>
                    <td className="font-medium">{inst.name_en || inst.name}</td>
                    <td>{instQueue}</td>
                    <td>{instApps}</td>
                    <td>{instMaint}</td>
                    <td><StatusBadge status={status} /></td>
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
          {myTickets.filter(t => t.status === 'waiting' || t.status === 'called').length > 0 ? (
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Token</th><th>Institution</th><th>Service</th><th>Status</th></tr></thead>
                <tbody>
                  {myTickets.filter(t => t.status === 'waiting' || t.status === 'called').slice(0, 4).map(ticket => (
                    <tr key={ticket.id}>
                      <td className="font-medium">{ticket.token}</td>
                      <td>{ticket.institutionName}</td>
                      <td className="text-sm">{ticket.serviceName}</td>
                      <td><StatusBadge status={ticket.status === 'waiting' ? 'Waiting' : 'Processing'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400 py-12">
              <p className="text-sm">No active queue items</p>
            </div>
          )}
        </div>

        {/* Maintenance snapshot */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Maintenance Snapshot</h2>
            <button onClick={() => setActiveSection('Maintenance Oversight')} className="text-sm text-blue-600 hover:underline font-medium">View all</button>
          </div>
          {reports.filter(t => t.status !== 'Completed' && t.status !== 'COMPLETED').length > 0 ? (
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Task ID</th><th>Institution</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>
                  {reports.filter(t => t.status !== 'Completed' && t.status !== 'COMPLETED').slice(0, 4).map(t => (
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
  const { institutions } = useServices();
  const { myTickets } = useQueue();
  const { applications } = useApplications();
  const { reports } = useMaintenance();
  const [selected, setSelected] = useState(null);

  if (selected) {
    const inst = institutions.find(i => i.id === selected);
    const instQueue = myTickets.filter(t => t.institutionId === selected && (t.status === 'waiting' || t.status === 'called')).length;
    const instApps = applications.filter(app => app.institutionId === selected).length;
    const instMaint = reports.filter(r => r.institution === (inst?.name_en || inst?.name) && r.status !== 'Completed' && r.status !== 'COMPLETED').length;
    const status = instQueue > 5 ? 'Busy' : 'Normal';
    
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
            {inst?.logo && <img src={inst.logo} alt={inst?.name_en || inst?.name} className="w-14 h-14 object-contain rounded-xl bg-gray-50 p-1" onError={e => { e.target.style.display = 'none'; }} />}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{inst?.name_en || inst?.name}</h2>
              <p className="text-sm text-gray-500">{inst?.name_am}</p>
              <StatusBadge status={status} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Active Queue</p><p className="text-2xl font-bold">{instQueue}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Applications</p><p className="text-2xl font-bold">{instApps}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Maintenance Tasks</p><p className="text-2xl font-bold">{instMaint}</p></div>
          </div>
          {inst?.description_en && (
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700">
              <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">About</p>
              <p>{inst.description_en}</p>
            </div>
          )}
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
              {institutions.map(inst => {
                const instQueue = myTickets.filter(t => t.institutionId === inst.id && (t.status === 'waiting' || t.status === 'called')).length;
                const instApps = applications.filter(app => app.institutionId === inst.id).length;
                const instMaint = reports.filter(r => r.institution === (inst?.name_en || inst?.name) && r.status !== 'Completed' && r.status !== 'COMPLETED').length;
                const status = instQueue > 5 ? 'Busy' : 'Normal';
                return (
                  <tr key={inst.id}>
                    <td className="font-medium">{inst?.name_en || inst?.name}</td>
                    <td>{instQueue}</td>
                    <td>{instApps}</td>
                    <td>{instMaint}</td>
                    <td><StatusBadge status={status} /></td>
                    <td><button onClick={() => setSelected(inst.id)} className="text-blue-600 hover:underline text-sm font-medium">View</button></td>
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
  const { myTickets } = useQueue();
  
  const waiting = myTickets.filter(t => t.status === 'waiting').length;
  const processing = myTickets.filter(t => t.status === 'called' || t.status === 'processing').length;
  const completed = myTickets.filter(t => t.status === 'completed' || t.status === 'served').length;

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
          <span className="text-sm text-gray-500">{myTickets.length} items</span>
        </div>
        {myTickets.length > 0 ? (
          <div className="table-container border-0 rounded-none">
            <table className="data-table">
              <thead><tr><th>Ticket</th><th>Citizen</th><th>Service</th><th>Priority</th><th>Status</th></tr></thead>
              <tbody>
                {myTickets.slice(0, 20).map(ticket => (
                  <tr key={ticket.id}>
                    <td className="font-medium">{ticket.ticketNumber || `#${ticket.id}`}</td>
                    <td>{ticket.citizenName || 'N/A'}</td>
                    <td>{ticket.serviceName || ticket.service || 'N/A'}</td>
                    <td><PriorityBadge priority={ticket.priority || 'Normal'} /></td>
                    <td><StatusBadge status={ticket.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-400 py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium mb-2">No Queue Items</p>
            <p className="text-xs">There are currently no queue items to display.</p>
          </div>
        )}
      </div>
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
        <strong>Note:</strong> Showing all queue items across MESOB institutions.
      </div>
    </>
  );
}

// ─── SECTION: Application Monitoring ─────────────────────────────
function SectionApplicationMonitoring() {
  const { applications } = useApplications();
  
  const pending = applications.filter(app => app.status === 'pending' || app.status === 'waiting' || app.status === 'Pending' || app.status === 'Waiting').length;
  const inProg = applications.filter(app => app.status === 'in_progress' || app.status === 'processing' || app.status === 'In Progress' || app.status === 'Processing').length;
  const done = applications.filter(app => app.status === 'completed' || app.status === 'approved' || app.status === 'Completed' || app.status === 'Approved').length;

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
        {applications.length > 0 ? (
          <div className="table-container border-0 rounded-none">
            <table className="data-table">
              <thead><tr><th>ID</th><th>Applicant</th><th>Service</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {applications.slice(0, 20).map(app => (
                  <tr key={app.id}>
                    <td className="font-medium">#{app.id}</td>
                    <td>{app.applicantName || app.citizenName || 'N/A'}</td>
                    <td>{app.serviceName || app.service || 'N/A'}</td>
                    <td><StatusBadge status={app.status} /></td>
                    <td className="text-sm text-gray-500">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-400 py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium mb-2">No Applications</p>
            <p className="text-xs">There are currently no applications to display.</p>
          </div>
        )}
      </div>
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
        <strong>Note:</strong> Showing all applications across MESOB institutions.
      </div>
    </>
  );
}

// ─── SECTION: Maintenance Oversight ──────────────────────────────
function SectionMaintenanceOversight() {
  const { reports } = useMaintenance(); // Get all maintenance reports from context
  const tasks = reports || []; // Alias for compatibility
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
  const { institutions } = useServices();
  const { myTickets } = useQueue();
  const { applications } = useApplications();
  const { reports } = useMaintenance();
  const [activeReport, setActiveReport] = useState('queue');

  const qWaiting = myTickets.filter(t => t.status === 'waiting').length;
  const qProcessing = myTickets.filter(t => t.status === 'called' || t.status === 'processing').length;
  const qCompleted = myTickets.filter(t => t.status === 'completed' || t.status === 'served').length;
  const appPending = applications.filter(app => app.status === 'pending' || app.status === 'waiting' || app.status === 'Pending' || app.status === 'Waiting').length;
  const appInProg = applications.filter(app => app.status === 'in_progress' || app.status === 'processing' || app.status === 'In Progress' || app.status === 'Processing').length;
  const appDone = applications.filter(app => app.status === 'completed' || app.status === 'approved' || app.status === 'Completed' || app.status === 'Approved').length;
  const maintOpen = reports.filter(r => r.status !== 'Completed' && r.status !== 'COMPLETED').length;
  const maintDone = reports.filter(r => r.status === 'Completed' || r.status === 'COMPLETED').length;
  const maintReport = reports.length;

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
                  {myTickets.length > 0 ? (
                    myTickets.slice(0, 20).map(ticket => {
                      const inst = institutions.find(i => i.id === ticket.institutionId);
                      return (
                        <tr key={ticket.id}>
                          <td className="font-medium">{ticket.ticketNumber || `#${ticket.id}`}</td>
                          <td>{inst?.name_en || 'N/A'}</td>
                          <td>{ticket.serviceName || ticket.service || 'N/A'}</td>
                          <td><PriorityBadge priority={ticket.priority || 'Normal'} /></td>
                          <td><StatusBadge status={ticket.status} /></td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-8">
                        <p className="font-medium text-gray-500">No queue tickets</p>
                      </td>
                    </tr>
                  )}
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
                  {applications.length > 0 ? (
                    applications.slice(0, 20).map(app => {
                      const inst = institutions.find(i => i.id === app.institutionId);
                      return (
                        <tr key={app.id}>
                          <td className="font-medium">#{app.id}</td>
                          <td>{inst?.name_en || 'N/A'}</td>
                          <td>{app.serviceName || app.service || 'N/A'}</td>
                          <td className="text-sm">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td><StatusBadge status={app.status} /></td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-8">
                        <p className="font-medium text-gray-500">No applications</p>
                      </td>
                    </tr>
                  )}
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
                <thead><tr><th>Task ID</th><th>Institution</th><th>Task</th><th>Priority</th><th>Technician</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {reports.length > 0 ? (
                    reports.slice(0, 20).map(task => (
                      <tr key={task.id}>
                        <td className="font-medium">{task.id}</td>
                        <td>{task.institution}</td>
                        <td>{task.title}</td>
                        <td><PriorityBadge priority={task.priority} /></td>
                        <td>{task.assignedTo}</td>
                        <td><StatusBadge status={task.status} /></td>
                        <td className="text-sm">{task.assignedDate}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center text-gray-400 py-8">
                        <p className="font-medium text-gray-500">No maintenance tasks</p>
                      </td>
                    </tr>
                  )}
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
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Total Institutions</p><p className="text-2xl font-bold">{institutions.length}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Busy</p><p className="text-2xl font-bold text-amber-600">{institutions.filter(inst => {
              const qCount = myTickets.filter(t => t.institutionId === inst.id && (t.status === 'waiting' || t.status === 'called')).length;
              return qCount > 5;
            }).length}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Normal</p><p className="text-2xl font-bold text-green-600">{institutions.filter(inst => {
              const qCount = myTickets.filter(t => t.institutionId === inst.id && (t.status === 'waiting' || t.status === 'called')).length;
              return qCount <= 5;
            }).length}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Institution Report – MESOB-wide</h3></div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Institution</th><th>Queue</th><th>Applications</th><th>Maintenance</th><th>Status</th></tr></thead>
                <tbody>
                  {institutions.map(inst => {
                    const instQueue = myTickets.filter(t => t.institutionId === inst.id && (t.status === 'waiting' || t.status === 'called')).length;
                    const instApps = applications.filter(app => app.institutionId === inst.id).length;
                    const instMaint = reports.filter(r => r.institution === (inst?.name_en || inst?.name) && r.status !== 'Completed' && r.status !== 'COMPLETED').length;
                    const status = instQueue > 5 ? 'Busy' : 'Normal';
                    return (
                      <tr key={inst.id}>
                        <td className="font-medium">{inst?.name_en || inst?.name}</td>
                        <td>{instQueue}</td>
                        <td>{instApps}</td>
                        <td>{instMaint}</td>
                        <td><StatusBadge status={status} /></td>
                      </tr>
                    );
                  })}
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
  const { institutions } = useServices();
  const { myTickets } = useQueue();
  const { applications } = useApplications();
  const { reports } = useMaintenance();
  const [filterInst, setFilterInst] = useState('');

  const displayInsts = filterInst
    ? institutions.filter(o => o.id === filterInst)
    : institutions;

  const totalQueue = myTickets.filter(t => t.status === 'waiting' || t.status === 'called').length;
  const totalApps = applications.length;
  const totalMaint = reports.filter(r => r.status !== 'Completed' && r.status !== 'COMPLETED').length;
  const busyCount = institutions.filter(inst => {
    const qCount = myTickets.filter(t => t.institutionId === inst.id && (t.status === 'waiting' || t.status === 'called')).length;
    return qCount > 5;
  }).length;

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
              {displayInsts.map(inst => {
                const instQueue = myTickets.filter(t => t.institutionId === inst.id && (t.status === 'waiting' || t.status === 'called')).length;
                const instApps = applications.filter(app => app.institutionId === inst.id).length;
                const instMaint = reports.filter(r => r.institution === (inst?.name_en || inst?.name) && r.status !== 'Completed' && r.status !== 'COMPLETED').length;
                const status = instQueue > 5 ? 'Busy' : 'Normal';
                return (
                  <tr key={inst.id}>
                    <td className="font-medium">{inst?.name_en || inst?.name}</td>
                    <td>{instQueue}</td>
                    <td>{instApps}</td>
                    <td>{instMaint}</td>
                    <td><StatusBadge status={status} /></td>
                  </tr>
                );
              })}
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
function SectionAnnouncements() {
  const { user } = useAuth();
  const { announcements, createAnnouncement: createAnnouncementAPI, updateAnnouncement, deleteAnnouncement, loading, error } = useAnnouncements();
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'new' | 'edit'
  const [form, setForm] = useState({ title: '', body: '', scope: 'INTERNAL', targetRoles: [] });
  const [formError, setFormError] = useState('');

  async function submitAnnouncement(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setFormError('Title and content are required.');
      return;
    }

    // Validate ROLE scope requires target roles
    if (form.scope === 'ROLE' && (!form.targetRoles || form.targetRoles.length === 0)) {
      setFormError('Please select at least one role for ROLE scope.');
      return;
    }

    setFormError('');

    const announcementData = {
      title: form.title.trim(),
      content: form.body.trim(),
      scope: form.scope
    };

    // Add optional fields based on scope
    if (form.scope === 'ROLE' && form.targetRoles.length > 0) {
      announcementData.targetRoles = form.targetRoles;
    }

    let result;
    if (view === 'edit' && selected) {
      // Update existing announcement
      result = await updateAnnouncement(selected, announcementData);
    } else {
      // Create new announcement
      result = await createAnnouncementAPI(announcementData);
    }

    if (result.success) {
      setForm({ title: '', body: '', scope: 'INTERNAL', targetRoles: [] });
      setView('list');
      setSelected(null);
      alert(view === 'edit' ? 'Announcement updated successfully!' : 'Announcement published successfully!');
    } else {
      setFormError(result.message || `Failed to ${view === 'edit' ? 'update' : 'create'} announcement.`);
    }
  }

  function handleEdit(ann) {
    setForm({
      title: ann.title,
      body: ann.content,
      scope: ann.scope,
      targetRoles: ann.target_roles || []
    });
    setSelected(ann.id);
    setView('edit');
  }

  async function handleDelete(annId, annTitle) {
    if (!confirm(`Are you sure you want to delete "${annTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    const result = await deleteAnnouncement(annId);
    if (result.success) {
      setSelected(null);
      setView('list');
      alert('Announcement deleted successfully!');
    } else {
      alert(result.message || 'Failed to delete announcement.');
    }
  }

  // Check if current user can edit/delete an announcement
  function canModify(ann) {
    if (!user) {
      return false;
    }
    
    // Normalize role to uppercase for comparison (backend returns lowercase)
    const userRole = user.role?.toUpperCase();
    
    // Super Admin and MESOB Manager can modify all announcements
    if (userRole === 'SUPER_ADMIN' || userRole === 'MESOB_MANAGER') {
      return true;
    }
    
    // Others can only modify their own announcements
    const isOwner = ann.creator?.id === user?.id || ann.published_by === user?.id;
    return isOwner;
  }

  // New/Edit announcement form
  if (view === 'new' || view === 'edit') {
    return (
      <>
        <div className="mb-6">
          <button onClick={() => { setView('list'); setSelected(null); setFormError(''); }} className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Cancel
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{view === 'edit' ? 'Edit Announcement' : 'New Announcement'}</h2>
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Audience <span className="text-red-500">*</span></label>
              <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value, targetRoles: [] }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition text-sm">
                <option value="PUBLIC">Public - Visible to everyone including citizens</option>
                <option value="INTERNAL">Internal - Staff only (employees, managers, admins)</option>
                <option value="ROLE">Role - Specific role(s)</option>
              </select>
            </div>
            
            {form.scope === 'ROLE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Roles <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE', 'ICT_STAFF'].map(role => (
                    <label key={role} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" 
                        checked={form.targetRoles.includes(role)}
                        onChange={e => {
                          if (e.target.checked) {
                            setForm(f => ({ ...f, targetRoles: [...f.targetRoles, role] }));
                          } else {
                            setForm(f => ({ ...f, targetRoles: f.targetRoles.filter(r => r !== role) }));
                          }
                        }}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-400" />
                      <span className="text-gray-700">{role.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
              <strong>Scope: {form.scope}</strong>
              {form.scope === 'PUBLIC' && <p className="mt-1">This announcement will be visible to all users including citizens.</p>}
              {form.scope === 'INTERNAL' && <p className="mt-1">This announcement will be visible only to staff (not citizens).</p>}
              {form.scope === 'ROLE' && <p className="mt-1">This announcement will be visible only to the selected role(s).</p>}
            </div>
            
            {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{formError}</div>}
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</div>}
            <button type="submit" disabled={loading} className="px-6 py-3 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold rounded-xl transition text-sm disabled:opacity-50">
              {loading ? (view === 'edit' ? 'Updating...' : 'Publishing...') : (view === 'edit' ? 'Update Announcement' : 'Publish Announcement')}
            </button>
          </form>
        </div>
      </>
    );
  }

  // Announcement detail view
  if (selected) {
    const ann = announcements.find(a => a.id === selected);
    if (!ann) return null;

    const canEdit = canModify(ann);

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
            <div className="flex items-center gap-2 flex-shrink-0">
              {ann.is_active && <span className="badge bg-green-100 text-green-800">Active</span>}
              {canEdit && (
                <>
                  <button 
                    onClick={() => handleEdit(ann)}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit announcement"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(ann.id, ann.title)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete announcement"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ann.content}</div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              <strong>Scope:</strong> {ann.scope} 
              {ann.target_roles && ann.target_roles.length > 0 && <span> ({ann.target_roles.join(', ')})</span>}
            </p>
          </div>
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
        <button onClick={() => { setView('new'); setSelected(null); setFormError(''); }} className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition">
          + New Announcement
        </button>
      </div>

      {loading && !announcements.length && (
        <div className="text-center py-8 text-gray-500">Loading announcements...</div>
      )}

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No announcements available.</div>
        ) : announcements.map(ann => (
          <div key={ann.id} onClick={() => setSelected(ann.id)}
            className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all duration-200 ${ann.is_active ? 'border-gray-100' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {ann.is_active && <span className="inline-block w-2 h-2 rounded-full bg-green-600 flex-shrink-0" />}
                  <h3 className="font-semibold text-sm text-gray-900 leading-snug">{ann.title}</h3>
                  {ann.scope === 'PUBLIC' && <span className="badge bg-green-100 text-green-800 text-xs">Public</span>}
                  {ann.scope === 'INTERNAL' && <span className="badge bg-blue-100 text-blue-800 text-xs">Internal</span>}
                  {ann.scope === 'SYSTEM' && <span className="badge bg-purple-100 text-purple-800 text-xs">System</span>}
                  {ann.scope === 'ROLE' && <span className="badge bg-orange-100 text-orange-800 text-xs">Role</span>}
                  {ann.scope === 'INSTITUTION' && <span className="badge bg-indigo-100 text-indigo-800 text-xs">Institution</span>}
                </div>
                <p className="text-xs text-gray-500">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
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
  const { t } = useApp();
  const [activeSection, setActiveSection] = useState(t.dashboard);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function navigate(section) {
    setActiveSection(section);
    setSidebarOpen(false);
  }

  function renderSection() {
    switch (activeSection) {
      case t.dashboard:              return <SectionDashboard setActiveSection={navigate} />;
      case t.institution_monitoring: return <SectionInstitutionMonitoring />;
      case t.queue_monitoring:       return <SectionQueueMonitoring />;
      case t.application_monitoring: return <SectionApplicationMonitoring />;
      case t.maintenance_oversight:  return <SectionMaintenanceOversight />;
      case t.feedback_overview:      return <MesobFeedbackOverview />;
      case t.reports:                return <SectionReports />;
      case t.analytics:              return <SectionAnalytics />;
      case t.announcements:          return <SectionAnnouncements />;
      case t.my_profile:             return <SectionMyProfile user={user} />;
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
            {getSections(t).map((section, idx) => (
              <button key={idx} onClick={() => navigate(section)}
                className={`sidebar-link w-full text-left${activeSection === section ? ' active' : ''}`}>
                {section}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button onClick={() => { localStorage.removeItem('mesob_auth'); window.location.href = '/'; }}
              className="sidebar-link w-full text-left text-red-600 hover:bg-red-50">
              {t.logout}
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
                {activeSection === t.dashboard ? t.mesob_manager_dashboard : activeSection}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
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
