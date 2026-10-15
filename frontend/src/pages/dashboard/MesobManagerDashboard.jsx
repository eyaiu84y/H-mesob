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
  const norm = String(priority || '').toUpperCase();
  const cls = {
    CRITICAL: 'bg-rose-50 text-rose-800 border-rose-200',
    HIGH: 'bg-rose-50 text-rose-800 border-rose-200',
    MEDIUM: 'bg-amber-50 text-amber-800 border-amber-200',
    NORMAL: 'bg-slate-100 text-slate-700 border-slate-200',
    LOW: 'bg-slate-100 text-slate-700 border-slate-200'
  }[norm] || 'bg-slate-100 text-slate-700 border-slate-200';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>{priority}</span>;
}

function StatusBadge({ status }) {
  const norm = String(status || '').toUpperCase().replace(/[\s-]/g, '_');
  const cls = {
    NORMAL: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    BUSY: 'bg-amber-50 text-amber-800 border-amber-200',
    WAITING: 'bg-amber-50 text-amber-800 border-amber-200',
    PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
    CALLED: 'bg-blue-50 text-[#1e3a8a] border-blue-200',
    PROCESSING: 'bg-blue-50 text-[#1e3a8a] border-blue-200',
    IN_PROGRESS: 'bg-blue-50 text-[#1e3a8a] border-blue-200',
    UNDER_REVIEW: 'bg-blue-50 text-[#1e3a8a] border-blue-200',
    ASSIGNED: 'bg-purple-50 text-purple-800 border-purple-200',
    COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    SUBMITTED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    RESOLVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  }[norm] || 'bg-slate-100 text-slate-700 border-slate-200';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>{status}</span>;
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
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Institutions</p>
          <p className="text-3xl font-extrabold text-slate-900">{totalInstitutions}</p>
          <p className="text-xs font-medium text-slate-400 mt-1">Active under MESOB</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Queue Status</p>
          <p className="text-3xl font-extrabold text-amber-600">{totalQueue}</p>
          <p className="text-xs font-medium text-amber-700 mt-1">Active tickets</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Applications</p>
          <p className="text-3xl font-extrabold text-[#1e3a8a]">{totalApps}</p>
          <p className="text-xs font-medium text-slate-400 mt-1">MESOB-wide</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Maintenance</p>
          <p className="text-3xl font-extrabold text-slate-900">{totalMaint}</p>
          <p className="text-xs font-medium text-slate-400 mt-1">Open tasks</p>
        </div>
      </div>

      {/* Institution overview table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Institution Overview</h2>
          <button onClick={() => setActiveSection('Institution Monitoring')} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold transition">View all</button>
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
                    <td className="font-semibold text-slate-800">{inst.name_en || inst.name}</td>
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
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Queue Snapshot</h2>
            <button onClick={() => setActiveSection('Queue Monitoring')} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold transition">View all</button>
          </div>
          {myTickets.filter(t => t.status === 'waiting' || t.status === 'called').length > 0 ? (
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Token</th><th>Institution</th><th>Service</th><th>Status</th></tr></thead>
                <tbody>
                  {myTickets.filter(t => t.status === 'waiting' || t.status === 'called').slice(0, 4).map(ticket => (
                    <tr key={ticket.id}>
                      <td className="font-semibold text-slate-800">{ticket.token}</td>
                      <td>{ticket.institutionName}</td>
                      <td className="text-sm text-slate-600">{ticket.serviceName}</td>
                      <td><StatusBadge status={ticket.status === 'waiting' ? 'Waiting' : 'Processing'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 py-12">
              <p className="text-sm">No active queue items</p>
            </div>
          )}
        </div>

        {/* Maintenance snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Maintenance Snapshot</h2>
            <button onClick={() => setActiveSection('Maintenance Oversight')} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold transition">View all</button>
          </div>
          {reports.filter(t => t.status !== 'Completed' && t.status !== 'COMPLETED').length > 0 ? (
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Task ID</th><th>Institution</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>
                  {reports.filter(t => t.status !== 'Completed' && t.status !== 'COMPLETED').slice(0, 4).map(t => (
                    <tr key={t.id}>
                      <td className="font-semibold text-slate-800">{t.id}</td>
                      <td>{t.institution}</td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 py-12">
              <p className="text-sm">No open maintenance tasks</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a]">
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
          <button onClick={() => setSelected(null)} className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Back to Institutions
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            {inst?.logo && <img src={inst.logo} alt={inst?.name_en || inst?.name} className="w-14 h-14 object-contain rounded-xl bg-slate-50 p-1 border border-slate-200" onError={e => { e.target.style.display = 'none'; }} />}
            <div>
              <h2 className="text-xl font-bold text-slate-900">{inst?.name_en || inst?.name}</h2>
              <p className="text-sm text-slate-500 mb-1">{inst?.name_am}</p>
              <StatusBadge status={status} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Queue</p><p className="text-3xl font-extrabold text-amber-600">{instQueue}</p></div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Applications</p><p className="text-3xl font-extrabold text-[#1e3a8a]">{instApps}</p></div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Maintenance Tasks</p><p className="text-3xl font-extrabold text-slate-900">{instMaint}</p></div>
          </div>
          {inst?.description_en && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700">
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
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Institution Monitoring</h2>
        <p className="text-sm text-slate-500 font-normal">Monitor all institutions operating under Hawassa MESOB.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
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
                    <td className="font-semibold text-slate-800">{inst?.name_en || inst?.name}</td>
                    <td>{instQueue}</td>
                    <td>{instApps}</td>
                    <td>{instMaint}</td>
                    <td><StatusBadge status={status} /></td>
                    <td><button onClick={() => setSelected(inst.id)} className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold transition">View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a]">
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
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Queue Monitoring</h2>
        <p className="text-sm text-slate-500 font-normal">Monitor queue conditions across MESOB institutions.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Waiting</p>
          <p className="text-3xl font-extrabold text-amber-900">{waiting}</p>
          <p className="text-xs text-amber-700 font-medium mt-1">In queue</p>
        </div>
        <div className="bg-blue-50/70 border border-blue-200/70 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-1">Processing</p>
          <p className="text-3xl font-extrabold text-[#314ea1]">{processing}</p>
          <p className="text-xs text-[#1e3a8a] font-medium mt-1">Being served</p>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">Completed</p>
          <p className="text-3xl font-extrabold text-emerald-700">{completed}</p>
          <p className="text-xs text-emerald-700 font-medium mt-1">Served</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Queue Items</h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-[#1e3a8a] border border-blue-200 rounded-full">{myTickets.length} items</span>
        </div>
        {myTickets.length > 0 ? (
          <div className="table-container border-0 rounded-none">
            <table className="data-table">
              <thead><tr><th>Ticket</th><th>Citizen</th><th>Service</th><th>Priority</th><th>Status</th></tr></thead>
              <tbody>
                {myTickets.slice(0, 20).map(ticket => (
                  <tr key={ticket.id}>
                    <td className="font-semibold text-slate-800">{ticket.ticketNumber || `#${ticket.id}`}</td>
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
          <div className="p-6 text-center text-slate-400 py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-semibold text-slate-600 mb-1">No Queue Items</p>
            <p className="text-xs text-slate-400">There are currently no queue items to display.</p>
          </div>
        )}
      </div>
      <div className="p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a]">
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
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Application Monitoring</h2>
        <p className="text-sm text-slate-500 font-normal">Monitor application workload across MESOB institutions.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Pending / Waiting</p>
          <p className="text-3xl font-extrabold text-amber-900">{pending}</p>
          <p className="text-xs text-amber-700 font-medium mt-1">Awaiting review</p>
        </div>
        <div className="bg-blue-50/70 border border-blue-200/70 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-1">In Progress</p>
          <p className="text-3xl font-extrabold text-[#314ea1]">{inProg}</p>
          <p className="text-xs text-[#1e3a8a] font-medium mt-1">Under review</p>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">Completed</p>
          <p className="text-3xl font-extrabold text-emerald-700">{done}</p>
          <p className="text-xs text-emerald-700 font-medium mt-1">Approved</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Applications</h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-[#1e3a8a] border border-blue-200 rounded-full">{applications.length} result{applications.length !== 1 ? 's' : ''}</span>
        </div>
        {applications.length > 0 ? (
          <div className="table-container border-0 rounded-none">
            <table className="data-table">
              <thead><tr><th>ID</th><th>Applicant</th><th>Service</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {applications.slice(0, 20).map(app => (
                  <tr key={app.id}>
                    <td className="font-semibold text-slate-800">#{app.id}</td>
                    <td>{app.applicantName || app.citizenName || 'N/A'}</td>
                    <td>{app.serviceName || app.service || 'N/A'}</td>
                    <td><StatusBadge status={app.status} /></td>
                    <td className="text-sm text-slate-500">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-semibold text-slate-600 mb-1">No Applications</p>
            <p className="text-xs text-slate-400">There are currently no applications to display.</p>
          </div>
        )}
      </div>
      <div className="p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a]">
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
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Maintenance Oversight</h2>
        <p className="text-sm text-slate-500 font-normal">Monitor technical maintenance across MESOB institutions.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Open Tasks</p><p className="text-3xl font-extrabold text-slate-900">{open}</p>{highPri > 0 && <p className="text-xs font-semibold text-rose-600 mt-1">{highPri} high priority</p>}</div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Completed</p><p className="text-3xl font-extrabold text-emerald-600">{completed}</p></div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Tasks</p><p className="text-3xl font-extrabold text-slate-900">{tasks.length}</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-900">Maintenance Tasks – MESOB-wide</h3></div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead><tr><th>Task ID</th><th>Institution</th><th>Task</th><th>Priority</th><th>Assigned To</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-slate-400 py-6">No maintenance tasks.</td></tr>
              ) : tasks.map(t => (
                <tr key={t.id}>
                  <td className="font-semibold text-slate-800">{t.id}</td>
                  <td>{t.institution}</td>
                  <td>{t.title}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td>{t.assignedTo}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-sm text-slate-500">{t.assignedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a]">
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
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Reports</h2>
        <p className="text-sm text-slate-500 font-normal">MESOB-wide operational reports based on existing system data.</p>
      </div>

      {/* Report type tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveReport(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm transition-all duration-150 ${
              activeReport === tab.key
                ? 'bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] text-white shadow-xs font-semibold'
                : 'bg-white border border-slate-300 text-slate-700 hover:border-[#314ea1]/40 hover:text-[#1e3a8a] font-medium'
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
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Waiting</p>
              <p className="text-3xl font-extrabold text-amber-900">{qWaiting}</p>
              <p className="text-xs text-amber-700 font-medium mt-1">In queue</p>
            </div>
            <div className="bg-blue-50/70 border border-blue-200/70 rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-1">Processing</p>
              <p className="text-3xl font-extrabold text-[#314ea1]">{qProcessing}</p>
              <p className="text-xs text-[#1e3a8a] font-medium mt-1">Being served</p>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">Completed</p>
              <p className="text-3xl font-extrabold text-emerald-700">{qCompleted}</p>
              <p className="text-xs text-emerald-700 font-medium mt-1">Done</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-900">Queue Activity – MESOB-wide</h3></div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Ticket</th><th>Institution</th><th>Service</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>
                  {myTickets.length > 0 ? (
                    myTickets.slice(0, 20).map(ticket => {
                      const inst = institutions.find(i => i.id === ticket.institutionId);
                      return (
                        <tr key={ticket.id}>
                          <td className="font-semibold text-slate-800">{ticket.ticketNumber || `#${ticket.id}`}</td>
                          <td>{inst?.name_en || 'N/A'}</td>
                          <td>{ticket.serviceName || ticket.service || 'N/A'}</td>
                          <td><PriorityBadge priority={ticket.priority || 'Normal'} /></td>
                          <td><StatusBadge status={ticket.status} /></td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-400 py-8">
                        <p className="font-medium text-slate-500">No queue tickets</p>
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
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Pending / Waiting</p>
              <p className="text-3xl font-extrabold text-amber-900">{appPending}</p>
              <p className="text-xs text-amber-700 font-medium mt-1">Awaiting review</p>
            </div>
            <div className="bg-blue-50/70 border border-blue-200/70 rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-1">In Progress</p>
              <p className="text-3xl font-extrabold text-[#314ea1]">{appInProg}</p>
              <p className="text-xs text-[#1e3a8a] font-medium mt-1">Under review</p>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">Completed</p>
              <p className="text-3xl font-extrabold text-emerald-700">{appDone}</p>
              <p className="text-xs text-emerald-700 font-medium mt-1">Approved</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-900">Application Report – MESOB-wide</h3></div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>App ID</th><th>Institution</th><th>Service</th><th>Submitted</th><th>Status</th></tr></thead>
                <tbody>
                  {applications.length > 0 ? (
                    applications.slice(0, 20).map(app => {
                      const inst = institutions.find(i => i.id === app.institutionId);
                      return (
                        <tr key={app.id}>
                          <td className="font-semibold text-slate-800">#{app.id}</td>
                          <td>{inst?.name_en || 'N/A'}</td>
                          <td>{app.serviceName || app.service || 'N/A'}</td>
                          <td className="text-sm text-slate-500">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td><StatusBadge status={app.status} /></td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-400 py-8">
                        <p className="font-medium text-slate-500">No applications</p>
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Open Tasks</p><p className="text-3xl font-extrabold text-slate-900">{maintOpen}</p></div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Completed</p><p className="text-3xl font-extrabold text-emerald-600">{maintDone}</p></div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reports Submitted</p><p className="text-3xl font-extrabold text-slate-900">{maintReport}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-900">Maintenance Report – MESOB-wide</h3></div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Task ID</th><th>Institution</th><th>Task</th><th>Priority</th><th>Technician</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {reports.length > 0 ? (
                    reports.slice(0, 20).map(task => (
                      <tr key={task.id}>
                        <td className="font-semibold text-slate-800">{task.id}</td>
                        <td>{task.institution}</td>
                        <td>{task.title}</td>
                        <td><PriorityBadge priority={task.priority} /></td>
                        <td>{task.assignedTo}</td>
                        <td><StatusBadge status={task.status} /></td>
                        <td className="text-sm text-slate-500">{task.assignedDate}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center text-slate-400 py-8">
                        <p className="font-medium text-slate-500">No maintenance tasks</p>
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Institutions</p><p className="text-3xl font-extrabold text-slate-900">{institutions.length}</p></div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Busy</p><p className="text-3xl font-extrabold text-amber-600">{institutions.filter(inst => {
              const qCount = myTickets.filter(t => t.institutionId === inst.id && (t.status === 'waiting' || t.status === 'called')).length;
              return qCount > 5;
            }).length}</p></div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Normal</p><p className="text-3xl font-extrabold text-emerald-600">{institutions.filter(inst => {
              const qCount = myTickets.filter(t => t.institutionId === inst.id && (t.status === 'waiting' || t.status === 'called')).length;
              return qCount <= 5;
            }).length}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-900">Institution Report – MESOB-wide</h3></div>
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
                        <td className="font-semibold text-slate-800">{inst?.name_en || inst?.name}</td>
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

      <div className="p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a]">
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
  const [detailView, setDetailView] = useState(null); // { type, status, institutionId }

  const displayInsts = filterInst
    ? institutions.filter(o => o.id === filterInst)
    : institutions;

  // Handle badge click
  const showDetails = (type, status, institutionId) => {
    setDetailView({ type, status, institutionId });
  };

  const closeDetails = () => {
    setDetailView(null);
  };

  // Get filtered data for detail modal
  const getDetailData = () => {
    if (!detailView) return [];
    
    const { type, status, institutionId } = detailView;
    const inst = institutions.find(i => i.id === institutionId);
    
    if (type === 'queue') {
      let filtered = myTickets.filter(t => t.institutionId === institutionId);
      if (status === 'waiting') filtered = filtered.filter(t => t.status === 'waiting' || t.status === 'PENDING');
      else if (status === 'serving') filtered = filtered.filter(t => t.status === 'called' || t.status === 'IN_PROGRESS');
      else if (status === 'done') filtered = filtered.filter(t => t.status === 'completed' || t.status === 'COMPLETED');
      return filtered.map(t => ({ ...t, institutionName: inst?.name_en }));
    }
    
    if (type === 'app') {
      let filtered = applications.filter(a => a.institutionId === institutionId);
      if (status === 'new') filtered = filtered.filter(a => a.status === 'SUBMITTED' || a.status === 'Submitted');
      else if (status === 'review') filtered = filtered.filter(a => a.status === 'UNDER_REVIEW' || a.status === 'Under Review');
      else if (status === 'approved') filtered = filtered.filter(a => a.status === 'APPROVED' || a.status === 'Approved');
      else if (status === 'completed') filtered = filtered.filter(a => a.status === 'COMPLETED' || a.status === 'Completed');
      return filtered.map(a => ({ ...a, institutionName: inst?.name_en }));
    }
    
    if (type === 'maint') {
      let filtered = reports.filter(r => r.institution === (inst?.name_en || inst?.name));
      if (status === 'open') filtered = filtered.filter(r => r.status === 'Submitted' || r.status === 'REPORTED');
      else if (status === 'assigned') filtered = filtered.filter(r => r.status === 'Assigned' || r.status === 'ASSIGNED');
      else if (status === 'progress') filtered = filtered.filter(r => r.status === 'In Progress' || r.status === 'IN_PROGRESS');
      else if (status === 'resolved') filtered = filtered.filter(r => r.status === 'Completed' || r.status === 'RESOLVED');
      return filtered.map(r => ({ ...r, institutionName: inst?.name_en }));
    }
    
    return [];
  };

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
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Analytics</h2>
        <p className="text-sm text-slate-500 font-normal">Operational performance metrics across Hawassa MESOB.</p>
      </div>

      {/* Filter */}
      <div className="mb-6 flex items-center gap-3">
        <select value={filterInst} onChange={e => setFilterInst(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white">
          <option value="">All Institutions</option>
          {institutions.map(o => <option key={o.id} value={o.id}>{o.name_en}</option>)}
        </select>
        {filterInst && <button onClick={() => setFilterInst('')} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold transition">Show all</button>}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Queue</p><p className="text-3xl font-extrabold text-amber-600">{totalQueue}</p></div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Applications</p><p className="text-3xl font-extrabold text-[#1e3a8a]">{totalApps}</p></div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Open Maintenance</p><p className="text-3xl font-extrabold text-slate-900">{totalMaint}</p></div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Busy Institutions</p><p className={`text-3xl font-extrabold ${busyCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{busyCount}</p></div>
      </div>

      {/* Per-institution breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-900 text-base">Institution Performance Breakdown</h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time operational metrics across all institutions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Institution</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-l border-slate-200">Queue</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Queue Breakdown</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-l border-slate-200">Apps</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Application Breakdown</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-l border-slate-200">Maint.</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Maintenance Breakdown</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-l border-slate-200">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayInsts.map((inst, idx) => {
                // Queue stats
                const instQueueData = myTickets.filter(t => t.institutionId === inst.id);
                const queueWaiting = instQueueData.filter(t => t.status === 'waiting' || t.status === 'PENDING').length;
                const queueCalled = instQueueData.filter(t => t.status === 'called' || t.status === 'IN_PROGRESS').length;
                const queueCompleted = instQueueData.filter(t => t.status === 'completed' || t.status === 'COMPLETED').length;
                const instQueue = queueWaiting + queueCalled;
                
                // Application stats
                const instAppData = applications.filter(app => app.institutionId === inst.id);
                const appSubmitted = instAppData.filter(a => a.status === 'SUBMITTED' || a.status === 'Submitted').length;
                const appReview = instAppData.filter(a => a.status === 'UNDER_REVIEW' || a.status === 'Under Review').length;
                const appApproved = instAppData.filter(a => a.status === 'APPROVED' || a.status === 'Approved').length;
                const appCompleted = instAppData.filter(a => a.status === 'COMPLETED' || a.status === 'Completed').length;
                const instApps = instAppData.length;
                
                // Maintenance stats
                const instReports = reports.filter(r => r.institution === (inst?.name_en || inst?.name));
                const maintOpen = instReports.filter(r => r.status === 'Submitted' || r.status === 'REPORTED').length;
                const maintAssigned = instReports.filter(r => r.status === 'Assigned' || r.status === 'ASSIGNED').length;
                const maintInProgress = instReports.filter(r => r.status === 'In Progress' || r.status === 'IN_PROGRESS').length;
                const maintResolved = instReports.filter(r => r.status === 'Completed' || r.status === 'RESOLVED').length;
                const instMaint = maintOpen + maintAssigned + maintInProgress;
                
                const status = instQueue > 5 ? 'Busy' : 'Normal';
                const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40';
                
                return (
                  <tr key={inst.id} className={`${rowBg} hover:bg-slate-100/60 transition-colors duration-150`}>
                    {/* Institution */}
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{inst?.name_en || inst?.name}</div>
                      <div className="text-xs text-slate-500">{inst?.name_am}</div>
                    </td>
                    
                    {/* Queue Total */}
                    <td className="px-4 py-4 text-center font-extrabold text-2xl text-amber-700 bg-amber-50/40 border-l border-amber-200/60">
                      <span>{instQueue}</span>
                    </td>
                    
                    {/* Queue Detail */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {queueWaiting > 0 && (
                          <button
                            onClick={() => showDetails('queue', 'waiting', inst.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs text-amber-900 font-semibold transition-colors"
                          >
                            <span>Waiting</span>
                            <span className="font-bold">{queueWaiting}</span>
                          </button>
                        )}
                        {queueCalled > 0 && (
                          <button
                            onClick={() => showDetails('queue', 'serving', inst.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs text-[#1e3a8a] font-semibold transition-colors"
                          >
                            <span>Serving</span>
                            <span className="font-bold">{queueCalled}</span>
                          </button>
                        )}
                        {queueCompleted > 0 && (
                          <button
                            onClick={() => showDetails('queue', 'done', inst.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-semibold transition-colors"
                          >
                            <span>Done</span>
                            <span className="font-bold">{queueCompleted}</span>
                          </button>
                        )}
                        {instQueueData.length === 0 && <span className="text-xs text-slate-400 italic">No queue data</span>}
                      </div>
                    </td>
                    
                    {/* Applications Total */}
                    <td className="px-4 py-4 text-center font-extrabold text-2xl text-[#1e3a8a] bg-blue-50/40 border-l border-blue-200/60">
                      <span>{instApps}</span>
                    </td>
                    
                    {/* Applications Detail */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {appSubmitted > 0 && (
                          <button
                            onClick={() => showDetails('app', 'new', inst.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold transition-colors"
                          >
                            <span>New</span>
                            <span className="font-bold">{appSubmitted}</span>
                          </button>
                        )}
                        {appReview > 0 && (
                          <button
                            onClick={() => showDetails('app', 'review', inst.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs text-[#1e3a8a] font-semibold transition-colors"
                          >
                            <span>Review</span>
                            <span className="font-bold">{appReview}</span>
                          </button>
                        )}
                        {appApproved > 0 && (
                          <button
                            onClick={() => showDetails('app', 'approved', inst.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold transition-colors"
                          >
                            <span>Approved</span>
                            <span className="font-bold">{appApproved}</span>
                          </button>
                        )}
                        {appCompleted > 0 && (
                          <button
                            onClick={() => showDetails('app', 'completed', inst.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold transition-colors"
                          >
                            <span>Completed</span>
                            <span className="font-bold">{appCompleted}</span>
                          </button>
                        )}
                        {instAppData.length === 0 && <span className="text-xs text-slate-400 italic">No applications</span>}
                      </div>
                    </td>
                    
                    {/* Maintenance Total */}
                    <td className="px-4 py-4 text-center font-extrabold text-2xl text-slate-800 bg-slate-50/40 border-l border-slate-200">
                      <span>{instMaint}</span>
                    </td>
                    
                    {/* Maintenance Detail */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {maintOpen > 0 && (
                          <button
                            onClick={() => showDetails('maint', 'open', inst.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs text-rose-800 font-semibold transition-colors"
                          >
                            <span>Open</span>
                            <span className="font-bold">{maintOpen}</span>
                          </button>
                        )}
                        {maintAssigned > 0 && (
                          <button
                            onClick={() => showDetails('maint', 'assigned', inst.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs text-[#1e3a8a] font-semibold transition-colors"
                          >
                            <span>Assigned</span>
                            <span className="font-bold">{maintAssigned}</span>
                          </button>
                        )}
                        {maintInProgress > 0 && (
                          <button
                            onClick={() => showDetails('maint', 'progress', inst.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs text-amber-800 font-semibold transition-colors"
                          >
                            <span>Progress</span>
                            <span className="font-bold">{maintInProgress}</span>
                          </button>
                        )}
                        {maintResolved > 0 && (
                          <button
                            onClick={() => showDetails('maint', 'resolved', inst.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold transition-colors"
                          >
                            <span>Resolved</span>
                            <span className="font-bold">{maintResolved}</span>
                          </button>
                        )}
                        {instReports.length === 0 && <span className="text-xs text-slate-400 italic">No reports</span>}
                      </div>
                    </td>
                    
                    {/* Overall Status */}
                    <td className="px-4 py-4 text-center border-l border-slate-200">
                      <StatusBadge status={status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailView && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={closeDetails}>
          <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {detailView.type === 'queue' ? 'Queue Details' : detailView.type === 'app' ? 'Application Details' : 'Maintenance Details'}
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  {institutions.find(i => i.id === detailView.institutionId)?.name_en} - {detailView.status.toUpperCase()} Status
                </p>
              </div>
              <button onClick={closeDetails} className="text-white hover:bg-white/20 rounded-lg p-2 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {getDetailData().length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {detailView.type === 'queue' && (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Queue #</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Citizen</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Service</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Registered Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Called Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Completed Time</th>
                          </>
                        )}
                        {detailView.type === 'app' && (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">App #</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Citizen</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Service</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Submitted Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Completed Time</th>
                          </>
                        )}
                        {detailView.type === 'maint' && (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Report #</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Title</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Priority</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Reported Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Resolved Time</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getDetailData().map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          {detailView.type === 'queue' && (
                            <>
                              <td className="px-4 py-3 font-semibold text-slate-800">{item.queueNumber || item.queue_number || 'N/A'}</td>
                              <td className="px-4 py-3">{item.citizenName || 'Citizen'}</td>
                              <td className="px-4 py-3">{item.serviceName || 'Service'}</td>
                              <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                              <td className="px-4 py-3 text-sm text-slate-500">
                                {item.createdAt ? new Date(item.createdAt).toLocaleString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                                  hour12: true, timeZone: 'Africa/Addis_Ababa'
                                }) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-500">
                                {item.started_at || item.startedAt ? new Date(item.started_at || item.startedAt).toLocaleString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                                  hour12: true, timeZone: 'Africa/Addis_Ababa'
                                }) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-500">
                                {item.completed_at || item.completedAt ? new Date(item.completed_at || item.completedAt).toLocaleString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                                  hour12: true, timeZone: 'Africa/Addis_Ababa'
                                }) : '-'}
                              </td>
                            </>
                          )}
                          {detailView.type === 'app' && (
                            <>
                              <td className="px-4 py-3 font-semibold text-slate-800">{item.applicationNumber || 'N/A'}</td>
                              <td className="px-4 py-3">{item.citizenName || 'Citizen'}</td>
                              <td className="px-4 py-3">{item.service || 'Service'}</td>
                              <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                              <td className="px-4 py-3 text-sm text-slate-500">
                                {item.submitted_at ? new Date(item.submitted_at).toLocaleString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                                  hour12: true, timeZone: 'Africa/Addis_Ababa'
                                }) : item.submittedDate || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-500">
                                {item.completed_at || item.completedAt ? new Date(item.completed_at || item.completedAt).toLocaleString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                                  hour12: true, timeZone: 'Africa/Addis_Ababa'
                                }) : '-'}
                              </td>
                            </>
                          )}
                          {detailView.type === 'maint' && (
                            <>
                              <td className="px-4 py-3 font-semibold text-slate-800">{item.reportNumber || 'N/A'}</td>
                              <td className="px-4 py-3">{item.title || item.problemDescription || 'No title'}</td>
                              <td className="px-4 py-3"><PriorityBadge priority={item.priority || 'NORMAL'} /></td>
                              <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                              <td className="px-4 py-3 text-sm text-slate-500">
                                {item.reportedAtTimestamp ? new Date(item.reportedAtTimestamp).toLocaleString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                                  hour12: true, timeZone: 'Africa/Addis_Ababa'
                                }) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-500">
                                {item.resolved_at || item.resolvedAt ? new Date(item.resolved_at || item.resolvedAt).toLocaleString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                                  hour12: true, timeZone: 'Africa/Addis_Ababa'
                                }) : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-base font-semibold text-slate-600">No data available</p>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <p className="text-xs text-slate-500">
                Total: <span className="font-bold text-slate-900">{getDetailData().length}</span> items
              </p>
              <button onClick={closeDetails} className="px-5 py-2 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] text-white rounded-xl shadow-xs font-semibold text-sm transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a]">
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
          <button onClick={() => { setView('list'); setSelected(null); setFormError(''); }} className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Cancel
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-slate-900 mb-6">{view === 'edit' ? 'Edit Announcement' : 'New Announcement'}</h2>
          <form onSubmit={submitAnnouncement} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title <span className="text-rose-500">*</span></label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Brief announcement title"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Content <span className="text-rose-500">*</span></label>
              <textarea rows={5} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Announcement content"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm resize-y bg-white" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Audience <span className="text-rose-500">*</span></label>
              <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value, targetRoles: [] }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white">
                <option value="PUBLIC">Public - Visible to everyone including citizens</option>
                <option value="INTERNAL">Internal - Staff only (employees, managers, admins)</option>
                <option value="ROLE">Role - Specific role(s)</option>
              </select>
            </div>
            
            {form.scope === 'ROLE' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Roles <span className="text-rose-500">*</span></label>
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
                        className="rounded border-slate-300 text-[#314ea1] focus:ring-[#314ea1]" />
                      <span className="text-slate-700 font-medium">{role.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800">
              <strong className="text-slate-900">Scope: {form.scope}</strong>
              {form.scope === 'PUBLIC' && <p className="mt-1 text-slate-600">This announcement will be visible to all users including citizens.</p>}
              {form.scope === 'INTERNAL' && <p className="mt-1 text-slate-600">This announcement will be visible only to staff (not citizens).</p>}
              {form.scope === 'ROLE' && <p className="mt-1 text-slate-600">This announcement will be visible only to the selected role(s).</p>}
            </div>
            
            {formError && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 font-medium">{formError}</div>}
            {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 font-medium">{error}</div>}
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white font-semibold rounded-xl transition shadow-xs text-sm disabled:opacity-50">
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
          <button onClick={() => setSelected(null)} className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Back to Announcements
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900">{ann.title}</h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              {ann.is_active && <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">Active</span>}
              {canEdit && (
                <>
                  <button 
                    onClick={() => handleEdit(ann)}
                    className="px-3 py-1.5 text-sm text-[#1e3a8a] hover:bg-slate-100 rounded-lg transition font-semibold"
                    title="Edit announcement"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(ann.id, ann.title)}
                    className="px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition font-medium"
                    title="Delete announcement"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-4">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ann.content}</div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-700">Scope:</strong> {ann.scope} 
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
          <h2 className="text-lg font-bold text-slate-900 mb-1">Announcements</h2>
          <p className="text-sm text-slate-500">MESOB-wide operational announcements and notifications.</p>
        </div>
        <button onClick={() => { setView('new'); setSelected(null); setFormError(''); }} className="px-4 py-2 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white text-sm font-semibold rounded-xl transition shadow-xs">
          + New Announcement
        </button>
      </div>

      {loading && !announcements.length && (
        <div className="text-center py-8 text-slate-500">Loading announcements...</div>
      )}

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center text-slate-400 py-12">No announcements available.</div>
        ) : announcements.map(ann => (
          <div key={ann.id} onClick={() => setSelected(ann.id)}
            className={`bg-white rounded-2xl border shadow-xs p-5 cursor-pointer hover:border-slate-300 transition-all duration-200 ${ann.is_active ? 'border-slate-200/90' : 'border-slate-200 bg-slate-50/70'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {ann.is_active && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                  <h3 className="font-semibold text-sm text-slate-900 leading-snug">{ann.title}</h3>
                  {ann.scope === 'PUBLIC' && <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">Public</span>}
                  {ann.scope === 'INTERNAL' && <span className="badge bg-blue-50 text-[#1e3a8a] border border-blue-200 text-xs font-semibold">Internal</span>}
                  {ann.scope === 'SYSTEM' && <span className="badge bg-purple-50 text-purple-800 border border-purple-200 text-xs font-semibold">System</span>}
                  {ann.scope === 'ROLE' && <span className="badge bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">Role</span>}
                  {ann.scope === 'INSTITUTION' && <span className="badge bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-semibold">Institution</span>}
                </div>
                <p className="text-xs text-slate-500">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
              </div>
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <h2 className="text-lg font-bold text-slate-900 mb-1">My Profile</h2>
        <p className="text-sm text-slate-500">Your account information.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md">
            {user?.name?.charAt(0) || 'M'}
          </div>
          <div>
            <p className="font-bold text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="badge bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold mt-1">MESOB Manager</span>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Full Name</span><span className="font-semibold text-slate-900">{user?.name}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-semibold text-slate-900">{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Role</span><span className="font-semibold text-slate-900">MESOB Manager</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Scope</span><span className="font-semibold text-slate-900">Hawassa MESOB</span></div>
        </div>
      </div>
      <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800 max-w-lg">
        <strong className="text-slate-900">Note:</strong> To update your profile or change your password, contact the Super Admin.
      </div>
    </>
  );
}

// ─── Main MesobManagerDashboard ───────────────────────────────────
export default function MesobManagerDashboard() {
  const { user, logout } = useAuth();
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
    <div className="bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#edf4fc] min-h-screen text-slate-900">
      <div className="flex min-h-screen">

        {/* ── Sidebar ── */}
        <aside className={`db-sidebar fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-md border-r border-slate-200/90 flex flex-col transition-transform duration-200${sidebarOpen ? ' open' : ''}`}>
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] flex items-center justify-center font-bold text-lg shadow-md">M</div>
              <div>
                <p className="font-bold text-slate-900 text-sm">MESOB Center</p>
                <p className="text-xs text-slate-500">MESOB Manager</p>
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

          <div className="p-4 border-t border-slate-100">
            <button onClick={logout}
              className="sidebar-link w-full text-left text-rose-600 hover:bg-rose-50/80 font-medium">
              {t.logout}
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/90 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-700" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              </button>
              <h1 className="text-lg font-bold text-slate-900">
                {activeSection === t.dashboard ? t.mesob_manager_dashboard : activeSection}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <span className="badge bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold">MESOB Manager</span>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
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
