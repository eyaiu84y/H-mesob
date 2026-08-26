import { useState } from 'react';
import { useAuth, ROLE_LABELS, ROLE_BADGE } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getMaintenanceReports, getMaintenanceTasks, createMaintenanceTask, getAnnouncements, createAnnouncement, createTaskAssignmentNotification, createAnnouncementNotification } from '../../utils/sharedData';

// ─── Navigation sections ──────────────────────────────────────────
const SECTIONS = [
  'Dashboard',
  'Queue Management',
  'Applications',
  'Maintenance',
  'Task Assignment',
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
  const cls = { High: 'badge bg-red-100 text-red-800', Medium: 'badge bg-amber-100 text-amber-800', Normal: 'badge bg-gray-100 text-gray-700' }[priority] || 'badge bg-gray-100 text-gray-700';
  return <span className={cls}>{priority}</span>;
}

function StatusBadge({ status }) {
  const cls = {
    Pending: 'badge bg-amber-100 text-amber-800',
    Waiting: 'badge bg-amber-100 text-amber-800',
    Assigned: 'badge bg-amber-100 text-amber-800',
    'In Progress': 'badge bg-blue-100 text-blue-800',
    Processing: 'badge bg-blue-100 text-blue-800',
    Completed: 'badge bg-green-100 text-green-800',
    Submitted: 'badge bg-green-100 text-green-800',
    Active: 'badge bg-green-100 text-green-800',
  }[status] || 'badge bg-gray-100 text-gray-700';
  return <span className={cls}>{status}</span>;
}

