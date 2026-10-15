import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAnnouncements } from '../../context/AnnouncementContext';
import { useApplications } from '../../context/ApplicationContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import { useQueue } from '../../context/QueueContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { createTaskAssignmentNotification } from '../../utils/sharedData';
import InstitutionFeedback from '../../components/dashboard/InstitutionFeedback';
import api from '../../utils/api';

// ─── Navigation sections ──────────────────────────────────────────
const SECTIONS = [
  'Dashboard',
  'Queue Management',
  'Applications',
  'Maintenance',
  'Task Assignment',
  'Service Feedback',
  'Staff Management',
  'Reports',
  'Announcements',
  'My Profile',
];

// No mock data - ready for backend integration
// Queue, applications, and maintenance data will come from API
// Technicians loaded dynamically from AuthContext based on institution

// ─── Badge helpers ────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const cls = {
    High: 'badge bg-rose-50 text-rose-800 border border-rose-200',
    Medium: 'badge bg-amber-50 text-amber-800 border border-amber-200',
    Normal: 'badge bg-slate-100 text-slate-700 border border-slate-200'
  }[priority] || 'badge bg-slate-100 text-slate-700 border border-slate-200';
  return <span className={cls}>{priority}</span>;
}

function StatusBadge({ status }) {
  const cls = {
    Pending: 'badge bg-amber-50 text-amber-800 border border-amber-200',
    Waiting: 'badge bg-amber-50 text-amber-800 border border-amber-200',
    Assigned: 'badge bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold',
    'In Progress': 'badge bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold',
    Processing: 'badge bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold',
    Completed: 'badge bg-emerald-50 text-emerald-800 border border-emerald-200',
    Submitted: 'badge bg-blue-50 text-[#1e3a8a] border border-blue-200',
    Active: 'badge bg-emerald-50 text-emerald-800 border border-emerald-200',
    Approved: 'badge bg-emerald-50 text-emerald-800 border border-emerald-200',
    Rejected: 'badge bg-rose-50 text-rose-800 border border-rose-200',
    Cancelled: 'badge bg-rose-50 text-rose-800 border border-rose-200',
  }[status] || 'badge bg-slate-100 text-slate-700 border border-slate-200';
  return <span className={cls}>{status}</span>;
}

// ─── SECTION: Dashboard Overview ─────────────────────────────────
function SectionDashboard({ setActiveSection, userInstitution }) {
  const { announcements } = useAnnouncements();
  const { reports } = useMaintenance();
  const { myTickets } = useQueue();
  const { applications } = useApplications();
  const { user } = useAuth();
  
  // Get institution ID for filtering
  const institutionId = user?.institution_id;
  
  // Filter queue items by institution
  const queueItems = useMemo(() => {
    if (!institutionId) return [];
    return myTickets.filter(ticket => ticket.institutionId === institutionId);
  }, [myTickets, institutionId]);
  
  // Calculate queue statistics
  const activeQueue = queueItems.filter(item => 
    item.status === 'waiting' || item.status === 'called'
  ).length;
  
  // Calculate application statistics - filter by institution and count pending/in-progress
  const activeApps = useMemo(() => {
    if (!institutionId) return 0;
    
    // Filter applications for this institution and count pending/in-progress statuses
    const institutionApps = applications.filter(app => {
      const appInstitutionId = app.institution_id || app.institutionId;
      return appInstitutionId === institutionId;
    });
    
    // Count applications that are pending or in progress
    const pendingStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_DOCUMENTS'];
    return institutionApps.filter(app => 
      pendingStatuses.includes(app.status?.toUpperCase())
    ).length;
  }, [applications, institutionId]);
  
  // Calculate maintenance statistics - reports are already filtered by backend for institution manager
  const openMaint = useMemo(() => {
    return (reports || []).filter(r => r.status !== 'Completed' && r.status !== 'Resolved').length;
  }, [reports]);
  
  const unread = announcements.filter(a => !a.is_read).length;

  return (
    <>
      {/* Institution banner */}
      <div className="mb-6 p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-center gap-3.5 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] flex items-center justify-center font-bold text-base flex-shrink-0 shadow-xs border border-[#314ea1]/20">
          I
        </div>
        <div>
          <p className="text-xs text-[#314ea1] font-bold uppercase tracking-wider">Assigned Institution</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">{userInstitution || 'Not Assigned'}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Queue Status</p>
          <p className="text-2xl font-bold text-slate-900">{activeQueue}</p>
          <p className="text-xs text-amber-700 font-medium mt-1">Active tickets</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Applications</p>
          <p className="text-2xl font-bold text-slate-900">{activeApps}</p>
          <p className="text-xs text-slate-400 mt-1">Pending / in progress</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Maintenance</p>
          <p className="text-2xl font-bold text-slate-900">{openMaint}</p>
          <p className="text-xs text-slate-400 mt-1">Open tasks</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Announcements</p>
          <p className="text-2xl font-bold text-slate-900">{unread}</p>
          <p className="text-xs text-slate-400 mt-1">Unread</p>
        </div>
      </div>

      {/* Queue overview */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">Queue Overview</h2>
          <button onClick={() => setActiveSection('Queue Management')} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold transition">View all</button>
        </div>
        {activeQueue > 0 ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-600 font-medium">Active Tickets</span>
              <span className="text-2xl font-bold text-slate-900">{activeQueue}</span>
            </div>
            <p className="text-xs text-slate-500">Citizens are currently in queue at your institution.</p>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 py-10">
            <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium text-slate-700">No active queue items</p>
            <p className="text-xs text-slate-400 mt-1">Queue tickets will appear here when citizens check in.</p>
          </div>
        )}
      </div>

      {/* Applications overview */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">Applications Overview</h2>
          <button onClick={() => setActiveSection('Applications')} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold transition">View all</button>
        </div>
        {activeApps > 0 ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-600 font-medium">Pending / In Progress</span>
              <span className="text-2xl font-bold text-slate-900">{activeApps}</span>
            </div>
            <p className="text-xs text-slate-500">Applications waiting for review or currently being processed.</p>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 py-10">
            <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium text-slate-700">No pending applications</p>
            <p className="text-xs text-slate-400 mt-1">New applications will appear here when citizens submit them.</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-sm text-[#1e3a8a] shadow-xs">
        <strong className="font-semibold">Institution Manager:</strong> Monitor your institution's queue, applications, maintenance, and task assignments. You manage {userInstitution || 'your assigned institution'} only.
      </div>
    </>
  );
}

// ─── SECTION: Queue Management ────────────────────────────────────
function SectionQueueManagement({ userInstitution }) {
  const { myTickets, loading } = useQueue();
  const { user } = useAuth();
  
  // Institution Manager sees all queue items for their institution
  const institutionId = user?.institution_id;
  
  // Filter queue items by institution
  const queueItems = useMemo(() => {
    if (!institutionId) return [];
    return myTickets.filter(ticket => ticket.institutionId === institutionId);
  }, [myTickets, institutionId]);
  
  // Calculate counts
  const waitingCount = queueItems.filter(item => item.status === 'waiting').length;
  const processingCount = queueItems.filter(item => item.status === 'called').length;
  
  // Count completed today
  const today = new Date().toDateString();
  const completedTodayCount = queueItems.filter(item => {
    if (item.status !== 'completed') return false;
    const completedDate = new Date(item.completedAt || item.createdAt).toDateString();
    return completedDate === today;
  }).length;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Queue Management</h2>
        <p className="text-sm text-slate-500">Monitor the service queue for {userInstitution || 'your institution'}.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Waiting</p>
          <p className="text-2xl font-bold text-amber-600">{waitingCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Processing</p>
          <p className="text-2xl font-bold text-[#1e3a8a]">{processingCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Completed Today</p>
          <p className="text-2xl font-bold text-emerald-600">{completedTodayCount}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-semibold text-slate-900">Queue — {userInstitution || 'Institution'}</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{queueItems.length} total</span>
        </div>
        
        {loading ? (
          <div className="p-6 text-center text-slate-400 py-12">
            <p className="text-sm">Loading queue data...</p>
          </div>
        ) : queueItems.length === 0 ? (
          <div className="p-6 text-center text-slate-400 py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium text-slate-700 mb-1">No Active Queue Items</p>
            <p className="text-xs text-slate-400">Queue items will appear here when citizens register for services at your institution.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queueItems.map((item) => {
              const statusColors = {
                waiting: 'bg-amber-50 text-amber-800 border border-amber-200',
                called: 'bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold',
                completed: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
                cancelled: 'bg-rose-50 text-rose-800 border border-rose-200'
              };
              
              const statusLabels = {
                waiting: 'Waiting',
                called: 'Being Served',
                completed: 'Completed',
                cancelled: 'Cancelled'
              };
              
              return (
                <div key={item.id} className="px-6 py-4 hover:bg-slate-50/70 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] flex items-center justify-center font-bold text-sm shadow-xs border border-[#314ea1]/20">
                        {item.token}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.serviceName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Registered at {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                      {item.assignedTo && (
                        <p className="text-xs text-slate-400 mt-1">Assigned to employee</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-sm text-blue-900">
        <strong>Queue Management:</strong> Monitor queue status for your institution. Queue items are processed by assigned Employees.
      </div>
    </>
  );
}

// ─── SECTION: Applications ────────────────────────────────────────
function SectionApplications({ userInstitution }) {
  const { applications } = useApplications();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  // Filter applications for this institution
  const institutionApplications = applications.filter(app => 
    app.institution === userInstitution || 
    app.institutionId === user?.institution_id
  );

  // Filter by search query
  const filteredApplications = institutionApplications.filter(app => {
    const q = searchQuery.toLowerCase();
    return (
      (app.applicationNumber && app.applicationNumber.toLowerCase().includes(q)) ||
      (app.citizenName && app.citizenName.toLowerCase().includes(q)) ||
      (app.citizenEmail && app.citizenEmail.toLowerCase().includes(q)) ||
      (app.service && app.service.toLowerCase().includes(q)) ||
      (app.status && app.status.toLowerCase().includes(q))
    );
  });

  // Application detail view
  if (selectedApp) {
    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelectedApp(null)}
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Applications
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-5 mb-6">
            <h2 className="text-xl font-bold text-slate-900">Application Details</h2>
            <p className="text-sm text-slate-500 mt-1">Application #{selectedApp.applicationNumber || selectedApp.id}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</label>
              <div className="mt-1.5">
                <StatusBadge status={selectedApp.status} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Submitted</label>
              <p className="mt-1 font-medium text-slate-900">{selectedApp.submittedDate}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Service</label>
              <p className="mt-1 font-medium text-slate-900">{selectedApp.service}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Institution</label>
              <p className="mt-1 font-medium text-slate-900">{selectedApp.institution}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last Updated</label>
              <p className="mt-1 font-medium text-slate-900">{selectedApp.lastUpdated}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 mb-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Citizen Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <label className="text-xs text-slate-500">Name</label>
                <p className="mt-0.5 font-semibold text-slate-900">{selectedApp.citizenName || 'N/A'}</p>
              </div>
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <label className="text-xs text-slate-500">Email</label>
                <p className="mt-0.5 font-semibold text-slate-900">{selectedApp.citizenEmail || 'N/A'}</p>
              </div>
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <label className="text-xs text-slate-500">Phone</label>
                <p className="mt-0.5 font-semibold text-slate-900">{selectedApp.citizenPhone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {selectedApp.applicationData && (
            <div className="border-t border-slate-100 pt-6 mb-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Application Data</h3>
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                <div className="space-y-3">
                  {selectedApp.applicationData.fullName && (
                    <div>
                      <label className="text-xs text-slate-500">Full Name</label>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">{selectedApp.applicationData.fullName}</p>
                    </div>
                  )}
                  {selectedApp.applicationData.address && (
                    <div>
                      <label className="text-xs text-slate-500">Address</label>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">{selectedApp.applicationData.address}</p>
                    </div>
                  )}
                  {selectedApp.applicationData.additionalInfo && (
                    <div>
                      <label className="text-xs text-slate-500">Additional Information</label>
                      <p className="mt-0.5 text-sm text-slate-800 whitespace-pre-wrap">{selectedApp.applicationData.additionalInfo}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedApp.reviewNotes && (
            <div className="border-t border-slate-100 pt-6 mb-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Review Notes</h3>
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                <p className="text-slate-800 text-sm whitespace-pre-wrap">{selectedApp.reviewNotes}</p>
              </div>
            </div>
          )}

          {selectedApp.assignedEmployee && (
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-base font-bold text-slate-900 mb-3">Assignment</h3>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-[#1e3a8a] text-sm font-medium border border-blue-200/80">
                <span>Assigned to:</span>
                <strong>{selectedApp.assignedEmployee}</strong>
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-6 mt-6">
            <button 
              onClick={() => setSelectedApp(null)}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-semibold text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Applications</h2>
        <p className="text-sm text-slate-500">Monitor applications for {userInstitution || 'your institution'}.</p>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search applications..."
            className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-semibold text-slate-900">Institution Applications</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{filteredApplications.length} result{filteredApplications.length !== 1 ? 's' : ''}</span>
        </div>
        
        {filteredApplications.length > 0 ? (
          <div className="table-container border-0 rounded-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Citizen</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map(app => (
                  <tr key={app.id}>
                    <td className="font-semibold text-slate-900">{app.applicationNumber || app.id}</td>
                    <td>{app.citizenName || app.citizenEmail}</td>
                    <td>{app.service}</td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="text-slate-500">{app.submittedDate}</td>
                    <td className="text-right">
                      <button 
                        onClick={() => setSelectedApp(app)}
                        className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold transition"
                      >
                        View
                      </button>
                    </td>
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
            <p className="text-sm font-medium text-slate-700 mb-1">No Applications</p>
            <p className="text-xs text-slate-400">{searchQuery ? 'No applications match your search' : 'Applications submitted to your institution will appear here'}</p>
          </div>
        )}
      </div>
      <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-sm text-blue-900">
        <strong>Applications:</strong> All applications submitted for your institution's services are displayed here.
      </div>
    </>
  );
}

// ─── SECTION: Maintenance ─────────────────────────────────────────
function SectionMaintenance({ userInstitution }) {
  const { createNotification } = useNotifications();
  const { reports: allReports, assignReport } = useMaintenance();
  const { user } = useAuth();
  
  // Backend already filters reports by institution_id for INSTITUTION_MANAGER role
  // So we can use all reports directly from the context
  const reports = useMemo(() => {
    console.log('=== INSTITUTION MANAGER MAINTENANCE DEBUG ===');
    console.log('User institution ID:', user?.institution_id);
    console.log('User institution name:', userInstitution);
    console.log('All reports count:', (allReports || []).length);
    console.log('Sample report:', allReports?.[0]);
    console.log('=============================================');
    
    // Backend already filtered by institution, just sort by date
    return (allReports || []).sort((a, b) => 
      new Date(b.reportedAtTimestamp) - new Date(a.reportedAtTimestamp)
    );
  }, [allReports, user, userInstitution]);

  const tasks = useMemo(() => {
    return reports.filter(r => r.assignedTo);
  }, [reports]);
  const [selected, setSelected] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // 'task' | 'report'
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ technician: '' });
  const [assignError, setAssignError] = useState('');


  // Load authorized ICT staff from the backend.
  // GET /api/users automatically scopes Institution Managers to their institution.
  const [technicianList, setTechnicianList] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadTechnicians() {
      try {
        const response = await api.get("/users?role=ICT_STAFF&status=ACTIVE");

        if (!cancelled && response.success) {
          const users = Array.isArray(response.data) ? response.data : [];
          setTechnicianList(
            users
              .filter(user => String(user.role).toUpperCase() === "ICT_STAFF")
              .map(user => ({
                ...user,
                name: user.full_name || user.name || "Unnamed Technician",
                institutionId: user.institution_id || user.institutionId || null
              }))
          );
        }
      } catch (error) {
        console.error("Failed to load ICT technicians:", error);
        if (!cancelled) setTechnicianList([]);
      }
    }

    loadTechnicians();

    return () => {
      cancelled = true;
    };
  }, [userInstitution]);

  async function handleAssignTechnician(e) {
    e.preventDefault();

    if (!assignForm.technician) {
      setAssignError('Please select a technician.');
      return;
    }

    const report = reports.find(r => r.id === selected);
    if (!report) {
      setAssignError('Maintenance report not found.');
      return;
    }

    try {
      const result = await assignReport(report.id, assignForm.technician);

      if (result.success) {
        const technician = technicianList.find(
          technician => technician.id === assignForm.technician
        );

        if (technician) {
          const notificationData = createTaskAssignmentNotification(
            {
              id: report.reportNumber,
              title: report.problemType,
              description: report.description,
              assignedTo: technician.id,
              reportId: report.id
            },
            technician.email
          );

          createNotification(notificationData);
        }

        setShowAssignModal(false);
        setAssignForm({ technician: '' });
        setAssignError('');

        alert(
          `Maintenance report ${report.reportNumber} assigned to ${
            technician?.name || 'technician'
          } successfully!\n\nThe technician has been notified.`
        );
      } else {
        setAssignError(result.message || 'Failed to assign technician.');
      }
    } catch (error) {
      console.error('Failed to assign technician:', error);
      setAssignError(error.message || 'Failed to assign technician.');
    }
  }

  // Assignment modal
  if (showAssignModal && selected) {
    const report = reports.find(r => r.id === selected);
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-5">Assign Technician</h3>
            
            <div className="mb-5 p-4 bg-gray-50 rounded-xl text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Report ID:</span>
                <span className="font-medium">{report.reportNumber}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Problem Type:</span>
                <span className="font-medium">{report.problemType}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Location:</span>
                <span className="font-medium">{report.location}, Office {report.officeNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reported By:</span>
                <span className="font-medium">{report.reportedBy}</span>
              </div>
            </div>

            <form onSubmit={handleAssignTechnician} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Select Technician <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignForm.technician}
                  onChange={e => setAssignForm({ technician: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
                >
                  <option value="">Select technician...</option>
                  {technicianList.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>

              {assignError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  {assignError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white text-sm font-semibold rounded-xl shadow-xs transition"
                >
                  Assign Task
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAssignModal(false); setAssignError(''); setAssignForm({ technician: '' }); }}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }

  // View task detail
  if (selected && selectedType === 'task') {
    const task = tasks.find(t => t.id === selected);
    if (!task) {
      setSelected(null);
      return null;
    }
    return (
      <>
        <div className="mb-6">
          <button onClick={() => { setSelected(null); setSelectedType(null); }} className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Back to Maintenance
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
            <div>
              <p className="text-xs text-slate-400 mb-1">{task.id}</p>
              <h2 className="text-lg font-bold text-slate-900 mb-2">{task.title}</h2>
              <div className="flex gap-2"><PriorityBadge priority={task.priority} /><StatusBadge status={task.status} /></div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
            <div className="flex justify-between"><span className="text-slate-500">Assigned To</span><span className="font-medium text-slate-800">{task.assignedTo}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Assigned Date</span><span className="font-medium text-slate-800">{task.assignedDate}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Related Report</span><span className="font-medium text-slate-800">{task.reportId || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Status</span><StatusBadge status={task.status} /></div>
          </div>
          {task.description && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Task Description</p>
              <p className="text-sm text-slate-700">{task.description}</p>
            </div>
          )}
          {task.report && (
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-3">Technician Report</p>
              <p className="text-sm text-slate-700">{task.report}</p>
            </div>
          )}
        </div>
      </>
    );
  }

  // View employee report detail with comprehensive fields
  if (selected && selectedType === 'report') {
    const report = reports.find(r => r.id === selected);
    if (!report) {
      setSelected(null);
      return null;
    }
    return (
      <>
        <div className="mb-6">
          <button onClick={() => { setSelected(null); setSelectedType(null); }} className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Back to Maintenance
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6 max-w-4xl">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
            <div>
              <p className="text-xs text-slate-400 mb-1">{report.reportNumber}</p>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Maintenance Report Details</h2>
              <div className="flex gap-2"><StatusBadge status={report.status} /></div>
            </div>
            {report.status === 'Submitted' && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white text-sm font-semibold rounded-xl shadow-xs transition"
              >
                Assign Technician
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Reporter Information</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Employee Name:</span>
                    <span className="font-medium text-slate-900">{report.reportedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Employee ID:</span>
                    <span className="font-medium text-slate-900">{report.reportedById}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Institution:</span>
                    <span className="font-medium text-slate-900">{report.institution}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Problem Information</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Problem Type:</span>
                    <span className="font-medium text-slate-900">{report.problemType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-medium text-slate-900">{report.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Office Number:</span>
                    <span className="font-medium text-slate-900">{report.officeNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Status Information</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Submitted:</span>
                    <span className="font-medium text-slate-900">{report.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <StatusBadge status={report.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned To:</span>
                    <span className="font-medium text-slate-900">{report.assignedTo || <span className="text-slate-400">Not assigned yet</span>}</span>
                  </div>
                  {report.taskId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Task ID:</span>
                      <span className="font-medium text-slate-900">{report.taskId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Problem Description</p>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">{report.description}</p>
          </div>

          {report.photoPreview && (
            <div>
              <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Problem Photo</p>
              <img
                src={report.photoPreview}
                alt="Problem photo"
                className="max-w-lg w-full rounded-xl border border-slate-200 shadow-xs"
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a] max-w-4xl">
          <strong>Manager Actions:</strong> Review the complete employee report including the problem photo, then click "Assign Technician" to create a task and assign it to a technician.
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Maintenance</h2>
        <p className="text-sm text-slate-500 font-normal">Monitor employee-reported problems and assigned maintenance tasks for {userInstitution || 'your institution'}.</p>
      </div>

      {/* Employee Reports */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Employee Problem Reports</h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">{reports.filter(r => r.status === 'Submitted').length} pending</span>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Problem Type</th>
                <th>Location</th>
                <th>Office</th>
                <th>Reported Time</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-slate-400 py-6">No maintenance reports.</td></tr>
              ) : reports.map(r => (
                <tr key={r.id}>
                  <td className="font-semibold text-slate-800">{r.reportNumber}</td>
                  <td>{r.reportedBy}</td>
                  <td>{r.reportedById}</td>
                  <td>{r.problemType}</td>
                  <td>{r.location}</td>
                  <td>{r.officeNumber}</td>
                  <td className="whitespace-nowrap">{r.reportedAt}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.assignedTo || <span className="text-slate-400">—</span>}</td>
                  <td><button onClick={() => { setSelected(r.id); setSelectedType('report'); }} className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold transition">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance Tasks */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Maintenance Tasks</h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-[#1e3a8a] border border-blue-200 rounded-full">{tasks.filter(t => t.status !== 'Completed').length} open</span>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr><th>Task ID</th><th>Task</th><th>Priority</th><th>Assigned To</th><th>Reported Time</th><th>Status</th><th>Report</th><th>Action</th></tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-slate-400 py-6">No maintenance tasks.</td></tr>
              ) : tasks.map(t => (
                <tr key={t.id}>
                  <td className="font-semibold text-slate-800">{t.id}</td>
                  <td>{t.title}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td>{t.assignedTo}</td>
                  <td>{t.assignedDate}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{t.report ? <span className="text-emerald-700 text-sm font-semibold">Submitted</span> : <span className="text-slate-400 text-sm">—</span>}</td>
                  <td><button onClick={() => { setSelected(t.id); setSelectedType('task'); }} className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold transition">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a]">
        <strong>Maintenance:</strong> Review employee problem reports with all details including photos. Click "View" then "Assign Technician" to create a task. Monitor task progress and technician reports.
      </div>
    </>
  );
}

// ─── SECTION: Task Assignment ─────────────────────────────────────
function SectionTaskAssignment({ userInstitution }) {
  const { reports: allReports, assignReport } = useMaintenance();

  const institutionReports = (allReports || [])
    .filter(r => r.institutionId && String(r.institutionId) === String(userInstitution))
    .sort((a, b) => new Date(a.reportedAtTimestamp) - new Date(b.reportedAtTimestamp));

  const assignedTasks = institutionReports.filter(r => r.assignedTo);
  const availableReports = institutionReports.filter(
    r => !r.assignedTo && r.status === 'Submitted'
  );

  const [view, setView] = useState('list');
  const [form, setForm] = useState({
    title: '',
    assignedTo: '',
    priority: 'Normal',
    description: '',
    reportId: ''
  });
  const [formError, setFormError] = useState('');

  // Load authorized ICT Staff directly from the backend.
  const [technicianList, setTechnicianList] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadTechnicians() {
      try {
        const response = await api.get('/users?role=ICT_STAFF&status=ACTIVE');

        if (!cancelled && response.success) {
          const users = Array.isArray(response.data) ? response.data : [];

          setTechnicianList(
            users
              .filter(user => String(user.role).toUpperCase() === 'ICT_STAFF')
              .map(user => ({
                ...user,
                name: user.full_name || user.name || 'Unnamed Technician',
                institutionId:
                  user.institution_id || user.institutionId || null
              }))
              .filter(user => user.institutionId && String(user.institutionId) === String(userInstitution))
          );
        }
      } catch (error) {
        console.error('Failed to load ICT technicians:', error);

        if (!cancelled) {
          setTechnicianList([]);
        }
      }
    }

    loadTechnicians();

    return () => {
      cancelled = true;
    };
  }, [userInstitution]);

  function handleReportChange(reportId) {
    const report = availableReports.find(r => r.id === reportId);

    setForm(prev => ({
      ...prev,
      reportId,
      title: report?.problemType || '',
      description: report?.description || '',
      priority: report?.priority || 'Normal'
    }));

    setFormError('');
  }

  async function submitTask(e) {
    e.preventDefault();

    if (!form.reportId) {
      setFormError('Please select a maintenance report.');
      return;
    }

    if (!form.assignedTo) {
      setFormError('Please select a technician.');
      return;
    }

    const report = institutionReports.find(r => r.id === form.reportId);

    if (!report) {
      setFormError('Maintenance report not found.');
      return;
    }

    const technician = technicianList.find(
      t => t.id === form.assignedTo
    );

    if (!technician) {
      setFormError('Selected technician was not found.');
      return;
    }

    try {
      setFormError('');

      // The backend creates the maintenance_tasks record,
      // sends the notification, and writes the audit log.
      const result = await assignReport(
        report.id,
        technician.id
      );

      if (!result.success) {
        setFormError(
          result.message || 'Failed to assign maintenance task.'
        );
        return;
      }

      setForm({
        title: '',
        assignedTo: '',
        priority: 'Normal',
        description: '',
        reportId: ''
      });

      setFormError('');
      setView('list');

      alert(
        'Maintenance report ' +
        (report.reportNumber || report.id) +
        ' assigned to ' +
        technician.name +
        ' successfully!\\n\\nThe technician has been notified.'
      );
    } catch (error) {
      console.error('Failed to assign maintenance task:', error);
      setFormError(
        error.message || 'Failed to assign maintenance task.'
      );
    }
  }

  if (view === 'new') {
    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => {
              setView('list');
              setFormError('');
            }}
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1 transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Cancel
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 max-w-2xl">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Assign New Technical Task
          </h2>

          <form onSubmit={submitTask} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Related Problem Report <span className="text-red-500">*</span>
              </label>

              <select
                value={form.reportId}
                onChange={e => handleReportChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
              >
                <option value="">Select maintenance report...</option>

                {availableReports.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.reportNumber || r.id} - {r.problemType || 'Maintenance Report'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Task Title
              </label>

              <input
                type="text"
                value={form.title}
                readOnly
                placeholder="Select a maintenance report first"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 outline-none text-sm text-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Assign To <span className="text-red-500">*</span>
                </label>

                <select
                  value={form.assignedTo}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      assignedTo: e.target.value
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
                >
                  <option value="">Select Technician...</option>

                  {technicianList.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Priority
                </label>

                <input
                  type="text"
                  value={form.priority}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 outline-none text-sm text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description
              </label>

              <textarea
                rows={3}
                value={form.description}
                readOnly
                placeholder="Select a maintenance report first"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 outline-none text-sm resize-y text-slate-700"
              />
            </div>

            {formError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                {formError}
              </div>
            )}

            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white font-semibold rounded-xl shadow-xs transition text-sm"
            >
              Assign Task
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
            Task Assignment
          </h2>

          <p className="text-sm text-slate-500 font-normal">
            Assign and monitor technical tasks for Technicians in{' '}
            {userInstitution || 'your institution'}.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setForm({
              title: '',
              assignedTo: '',
              priority: 'Normal',
              description: '',
              reportId: ''
            });
            setView('new');
          }}
          className="px-4 py-2 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white text-sm font-semibold rounded-xl shadow-xs transition"
        >
          + Assign Task
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Task</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th>Reported Time</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {assignedTasks.length > 0 ? (
                assignedTasks.map(t => (
                  <tr key={t.id}>
                    <td className="font-semibold text-slate-800">
                      {t.reportNumber || t.id}
                    </td>

                    <td>
                      {t.problemType || 'Maintenance Task'}
                    </td>

                    <td>
                      <PriorityBadge
                        priority={t.priority || 'Normal'}
                      />
                    </td>

                    <td>
                      {t.assignedTo || 'Not assigned'}
                    </td>

                    <td>
                      {t.reportedAt || t.date || 'N/A'}
                    </td>

                    <td>
                      <StatusBadge
                        status={t.status || 'Assigned'}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center text-slate-400 py-8"
                  >
                    No maintenance tasks assigned yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a]">
        <strong>Task Assignment:</strong> Select an existing maintenance
        report and assign it to an ICT Technician in your institution.
        The backend automatically creates the maintenance task and
        notifies the assigned technician.
      </div>
    </>
  );
}

// ─── SECTION: Reports ─────────────────────────────────────────────
function SectionReports({ userInstitution }) {
  const { myTickets } = useQueue();
  const { reports: maintenanceReports } = useMaintenance();
  const { applications } = useApplications();
  const { user } = useAuth();
  
  // Get institution ID for filtering
  const institutionId = user?.institution_id;
  
  // Filter queue items by institution
  const queueItems = useMemo(() => {
    if (!institutionId) return [];
    return myTickets.filter(ticket => ticket.institutionId === institutionId);
  }, [myTickets, institutionId]);
  
  // Calculate queue statistics
  const queueActive = queueItems.filter(item => 
    item.status === 'waiting' || item.status === 'called'
  ).length;
  
  const today = new Date().toDateString();
  const qCompleted = queueItems.filter(item => {
    if (item.status !== 'completed') return false;
    const completedDate = new Date(item.completedAt || item.createdAt).toDateString();
    return completedDate === today;
  }).length;
  
  // Calculate maintenance statistics - reports are already filtered by backend for institution manager
  const maintDone = (maintenanceReports || []).filter(
    t => t.status === 'Completed' || t.status === 'COMPLETED' || t.status === 'Resolved'
  ).length;
  
  // Calculate application statistics from real data
  const institutionApplications = useMemo(() => {
    if (!institutionId) return [];
    return applications.filter(app => {
      const appInstitutionId = app.institution_id || app.institutionId;
      return appInstitutionId === institutionId;
    });
  }, [applications, institutionId]);
  
  const completed = institutionApplications.filter(app => 
    app.status?.toUpperCase() === 'COMPLETED'
  ).length;
  
  const pending = institutionApplications.filter(app => 
    app.status?.toUpperCase() === 'SUBMITTED' || app.status?.toUpperCase() === 'PENDING_DOCUMENTS'
  ).length;
  
  const inProg = institutionApplications.filter(app => 
    app.status?.toUpperCase() === 'UNDER_REVIEW' || app.status?.toUpperCase() === 'IN_PROGRESS'
  ).length;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Reports</h2>
        <p className="text-sm text-slate-500 font-normal">Operational summary for {userInstitution || 'your institution'}.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Queue Completed Today</p>
          <p className="text-3xl font-extrabold text-emerald-600">{qCompleted}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Queue</p>
          <p className="text-3xl font-extrabold text-[#1e3a8a]">{queueActive}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Maintenance Completed</p>
          <p className="text-3xl font-extrabold text-emerald-600">{maintDone}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6">
        <h3 className="font-bold text-slate-900 mb-4">Application Status Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">Completed</span>
            <span className="text-2xl font-bold text-slate-900">{completed}</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50/70 border border-amber-200/70">
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">Pending</span>
            <span className="text-2xl font-bold text-slate-900">{pending}</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50/70 border border-blue-200/70">
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-[#1e3a8a] rounded-full">In Progress</span>
            <span className="text-2xl font-bold text-slate-900">{inProg}</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-900">Maintenance Task Summary</h3></div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead><tr><th>Report Number</th><th>Problem Type</th><th>Priority</th><th>Assigned To</th><th>Status</th><th>Submitted</th></tr></thead>
            <tbody>
              {!maintenanceReports || maintenanceReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-8">
                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="font-medium text-slate-500">No maintenance reports yet</p>
                    <p className="text-sm text-slate-400 mt-1">Maintenance reports will appear here once submitted</p>
                  </td>
                </tr>
              ) : (
                maintenanceReports.slice(0, 10).map(report => (
                  <tr key={report.id}>
                    <td className="font-semibold text-slate-800">{report.reportNumber}</td>
                    <td>{report.problemType}</td>
                    <td>
                      <PriorityBadge priority={report.priority} />
                    </td>
                    <td>{report.assignedTo || <span className="text-slate-400">Unassigned</span>}</td>
                    <td>
                      <StatusBadge status={report.status} />
                    </td>
                    <td>{report.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a]">
        <strong>Reports:</strong> View operational summaries for your institution including queue performance, application status, and maintenance tasks. Data is automatically filtered to show only your institution's information.
      </div>
    </>
  );
}

// ─── SECTION: Staff Management (VIEW-ONLY) ────────────────────────
// Institution Managers can view staff in their institution
// User creation restricted to Super Admin only
function SectionStaffManagement({ userInstitution }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch staff from backend (scoped to institution by backend)
  useEffect(() => {
    let cancelled = false;

    async function loadStaff() {
      try {
        setLoading(true);
        const response = await api.get('/users');

        if (!cancelled && response.success) {
          const users = Array.isArray(response.data) ? response.data : [];
          
          // Filter to only show EMPLOYEE and ICT_STAFF roles
          const institutionStaff = users.filter(u => 
            ['EMPLOYEE', 'ICT_STAFF'].includes(String(u.role).toUpperCase())
          );
          
          setStaff(institutionStaff);
        }
      } catch (error) {
        console.error('Failed to load staff:', error);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    }

    loadStaff();

    return () => {
      cancelled = true;
    };
  }, [userInstitution]);

  // Filter staff
  const filtered = staff.filter(s => {
    const q = query.toLowerCase();
    const matchQ = !q || 
      (s.full_name && s.full_name.toLowerCase().includes(q)) || 
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.employee_id && s.employee_id.toLowerCase().includes(q));
    
    const matchR = !filterRole || String(s.role).toUpperCase() === filterRole.toUpperCase();
    const matchS = !filterStatus || String(s.status).toUpperCase() === filterStatus.toUpperCase();
    
    return matchQ && matchR && matchS;
  });

  // Helper to display role
  function displayRole(role) {
    const roleMap = {
      'EMPLOYEE': 'Employee',
      'ICT_STAFF': 'ICT Staff'
    };
    return roleMap[String(role).toUpperCase()] || role;
  }

  // Helper to display status
  function displayStatus(status) {
    const upperStatus = String(status).toUpperCase();
    if (upperStatus === 'ACTIVE') return 'Active';
    if (upperStatus === 'INACTIVE') return 'Inactive';
    if (upperStatus === 'SUSPENDED') return 'Suspended';
    return status;
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Staff Management</h2>
        <p className="text-sm text-slate-500 font-normal">View employees and ICT staff in {userInstitution || 'your institution'}.</p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a]">
        <strong>View-Only Access:</strong> You can view staff in your institution. To create, edit, or manage users, please contact your Super Administrator.
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Search</label>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Name, email, or ID..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            >
              <option value="">All Roles</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="ICT_STAFF">ICT Staff</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setQuery(''); setFilterRole(''); setFilterStatus(''); }}
              className="w-full px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Institution Staff</h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-[#1e3a8a] border border-blue-200 rounded-full">{filtered.length} staff members</span>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading staff...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {staff.length === 0 ? 'No staff members found.' : 'No staff match your filters.'}
          </div>
        ) : (
          <div className="table-container border-0 rounded-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Employee/Staff ID</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td className="font-semibold text-slate-800">{s.full_name || 'N/A'}</td>
                    <td>{s.email || 'N/A'}</td>
                    <td>{s.phone || '—'}</td>
                    <td><span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">{displayRole(s.role)}</span></td>
                    <td>{s.employee_id || '—'}</td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        String(s.status).toUpperCase() === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {displayStatus(s.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      }) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a]">
        <strong>Institution Scoped:</strong> You can only view staff (Employees and ICT Staff) belonging to {userInstitution || 'your institution'}. This list is automatically filtered by the backend.
      </div>
    </>
  );
}

function SectionAnnouncements({ userInstitution }) {
  const { user: authUser } = useAuth();
  const { announcements, createAnnouncement: createAnnouncementAPI, updateAnnouncement, deleteAnnouncement, loading, error } = useAnnouncements();
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'new' | 'edit'
  const [form, setForm] = useState({ title: '', body: '', scope: 'INSTITUTION' });
  const [formError, setFormError] = useState('');

  async function submitAnnouncement(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setFormError('Title and content are required.');
      return;
    }

    setFormError('');

    const announcementData = {
      title: form.title.trim(),
      content: form.body.trim(),
      scope: form.scope
    };

    // Add institution ID for INSTITUTION scope
    if (form.scope === 'INSTITUTION' && authUser?.institution_id) {
      announcementData.institutionId = authUser.institution_id;
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
      setForm({ title: '', body: '', scope: 'INSTITUTION' });
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
      scope: ann.scope
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
    if (!authUser) return false;
    
    // Normalize role to uppercase for comparison (backend returns lowercase)
    const userRole = authUser.role?.toUpperCase();
    
    // Institution Manager can modify any announcement visible to them:
    // - INTERNAL scope (all managers can see/edit internal announcements)
    // - INSTITUTION scope for their own institution
    // - Their own announcements (any scope)
    if (userRole === 'INSTITUTION_MANAGER') {
      const isOwner = ann.creator?.id === authUser?.id || ann.published_by === authUser?.id;
      const isInternalScope = ann.scope === 'INTERNAL';
      const isInstitutionScoped = ann.scope === 'INSTITUTION';
      const isOwnInstitution = ann.institutions?.id === authUser?.institution_id || ann.institution_id === authUser?.institution_id;
      
      // Can modify if:
      // 1. They created it, OR
      // 2. It's INTERNAL (all staff can edit internal), OR
      // 3. It's INSTITUTION-scoped for their institution
      return isOwner || isInternalScope || (isInstitutionScoped && isOwnInstitution);
    }
    
    return false;
  }

  // New/Edit announcement form
  if (view === 'new' || view === 'edit') {
    return (
      <>
        <div className="mb-6">
          <button onClick={() => { setView('list'); setSelected(null); setFormError(''); }} className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Cancel
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 max-w-2xl">
          <h2 className="text-xl font-bold text-slate-900 mb-6">{view === 'edit' ? 'Edit Announcement' : 'New Announcement'}</h2>
          <form onSubmit={submitAnnouncement} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Brief announcement title"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Content <span className="text-red-500">*</span></label>
              <textarea rows={5} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Announcement content"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm resize-y bg-white" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Audience <span className="text-red-500">*</span></label>
              <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white">
                <option value="PUBLIC">Public - Visible to everyone including citizens</option>
                <option value="INTERNAL">Internal - Staff only (employees, managers, admins)</option>
                <option value="INSTITUTION">Institution - Staff and employees in {userInstitution || 'your institution'}</option>
              </select>
            </div>
            
            <div className="p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a]">
              <strong>Scope: {form.scope}</strong>
              {form.scope === 'PUBLIC' && <p className="mt-1">This announcement will be visible to all users including citizens.</p>}
              {form.scope === 'INTERNAL' && <p className="mt-1">This announcement will be visible only to staff (not citizens).</p>}
              {form.scope === 'INSTITUTION' && <p className="mt-1">This announcement will be visible to staff and employees in {userInstitution || 'your institution'}.</p>}
            </div>
            
            {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{formError}</div>}
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</div>}
            <button type="submit" disabled={loading} className="px-6 py-3 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white font-semibold rounded-xl shadow-xs transition text-sm disabled:opacity-50">
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
          <button onClick={() => setSelected(null)} className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Back to Announcements
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-slate-900">{ann.title}</h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              {ann.is_active && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Active</span>}
              {canEdit && (
                <>
                  <button 
                    onClick={() => handleEdit(ann)}
                    className="px-3 py-1.5 text-sm text-[#314ea1] hover:bg-[#314ea1]/10 font-semibold rounded-lg transition"
                    title="Edit announcement"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(ann.id, ann.title)}
                    className="px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 font-semibold rounded-lg transition"
                    title="Delete announcement"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-4">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ann.content}</div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              <strong>Scope:</strong> {ann.scope}
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Announcements</h2>
          <p className="text-sm text-slate-500 font-normal">Operational announcements for your institution.</p>
        </div>
        <button onClick={() => { setView('new'); setSelected(null); setFormError(''); }} className="px-4 py-2 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white text-sm font-semibold rounded-xl shadow-xs transition">
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
            className={`bg-white rounded-2xl border shadow-xs p-5 cursor-pointer hover:border-[#314ea1]/40 hover:shadow-md transition-all duration-200 ${ann.is_active ? 'border-slate-200/90' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {ann.is_active && <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />}
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{ann.title}</h3>
                  {ann.scope === 'PUBLIC' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Public</span>}
                  {ann.scope === 'INTERNAL' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1e3a8a] border border-blue-200">Internal</span>}
                  {ann.scope === 'SYSTEM' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">System</span>}
                  {ann.scope === 'ROLE' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200">Role</span>}
                  {ann.scope === 'INSTITUTION' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">Institution</span>}
                </div>
                <p className="text-xs text-slate-500">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
              </div>
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── SECTION: My Profile ──────────────────────────────────────────
function SectionMyProfile({ user, userInstitution }) {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">My Profile</h2>
        <p className="text-sm text-slate-500 font-normal">Your account information.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] flex items-center justify-center text-xl font-bold shadow-xs flex-shrink-0">
            {user?.name?.charAt(0) || 'I'}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-base">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1e3a8a] border border-blue-200 mt-1">Institution Manager</span>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Full Name</span><span className="font-semibold text-slate-900">{user?.name}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-semibold text-slate-900">{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Role</span><span className="font-semibold text-slate-900">Institution Manager</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Institution</span><span className="font-semibold text-slate-900">{userInstitution || 'Not Assigned'}</span></div>
        </div>
      </div>
      <div className="p-4 bg-[#314ea1]/5 border border-[#314ea1]/20 rounded-xl text-xs font-medium text-[#1e3a8a]">
        <strong>Note:</strong> To update your profile or change your password, contact MESOB administration.
      </div>
    </>
  );
}

// ─── Main InstitutionManagerDashboard ─────────────────────────────
export default function InstitutionManagerDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get institution from logged-in user
  const userInstitution = user?.institution || null;

  function navigate(section) {
    setActiveSection(section);
    setSidebarOpen(false);
  }

  function renderSection() {
    switch (activeSection) {
      case 'Dashboard':        return <SectionDashboard setActiveSection={navigate} userInstitution={userInstitution} />;
      case 'Queue Management': return <SectionQueueManagement userInstitution={userInstitution} />;
      case 'Applications':     return <SectionApplications userInstitution={userInstitution} />;
      case 'Maintenance':      return <SectionMaintenance userInstitution={userInstitution} />;
      case 'Task Assignment':  return <SectionTaskAssignment userInstitution={userInstitution} />;
      case 'Service Feedback': return <InstitutionFeedback />;
      case 'Staff Management': return <SectionStaffManagement userInstitution={userInstitution} />;
      case 'Reports':          return <SectionReports userInstitution={userInstitution} />;
      case 'Announcements':    return <SectionAnnouncements user={user} userInstitution={userInstitution} />;
      case 'My Profile':       return <SectionMyProfile user={user} userInstitution={userInstitution} />;
      default:                 return <SectionDashboard setActiveSection={navigate} userInstitution={userInstitution} />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#edf4fc] text-slate-900">
      <div className="flex min-h-screen">

        {/* ── Sidebar ── */}
        <aside className={`db-sidebar fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-xs border-r border-slate-200/80 flex flex-col transition-transform duration-200 shadow-xs${sidebarOpen ? ' open' : ''}`}>
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] flex items-center justify-center font-bold text-lg shadow-xs">I</div>
              <div>
                <p className="font-bold text-slate-900 text-sm">MESOB Center</p>
                <p className="text-xs text-slate-500">Institution Manager</p>
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

          <div className="p-4 border-t border-slate-100">
            <button onClick={logout}
              className="sidebar-link w-full text-left text-rose-600 hover:bg-rose-50 font-medium">
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              </button>
              <h1 className="text-lg font-bold text-slate-900">
                {activeSection === 'Dashboard' ? 'Institution Manager Dashboard' : activeSection}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#314ea1]/10 text-[#1e3a8a] border border-[#314ea1]/20">Institution Manager</span>
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