// ─── SECTION: Dashboard Overview ─────────────────────────────────
function SectionDashboard({ setActiveSection, userInstitution }) {
  // TODO: Replace with real data from API
  const activeQueue = 0; // Will come from queue management system
  const activeApps = 0; // Will come from application tracking system
  const openMaint = getMaintenanceTasks({ institution: userInstitution }).filter(t => t.status !== 'Completed').length;
  const announcements = getAnnouncements({ institution: userInstitution });
  const unread = announcements.filter(a => !a.read).length;

  return (
    <>
      {/* Institution banner */}
      <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">I</div>
        <div>
          <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Assigned Institution</p>
          <p className="text-sm font-semibold text-orange-900">{userInstitution || 'Not Assigned'}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Queue Status</p>
          <p className="text-2xl font-bold">{activeQueue}</p>
          <p className="text-xs text-amber-600 mt-1">Active tickets</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Applications</p>
          <p className="text-2xl font-bold">{activeApps}</p>
          <p className="text-xs text-gray-500 mt-1">Pending / in progress</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Maintenance</p>
          <p className="text-2xl font-bold">{openMaint}</p>
          <p className="text-xs text-gray-500 mt-1">Open tasks</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Announcements</p>
          <p className="text-2xl font-bold">{unread}</p>
          <p className="text-xs text-gray-500 mt-1">Unread</p>
        </div>
      </div>

      {/* Queue overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Queue Overview</h2>
          <button onClick={() => setActiveSection('Queue Management')} className="text-sm text-blue-600 hover:underline font-medium">View all</button>
        </div>
        <div className="p-6 text-center text-gray-400">
          <p className="text-sm">Queue management system will be integrated with backend API.</p>
          <p className="text-xs mt-2">Active queue items will appear here.</p>
        </div>
      </div>

      {/* Applications overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Applications Overview</h2>
          <button onClick={() => setActiveSection('Applications')} className="text-sm text-blue-600 hover:underline font-medium">View all</button>
        </div>
        <div className="p-6 text-center text-gray-400">
          <p className="text-sm">Application tracking system will be integrated with backend API.</p>
          <p className="text-xs mt-2">Pending applications will appear here.</p>
        </div>
      </div>

      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800">
        <strong>Institution Manager:</strong> Monitor your institution's queue, applications, maintenance, and task assignments. You manage {userInstitution || 'your assigned institution'} only.
      </div>
    </>
  );
}

// ─── SECTION: Queue Management ────────────────────────────────────
function SectionQueueManagement({ userInstitution }) {
  // TODO: Replace with real queue data from API
  const queueItems = []; // Will come from queue management system

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Queue Management</h2>
        <p className="text-sm text-gray-500">Monitor the service queue for {userInstitution || 'your institution'}.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Waiting</p><p className="text-2xl font-bold">0</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Processing</p><p className="text-2xl font-bold">0</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Completed Today</p><p className="text-2xl font-bold text-green-600">0</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Queue — {userInstitution || 'Institution'}</h3>
          <span className="text-sm text-gray-500">{queueItems.length} active</span>
        </div>
        <div className="p-6 text-center text-gray-400 py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium mb-2">No Active Queue Items</p>
          <p className="text-xs">Queue items will appear here when citizens register for services at your institution.</p>
        </div>
      </div>
      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800">
        <strong>Queue Management:</strong> Monitor queue status for your institution. Queue items are processed by assigned Employees.
      </div>
    </>
  );
}

// ─── SECTION: Applications ────────────────────────────────────────
function SectionApplications({ userInstitution }) {
  // TODO: Replace with real application data from API
  const applications = []; // Will come from application tracking system

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Applications</h2>
        <p className="text-sm text-gray-500">Monitor applications for {userInstitution || 'your institution'}.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Institution Applications</h3>
          <span className="text-sm text-gray-500">{applications.length} result{applications.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="p-6 text-center text-gray-400 py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium mb-2">No Applications</p>
          <p className="text-xs">Applications submitted to your institution will appear here.</p>
        </div>
      </div>
      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800">
        <strong>Applications:</strong> Applications for your institution's services will be displayed here when the application tracking system is integrated.
      </div>
    </>
  );
}

// ─── SECTION: Maintenance ─────────────────────────────────────────
function SectionMaintenance({ userInstitution }) {
  const { getUsers } = useAuth();
  const { createNotification } = useNotifications();
  const [reports, setReports] = useState(() => getMaintenanceReports({ institution: userInstitution }));
  const [tasks] = useState(() => getMaintenanceTasks({ institution: userInstitution }));
  const [selected, setSelected] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // 'task' | 'report'
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ technician: '' });
  const [assignError, setAssignError] = useState('');

  // Get authorized technicians from same institution
  // Only users with role 'technician' from the same institution can be assigned
  const allUsers = getUsers ? getUsers() : [];
  const technicianList = allUsers.filter(user => 
    user.role === 'technician' && 
    user.institution === userInstitution
  );

  function handleAssignTechnician(e) {
    e.preventDefault();
    if (!assignForm.technician) {
      setAssignError('Please select a technician.');
      return;
    }

    const report = reports.find(r => r.id === selected);
    if (!report) return;

    // Create task from maintenance report with ALL report fields
    const result = createMaintenanceTask({
      title: `${report.problemType} - ${report.location} Office ${report.officeNumber}`,
      description: report.description,
      assignedTo: assignForm.technician,
      priority: 'Normal', // Can be derived from report if needed
      institution: report.institution,
      reportId: report.id,
      // Include all employee report fields in task
      employeeId: report.employeeId,
      employeeName: report.employeeName,
      problemType: report.problemType,
      location: report.location,
      officeNumber: report.officeNumber,
      photo: report.photo,
      photoPreview: report.photoPreview,
    });

    if (result.success) {
      // Find technician email to send notification
      const allUsers = getUsers ? getUsers() : [];
      const technician = allUsers.find(u => u.name === assignForm.technician);
      
      if (technician) {
        const notificationData = createTaskAssignmentNotification(result.task, technician.email);
        createNotification(notificationData);
      }

      // Update report to reflect assignment
      const updatedReports = reports.map(r =>
        r.id === report.id ? { ...r, status: 'Assigned', assignedTo: assignForm.technician, taskId: result.task.id } : r
      );
      setReports(updatedReports);
      setShowAssignModal(false);
      setAssignForm({ technician: '' });
      setAssignError('');
      alert(`Task ${result.task.id} assigned to ${assignForm.technician} successfully!\n\nThe technician has been notified.`);
    } else {
      setAssignError(result.message || 'Failed to assign technician.');
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
                <span className="font-medium">{report.id}</span>
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
                <span className="font-medium">{report.employeeName}</span>
              </div>
            </div>

            <form onSubmit={handleAssignTechnician} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Technician <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignForm.technician}
                  onChange={e => setAssignForm({ technician: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm bg-white"
                >
                  <option value="">Select technician...</option>
                  {technicianList.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.email})</option>
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
                  className="px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition"
                >
                  Assign Task
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAssignModal(false); setAssignError(''); setAssignForm({ technician: '' }); }}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition"
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
          <button onClick={() => { setSelected(null); setSelectedType(null); }} className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Back to Maintenance
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-1">{task.id}</p>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h2>
              <div className="flex gap-2"><PriorityBadge priority={task.priority} /><StatusBadge status={task.status} /></div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
            <div className="flex justify-between"><span className="text-gray-500">Assigned To</span><span className="font-medium">{task.assignedTo}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Assigned Date</span><span className="font-medium">{task.assignedDate}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Related Report</span><span className="font-medium">{task.reportId || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Status</span><StatusBadge status={task.status} /></div>
          </div>
          {task.description && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Task Description</p>
              <p className="text-sm text-gray-700">{task.description}</p>
            </div>
          )}
          {task.report && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-3">Technician Report</p>
              <p className="text-sm text-gray-700">{task.report}</p>
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
          <button onClick={() => { setSelected(null); setSelectedType(null); }} className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Back to Maintenance
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 max-w-4xl">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-1">{report.id}</p>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Maintenance Report Details</h2>
              <div className="flex gap-2"><StatusBadge status={report.status} /></div>
            </div>
            {report.status === 'Submitted' && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition"
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
                    <span className="text-gray-500">Employee Name:</span>
                    <span className="font-medium text-gray-900">{report.employeeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Employee ID:</span>
                    <span className="font-medium text-gray-900">{report.employeeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Institution:</span>
                    <span className="font-medium text-gray-900">{report.institution}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Problem Information</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Problem Type:</span>
                    <span className="font-medium text-gray-900">{report.problemType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium text-gray-900">{report.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Office Number:</span>
                    <span className="font-medium text-gray-900">{report.officeNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Status Information</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submitted:</span>
                    <span className="font-medium text-gray-900">{report.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <StatusBadge status={report.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assigned To:</span>
                    <span className="font-medium text-gray-900">{report.assignedTo || <span className="text-gray-400">Not assigned yet</span>}</span>
                  </div>
                  {report.taskId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Task ID:</span>
                      <span className="font-medium text-gray-900">{report.taskId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Problem Description</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4">{report.description}</p>
          </div>

          {report.photoPreview && (
            <div>
              <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Problem Photo</p>
              <img
                src={report.photoPreview}
                alt="Problem photo"
                className="max-w-lg w-full rounded-xl border border-gray-200 shadow-sm"
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800 max-w-4xl">
          <strong>Manager Actions:</strong> Review the complete employee report including the problem photo, then click "Assign Technician" to create a task and assign it to a technician.
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Maintenance</h2>
        <p className="text-sm text-gray-500">Monitor employee-reported problems and assigned maintenance tasks for {userInstitution || 'your institution'}.</p>
      </div>

      {/* Employee Reports */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Employee Problem Reports</h3>
          <span className="text-sm text-gray-500">{reports.filter(r => r.status === 'Submitted').length} pending</span>
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
                <th>Date</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-gray-400 py-6">No maintenance reports.</td></tr>
              ) : reports.map(r => (
                <tr key={r.id}>
                  <td className="font-medium">{r.id}</td>
                  <td>{r.employeeName}</td>
                  <td>{r.employeeId}</td>
                  <td>{r.problemType}</td>
                  <td>{r.location}</td>
                  <td>{r.officeNumber}</td>
                  <td>{r.date}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.assignedTo || <span className="text-gray-400">—</span>}</td>
                  <td><button onClick={() => { setSelected(r.id); setSelectedType('report'); }} className="text-blue-600 hover:underline text-sm font-medium">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance Tasks */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Maintenance Tasks</h3>
          <span className="text-sm text-gray-500">{tasks.filter(t => t.status !== 'Completed').length} open</span>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr><th>Task ID</th><th>Task</th><th>Priority</th><th>Assigned To</th><th>Date</th><th>Status</th><th>Report</th><th>Action</th></tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-gray-400 py-6">No maintenance tasks.</td></tr>
              ) : tasks.map(t => (
                <tr key={t.id}>
                  <td className="font-medium">{t.id}</td>
                  <td>{t.title}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td>{t.assignedTo}</td>
                  <td>{t.assignedDate}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{t.report ? <span className="text-green-600 text-sm font-medium">Submitted</span> : <span className="text-gray-400 text-sm">—</span>}</td>
                  <td><button onClick={() => { setSelected(t.id); setSelectedType('task'); }} className="text-blue-600 hover:underline text-sm font-medium">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800">
        <strong>Maintenance:</strong> Review employee problem reports with all details including photos. Click "View" then "Assign Technician" to create a task. Monitor task progress and technician reports.
      </div>
    </>
  );
}

// ─── SECTION: Task Assignment ─────────────────────────────────────
function SectionTaskAssignment({ userInstitution }) {
  const { getUsers } = useAuth();
  const { createNotification } = useNotifications();
  const [tasks, setTasks] = useState(() => getMaintenanceTasks({ institution: userInstitution }));
  const [reports] = useState(() => getMaintenanceReports({ institution: userInstitution }));
  const [view, setView] = useState('list'); // 'list' | 'new'
  const [form, setForm] = useState({ title: '', assignedTo: '', priority: 'Normal', description: '', reportId: '' });
  const [formError, setFormError] = useState('');

  // Only Technicians from the same institution can be assigned maintenance tasks
  const allUsers = getUsers ? getUsers() : [];
  const technicianList = allUsers.filter(user => 
    user.role === 'technician' && 
    user.institution === userInstitution
  );

  function submitTask(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.assignedTo) { setFormError('Title and Assigned To are required.'); return; }
    
    // CRITICAL FIX: Include description field in task creation
    const result = createMaintenanceTask({
      title: form.title.trim(),
      description: form.description.trim(), // ← MUST be preserved
      assignedTo: form.assignedTo,
      priority: form.priority,
      institution: userInstitution,
      reportId: form.reportId || null,
    });

    if (result.success) {
      // Find technician email to send notification
      const allUsers = getUsers ? getUsers() : [];
      const technician = allUsers.find(u => u.name === form.assignedTo);
      
      if (technician) {
        const notificationData = createTaskAssignmentNotification(result.task, technician.email);
        createNotification(notificationData);
      }

      setTasks(prev => [result.task, ...prev]);
      setForm({ title: '', assignedTo: '', priority: 'Normal', description: '', reportId: '' });
      setFormError('');
      setView('list');
      alert(`Task ${result.task.id} assigned successfully!\n\nThe technician has been notified.`);
    } else {
      setFormError(result.message || 'Failed to create task.');
    }
  }

  if (view === 'new') {
    return (
      <>
        <div className="mb-6">
          <button onClick={() => { setView('list'); setFormError(''); }} className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Cancel
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Assign New Technical Task</h2>
          <form onSubmit={submitTask} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Brief description of technical task"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign To <span className="text-red-500">*</span></label>
                <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition text-sm bg-white">
                  <option value="">Select Technician...</option>
                  {technicianList.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition text-sm bg-white">
                  <option>High</option><option>Medium</option><option>Normal</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
              <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detailed description of the technical task"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition text-sm resize-y" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Related Problem Report (Optional)</label>
              <select value={form.reportId} onChange={e => setForm(f => ({ ...f, reportId: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition text-sm bg-white">
                <option value="">No related report</option>
                {reports.filter(r => r.status === 'Submitted').map(r => (
                  <option key={r.id} value={r.id}>{r.id} - {r.title}</option>
                ))}
              </select>
            </div>
            {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{formError}</div>}
            <button type="submit" className="px-6 py-3 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold rounded-xl transition text-sm">
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
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Task Assignment</h2>
          <p className="text-sm text-gray-500">Assign and monitor technical tasks for Technicians in {userInstitution || 'your institution'}.</p>
        </div>
        <button onClick={() => setView('new')} className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition">
          + Assign Task
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr><th>Task ID</th><th>Task</th><th>Priority</th><th>Assigned To</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td className="font-medium">{t.id}</td>
                  <td>{t.title}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td>{t.assignedTo}</td>
                  <td>{t.assignedDate}</td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800">
        <strong>Task Assignment:</strong> Assign technical maintenance tasks to Technicians in your institution. Tasks assigned here will be visible in the Technician dashboard.
      </div>
    </>
  );
}

// ─── SECTION: Reports ─────────────────────────────────────────────
function SectionReports({ userInstitution }) {
  // TODO: Connect to backend API for real reports data
  const completed = 0;
  const pending = 0;
  const inProg = 0;
  const qCompleted = 0;
  const queueActive = 0;
  const maintDone = 0;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Reports</h2>
        <p className="text-sm text-gray-500">Operational summary for {userInstitution || 'your institution'}.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Queue Completed Today</p><p className="text-2xl font-bold text-green-600">{qCompleted}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Active Queue</p><p className="text-2xl font-bold">{queueActive}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Maintenance Completed</p><p className="text-2xl font-bold text-green-600">{maintDone}</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Application Status Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100"><span className="badge bg-green-100 text-green-800">Completed</span><span className="text-2xl font-bold text-gray-900">{completed}</span></div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100"><span className="badge bg-amber-100 text-amber-800">Pending</span><span className="text-2xl font-bold text-gray-900">{pending}</span></div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100"><span className="badge bg-blue-100 text-blue-800">In Progress</span><span className="text-2xl font-bold text-gray-900">{inProg}</span></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Maintenance Task Summary</h3></div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead><tr><th>Task ID</th><th>Task</th><th>Priority</th><th>Assigned To</th><th>Status</th><th>Report</th></tr></thead>
            <tbody>
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-medium text-gray-500">No report data available yet</p>
                  <p className="text-sm text-gray-400 mt-1">Reports will be generated when queue, applications, and maintenance data is available</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800">
        <strong>Reports:</strong> View operational summaries for your institution. Reports will be generated from queue, application, and maintenance data once the backend APIs are integrated.
      </div>
    </>
  );
}

// ─── SECTION: Staff Management ────────────────────────────────────
function SectionStaffManagement({ userInstitution }) {
  const { user: currentUser, getUsers, createUser, updateUser, toggleUserStatus } = useAuth();
  const [rawUsers, setRawUsers] = useState(() => {
    // Filter to show only Employee and Technician from this institution
    const allUsers = getUsers();
    return allUsers.filter(u => 
      ['employee', 'technician'].includes(u.role) && 
      u.institution === userInstitution
    ).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || null,
      role: u.role,
      institution: u.institution,
      employeeId: u.employeeId,
      status: u.status || 'Active',
    }));
  });
  
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editError, setEditError] = useState('');

  // Add Staff Form State
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    employeeId: '',
    status: 'Active',
  });

  const filtered = rawUsers.filter(u => {
    const q = query.toLowerCase();
    const matchQ = !q || 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(q));
    const matchR = !filterRole || u.role === filterRole;
    const matchS = !filterStatus || u.status === filterStatus;
    return matchQ && matchR && matchS;
  });

  function resetNewStaffForm() {
    setNewStaffForm({
      name: '',
      email: '',
      phone: '',
      role: '',
      employeeId: '',
      status: 'Active',
    });
    setEditError('');
  }

  function handleAddStaff(e) {
    e.preventDefault();
    setEditError('');

    // Validation
    if (!newStaffForm.name.trim()) {
      setEditError('Full name is required.');
      return;
    }

    if (!newStaffForm.email.trim()) {
      setEditError('Email is required.');
      return;
    }

    if (!newStaffForm.role) {
      setEditError('Role is required.');
      return;
    }

    if (!['employee', 'technician'].includes(newStaffForm.role)) {
      setEditError('Institution Managers can only create Employee and Technician accounts.');
      return;
    }

    if (!newStaffForm.employeeId.trim()) {
      setEditError(`${newStaffForm.role === 'technician' ? 'Staff ID' : 'Employee ID'} is required.`);
      return;
    }

    // Create user via AuthContext with institution auto-assigned
    const result = createUser(
      {
        name: newStaffForm.name,
        email: newStaffForm.email,
        phone: newStaffForm.phone,
        role: newStaffForm.role,
        institution: userInstitution, // Auto-assign institution
        employeeId: newStaffForm.employeeId,
        status: newStaffForm.status,
      },
      currentUser.role,
      currentUser.institution
    );

    if (!result.success) {
      setEditError(result.message);
      return;
    }

    // Show success with temp password
    alert(
      `Staff member created successfully!\n\n` +
      `Name: ${result.user.name}\n` +
      `Email: ${result.user.email}\n` +
      `Role: ${ROLE_LABELS[result.user.role]}\n` +
      `Institution: ${result.user.institution}\n` +
      `Temporary Password: ${result.tempPassword}\n\n` +
      `Please share this temporary password with the staff member securely.`
    );

    // Refresh staff list
    const allUsers = getUsers();
    setRawUsers(allUsers.filter(u => 
      ['employee', 'technician'].includes(u.role) && 
      u.institution === userInstitution
    ).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || null,
      role: u.role,
      institution: u.institution,
      employeeId: u.employeeId,
      status: u.status || 'Active',
    })));
    
    resetNewStaffForm();
    setShowAddStaff(false);
  }

  function handleEditStaff(e) {
    e.preventDefault();
    setEditError('');

    if (!editUser.name.trim()) {
      setEditError('Name is required.');
      return;
    }

    if (!editUser.employeeId?.trim()) {
      setEditError(`${editUser.role === 'technician' ? 'Staff ID' : 'Employee ID'} is required.`);
      return;
    }

    const result = updateUser(
      editUser.id,
      {
        name: editUser.name,
        phone: editUser.phone,
        role: editUser.role,
        institution: editUser.institution, // Preserve institution
        employeeId: editUser.employeeId,
        status: editUser.status,
      },
      currentUser.role,
      currentUser.institution
    );

    if (!result.success) {
      setEditError(result.message);
      return;
    }

    // Refresh staff list
    const allUsers = getUsers();
    setRawUsers(allUsers.filter(u => 
      ['employee', 'technician'].includes(u.role) && 
      u.institution === userInstitution
    ).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || null,
      role: u.role,
      institution: u.institution,
      employeeId: u.employeeId,
      status: u.status || 'Active',
    })));
    
    setEditUser(null);
    setEditError('');
  }

  function handleToggleStatus(userId) {
    const result = toggleUserStatus(userId, currentUser.role, currentUser.institution);
    if (result.success) {
      // Refresh staff list
      const allUsers = getUsers();
      setRawUsers(allUsers.filter(u => 
        ['employee', 'technician'].includes(u.role) && 
        u.institution === userInstitution
      ).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || null,
        role: u.role,
        institution: u.institution,
        employeeId: u.employeeId,
        status: u.status || 'Active',
      })));
    } else {
      alert(result.message);
    }
  }

  // Add Staff Modal
  const addStaffModal = showAddStaff && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Add New Staff Member</h3>
          <button onClick={() => { setShowAddStaff(false); resetNewStaffForm(); }} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleAddStaff} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newStaffForm.name}
              onChange={e => setNewStaffForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Abebe Kebede"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={newStaffForm.email}
              onChange={e => setNewStaffForm(f => ({ ...f, email: e.target.value }))}
              placeholder="staff@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input
              type="tel"
              value={newStaffForm.phone}
              onChange={e => setNewStaffForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+251 91 234 5678"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={newStaffForm.role}
              onChange={e => setNewStaffForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm bg-white"
            >
              <option value="">Select Role...</option>
              <option value="employee">Employee</option>
              <option value="technician">ICT Staff</option>
            </select>
          </div>

          {/* Institution (read-only, auto-assigned) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Institution</label>
            <input
              type="text"
              value={userInstitution}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Automatically assigned to your institution.</p>
          </div>

          {/* Employee/Staff ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {newStaffForm.role === 'technician' ? 'Staff ID' : 'Employee ID'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newStaffForm.employeeId}
              onChange={e => setNewStaffForm(f => ({ ...f, employeeId: e.target.value }))}
              placeholder={newStaffForm.role === 'technician' ? 'TECH-001' : 'EMP-001'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={newStaffForm.status}
              onChange={e => setNewStaffForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-xs text-orange-900">
              <strong>Note:</strong> A temporary password will be generated for this staff member. Please share it securely with them after creation.
            </p>
          </div>

          {editError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {editError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition">
              Create Staff Member
            </button>
            <button type="button" onClick={() => { setShowAddStaff(false); resetNewStaffForm(); }}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Edit Staff Modal
  const editStaffModal = editUser && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-8">
        <h3 className="font-semibold text-gray-900 mb-5">Edit Staff Member</h3>
        <form onSubmit={handleEditStaff} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editUser.name}
              onChange={e => setEditUser(u => ({ ...u, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={editUser.email}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input
              type="tel"
              value={editUser.phone || ''}
              onChange={e => setEditUser(u => ({ ...u, phone: e.target.value }))}
              placeholder="+251 91 234 5678"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={editUser.role}
              onChange={e => setEditUser(u => ({ ...u, role: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm bg-white"
            >
              <option value="employee">Employee</option>
              <option value="technician">ICT Staff</option>
            </select>
          </div>

          {/* Institution (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Institution</label>
            <input
              type="text"
              value={editUser.institution}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Institution cannot be changed.</p>
          </div>

          {/* Employee/Staff ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {editUser.role === 'technician' ? 'Staff ID' : 'Employee ID'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editUser.employeeId || ''}
              onChange={e => setEditUser(u => ({ ...u, employeeId: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={editUser.status}
              onChange={e => setEditUser(u => ({ ...u, status: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {editError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{editError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition">
              Save Changes
            </button>
            <button type="button" onClick={() => { setEditUser(null); setEditError(''); }}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  function RoleBadge({ role }) {
    const cls = ROLE_BADGE[role] || 'bg-gray-100 text-gray-700';
    return <span className={`badge ${cls}`}>{ROLE_LABELS[role] || role}</span>;
  }

  function StatusBadge({ status }) {
    const cls = status === 'Active' ? 'badge bg-green-100 text-green-800' : 'badge bg-gray-100 text-gray-600';
    return <span className={cls}>{status}</span>;
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Staff Management</h2>
          <p className="text-sm text-gray-500">Manage staff members for {userInstitution}.</p>
        </div>
        <button
          onClick={() => setShowAddStaff(true)}
          className="px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Staff
        </button>
      </div>

      {addStaffModal}
      {editStaffModal}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name, email, ID..."
            className="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm bg-white"
        >
          <option value="">All Roles</option>
          <option value="employee">Employee</option>
          <option value="technician">ICT Staff</option>
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition text-sm bg-white"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Staff Members - {userInstitution}</h3>
          <span className="text-sm text-gray-500">{filtered.length} staff member{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Employee ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-gray-400 py-8">
                    No staff members found matching your filters.
                  </td>
                </tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td className="font-medium">{u.name}</td>
                  <td>{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>{u.employeeId}</td>
                  <td><StatusBadge status={u.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditUser(u)}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className="text-orange-600 hover:underline text-sm font-medium"
                      >
                        {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800">
        <strong>Staff Management:</strong> Create and manage Employee and Technician accounts for {userInstitution}. Staff members are automatically assigned to your institution and cannot be transferred.
      </div>
    </>
  );
}

// ─── SECTION: Announcements ───────────────────────────────────────
function SectionAnnouncements({ user, userInstitution }) {
  const { getUsers } = useAuth();
  const { createNotification } = useNotifications();
  const [announcements, setAnnouncements] = useState(() => getAnnouncements({ institution: userInstitution }));
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
      author: user?.name || 'Institution Manager',
      scope: 'institution',
      institution: userInstitution,
    });

    if (result.success) {
      // Notify all staff in the same institution
      const allUsers = getUsers ? getUsers() : [];
      const institutionStaff = allUsers.filter(u => u.institution === userInstitution);

      institutionStaff.forEach(staff => {
        const notificationData = createAnnouncementNotification(result.announcement, staff.email);
        createNotification(notificationData);
      });

      setAnnouncements(prev => [result.announcement, ...prev]);
      setForm({ title: '', body: '' });
      setFormError('');
      setView('list');
      alert(`Announcement published successfully!\n\n${institutionStaff.length} staff members in ${userInstitution} have been notified.`);
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Cancel
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">New Institution Announcement</h2>
          <form onSubmit={submitAnnouncement} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Brief announcement title"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Content <span className="text-red-500">*</span></label>
              <textarea rows={5} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Announcement content"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition text-sm resize-y" />
            </div>
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800">
              <strong>Scope:</strong> This announcement will be visible to staff and employees in {userInstitution || 'your institution'}.
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
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
          <p className="text-sm text-gray-500">Operational announcements for your institution.</p>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">My Profile</h2>
        <p className="text-sm text-gray-500">Your account information.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
            {user?.name?.charAt(0) || 'I'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="badge bg-orange-100 text-orange-800 mt-1">Institution Manager</span>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Full Name</span><span className="font-medium text-gray-900">{user?.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-gray-900">{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium text-gray-900">Institution Manager</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Institution</span><span className="font-medium text-gray-900">{userInstitution || 'Not Assigned'}</span></div>
        </div>
      </div>
      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800">
        <strong>Note:</strong> To update your profile or change your password, contact MESOB administration.
      </div>
    </>
  );
}

// ─── Main InstitutionManagerDashboard ─────────────────────────────
export default function InstitutionManagerDashboard() {
  const { user } = useAuth();
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
      case 'Staff Management': return <SectionStaffManagement userInstitution={userInstitution} />;
      case 'Reports':          return <SectionReports userInstitution={userInstitution} />;
      case 'Announcements':    return <SectionAnnouncements user={user} userInstitution={userInstitution} />;
      case 'My Profile':       return <SectionMyProfile user={user} userInstitution={userInstitution} />;
      default:                 return <SectionDashboard setActiveSection={navigate} userInstitution={userInstitution} />;
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex min-h-screen">

        {/* ── Sidebar ── */}
        <aside className={`db-sidebar fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200${sidebarOpen ? ' open' : ''}`}>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-lg">I</div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">MESOB Center</p>
                <p className="text-xs text-gray-500">Institution Manager</p>
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
                {activeSection === 'Dashboard' ? 'Institution Manager Dashboard' : activeSection}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge bg-orange-100 text-orange-800">Institution Manager</span>
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
