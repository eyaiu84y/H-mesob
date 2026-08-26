import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getMaintenanceTasks, updateMaintenanceTask, getAnnouncements, createTaskCompletionNotification } from '../../utils/sharedData';

// ─── Navigation sections ─────────────────────────────────────────
const SECTIONS = [
  'Dashboard',
  'My Tasks',
  'Maintenance Reports',
  'Announcements',
  'My Profile',
];

// ─── Mock static data removed - using shared data system ────────

// ─── Badge helpers ────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const cls = {
    High:   'badge bg-red-100 text-red-800',
    Medium: 'badge bg-amber-100 text-amber-800',
    Normal: 'badge bg-gray-100 text-gray-700',
  }[priority] || 'badge bg-gray-100 text-gray-700';
  return <span className={cls}>{priority}</span>;
}

function StatusBadge({ status }) {
  const cls = {
    Assigned:      'badge bg-amber-100 text-amber-800',
    'In Progress': 'badge bg-blue-100 text-blue-800',
    Completed:     'badge bg-green-100 text-green-800',
    Submitted:     'badge bg-green-100 text-green-800',
    Draft:         'badge bg-gray-100 text-gray-700',
  }[status] || 'badge bg-gray-100 text-gray-700';
  return <span className={cls}>{status}</span>;
}

// ─── SECTION: Dashboard Overview ─────────────────────────────────
function SectionDashboard({ setActiveSection, user }) {
  const tasks = getMaintenanceTasks({ assignedTo: user?.name });
  const pending = tasks.filter(t => t.status !== 'Completed').length;
  const announcements = getAnnouncements({ institution: 'MESOB Center' });

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Assigned Tasks</p>
          <p className="text-2xl font-bold">{tasks.length}</p>
          <p className="text-xs text-amber-600 mt-1">
            {tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length} high priority
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Pending Tasks</p>
          <p className="text-2xl font-bold">{pending}</p>
          <p className="text-xs text-gray-500 mt-1">Not yet completed</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Announcements</p>
          <p className="text-2xl font-bold">{announcements.filter(a => !a.read).length}</p>
          <p className="text-xs text-gray-500 mt-1">Unread</p>
        </div>
      </div>

      {/* My Tasks preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">My Tasks</h2>
          <button
            onClick={() => setActiveSection('My Tasks')}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            View all
          </button>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Task</th>
                <th>Institution</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.filter(t => t.status !== 'Completed').slice(0, 3).map(task => (
                <tr key={task.id}>
                  <td className="font-medium">{task.id}</td>
                  <td>{task.title}</td>
                  <td>{task.institution}</td>
                  <td><PriorityBadge priority={task.priority} /></td>
                  <td><StatusBadge status={task.status} /></td>
                  <td>
                    <button
                      onClick={() => setActiveSection('My Tasks')}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-xl text-sm text-cyan-900">
        <strong>Technician:</strong> Process assigned technical tasks, record maintenance work, and submit reports. You do not assign tasks to other staff or manage users and institutions.
      </div>
    </>
  );
}

// ─── SECTION: My Tasks ────────────────────────────────────────────
function SectionMyTasks({ user }) {
  const { getUsers } = useAuth();
  const { createNotification } = useNotifications();
  const [tasks, setTasks] = useState(() => getMaintenanceTasks({ assignedTo: user?.name }));
  const [selectedTask, setSelectedTask] = useState(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolutionError, setResolutionError] = useState('');

  function advanceStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // If task is "In Progress", show resolution form instead of completing directly
    if (task.status === 'In Progress') {
      setShowResolutionModal(true);
      setResolution('');
      setResolutionError('');
      return;
    }

    // For "Assigned" → "In Progress", proceed directly
    if (task.status === 'Assigned') {
      const result = updateMaintenanceTask(id, { status: 'In Progress' });
      if (result.success) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'In Progress' } : t));
        if (selectedTask?.id === id) {
          setSelectedTask(prev => ({ ...prev, status: 'In Progress' }));
        }
      }
    }
  }

  function handleCompleteTask() {
    // Validate resolution
    if (!resolution.trim()) {
      setResolutionError('Resolution is required');
      return;
    }
    if (resolution.trim().length < 20) {
      setResolutionError('Resolution must be at least 20 characters');
      return;
    }

    const task = selectedTask;
    if (!task) return;

    const completedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const result = updateMaintenanceTask(task.id, {
      status: 'Completed',
      resolution: resolution.trim(),
      completedDate: completedDate,
      completedBy: user?.name,
    });

    if (result.success) {
      // Create notification for Institution Manager
      const allUsers = getUsers ? getUsers() : [];
      const institutionManager = allUsers.find(u => 
        u.role === 'manager' && u.institution === task.institution
      );

      if (institutionManager) {
        const completedTask = { ...task, status: 'Completed', resolution: resolution.trim() };
        const notificationData = createTaskCompletionNotification(completedTask, institutionManager.email);
        createNotification(notificationData);
      }

      setTasks(prev => prev.map(t => t.id === task.id ? {
        ...t,
        status: 'Completed',
        resolution: resolution.trim(),
        completedDate: completedDate,
        completedBy: user?.name,
      } : t));
      setSelectedTask(prev => ({
        ...prev,
        status: 'Completed',
        resolution: resolution.trim(),
        completedDate: completedDate,
        completedBy: user?.name,
      }));
      setShowResolutionModal(false);
      setResolution('');
      setResolutionError('');
      alert('Task completed successfully!\n\nYour Institution Manager has been notified.');
    }
  }

  function actionLabel(status) {
    return { Assigned: 'Start', 'In Progress': 'Complete' }[status] || null;
  }

  // ── Task detail view with comprehensive employee report fields ──
  if (selectedTask) {
    const live = tasks.find(t => t.id === selectedTask.id) || selectedTask;
    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelectedTask(null)}
            className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Tasks
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 max-w-4xl">
          {/* Task header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-1">{live.id}</p>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{live.title}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={live.priority} />
                <StatusBadge status={live.status} />
              </div>
            </div>
            {actionLabel(live.status) && (
              <button
                onClick={() => advanceStatus(live.id)}
                className="px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition"
              >
                {actionLabel(live.status)} Task
              </button>
            )}
          </div>

          {/* Comprehensive details grid showing ALL employee report fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Task Information</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Task ID:</span>
                    <span className="font-medium text-gray-900">{live.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Institution:</span>
                    <span className="font-medium text-gray-900">{live.institution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assigned Date:</span>
                    <span className="font-medium text-gray-900">{live.assignedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <StatusBadge status={live.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Priority:</span>
                    <PriorityBadge priority={live.priority} />
                  </div>
                  {live.reportId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Related Report:</span>
                      <span className="font-medium text-gray-900">{live.reportId}</span>
                    </div>
                  )}
                </div>
              </div>

              {(live.employeeName || live.employeeId) && (
                <div>
                  <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Reported By</p>
                  <div className="space-y-2">
                    {live.employeeName && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Employee Name:</span>
                        <span className="font-medium text-gray-900">{live.employeeName}</span>
                      </div>
                    )}
                    {live.employeeId && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Employee ID:</span>
                        <span className="font-medium text-gray-900">{live.employeeId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {(live.problemType || live.location || live.officeNumber) && (
                <div>
                  <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Problem Location</p>
                  <div className="space-y-2">
                    {live.problemType && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Problem Type:</span>
                        <span className="font-medium text-gray-900">{live.problemType}</span>
                      </div>
                    )}
                    {live.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span className="font-medium text-gray-900">{live.location}</span>
                      </div>
                    )}
                    {live.officeNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Office Number:</span>
                        <span className="font-medium text-gray-900">{live.officeNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Problem Description */}
          {live.description && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Problem Description</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4">{live.description}</p>
            </div>
          )}

          {/* Problem Photo from employee report */}
          {live.photoPreview && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Problem Photo</p>
              <img
                src={live.photoPreview}
                alt="Problem photo"
                className="max-w-lg w-full rounded-xl border border-gray-200 shadow-sm"
              />
            </div>
          )}

          {/* Resolution (shown after completion) */}
          {live.status === 'Completed' && live.resolution && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">Resolution / Work Performed</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{live.resolution}</p>
                <div className="text-xs text-gray-500 flex flex-wrap gap-4">
                  {live.completedDate && (
                    <span>
                      <strong>Completed:</strong> {live.completedDate}
                    </span>
                  )}
                  {live.completedBy && (
                    <span>
                      <strong>By:</strong> {live.completedBy}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-xl text-sm text-cyan-900 max-w-4xl">
          <strong>Status Flow:</strong> Assigned → In Progress → Completed. Use the action button to advance task status. All details from the employee maintenance report are shown above including location, problem type, and photo.
        </div>

        {/* Resolution Modal */}
        {showResolutionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Complete Task</h3>
                <p className="text-sm text-gray-500 mt-1">Record the resolution and work performed for this task</p>
              </div>

              <div className="p-6 space-y-4">
                {/* Task Summary */}
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p className="font-semibold text-gray-900 mb-2">{live.title}</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>Task ID:</strong> {live.id}</p>
                    <p><strong>Institution:</strong> {live.institution}</p>
                    {live.employeeName && <p><strong>Reported by:</strong> {live.employeeName}</p>}
                    {live.problemType && <p><strong>Problem Type:</strong> {live.problemType}</p>}
                  </div>
                </div>

                {/* Resolution Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Resolution / Work Performed <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => {
                      setResolution(e.target.value);
                      setResolutionError('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent text-sm resize-y"
                    rows="6"
                    placeholder="Describe the work performed, parts replaced, or how the problem was resolved. Be specific and detailed. (Minimum 20 characters)"
                  />
                  {resolutionError && (
                    <p className="text-red-600 text-xs mt-2">{resolutionError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {resolution.trim().length} / 20 characters minimum
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowResolutionModal(false);
                    setResolution('');
                    setResolutionError('');
                  }}
                  className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteTask}
                  className="px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition"
                >
                  Submit & Complete Task
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Task list view ──
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">My Tasks</h2>
        <p className="text-sm text-gray-500">Technical tasks assigned to you. Click a task to view details and update status.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Assigned Tasks</h3>
          <span className="text-sm text-gray-500">
            {tasks.filter(t => t.status !== 'Completed').length} pending
          </span>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Task</th>
                <th>Institution</th>
                <th>Priority</th>
                <th>Assigned</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-400 py-6">No tasks assigned yet.</td></tr>
              ) : tasks.map(task => (
                <tr key={task.id}>
                  <td className="font-medium">{task.id}</td>
                  <td>{task.title}</td>
                  <td>{task.institution}</td>
                  <td><PriorityBadge priority={task.priority} /></td>
                  <td>{task.assignedDate}</td>
                  <td><StatusBadge status={task.status} /></td>
                  <td>
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      {task.status === 'Completed' ? 'View' : 'Open'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-xl text-sm text-cyan-900">
        <strong>Task Assignment:</strong> Tasks are assigned to you by the Institution Manager. You cannot assign tasks to other staff.
      </div>
    </>
  );
}

// ─── SECTION: Maintenance Reports ────────────────────────────────
function SectionMaintenanceReports({ user }) {
  const tasks = getMaintenanceTasks({ assignedTo: user?.name });
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Maintenance Reports</h2>
        <p className="text-sm text-gray-500">Your completed maintenance tasks serve as your maintenance reports.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Completed Maintenance Work</h3>
          <span className="text-sm text-gray-500">{completedTasks.length} completed</span>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Title</th>
                <th>Related Report</th>
                <th>Institution</th>
                <th>Priority</th>
                <th>Completed Date</th>
              </tr>
            </thead>
            <tbody>
              {completedTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-6">
                    No completed maintenance work yet.
                  </td>
                </tr>
              ) : completedTasks.map(task => (
                <tr key={task.id}>
                  <td className="font-medium">{task.id}</td>
                  <td>{task.title}</td>
                  <td>{task.reportId || <span className="text-gray-400">—</span>}</td>
                  <td>{task.institution}</td>
                  <td><PriorityBadge priority={task.priority} /></td>
                  <td>{task.assignedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-xl text-sm text-cyan-900">
        <strong>Maintenance Reports:</strong> When you complete a task, it automatically becomes part of your maintenance history. Institution Managers can view your completed work.
      </div>
    </>
  );
}

// ─── SECTION: Announcements ───────────────────────────────────────
function SectionAnnouncements() {
  const [announcements, setAnnouncements] = useState(() => getAnnouncements({ institution: 'MESOB Center' }));
  const [selected, setSelected] = useState(null);

  function markRead(id) {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }

  if (selected) {
    const ann = announcements.find(a => a.id === selected);
    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelected(null)}
            className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
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

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Announcements</h2>
        <p className="text-sm text-gray-500">Operational announcements and notifications.</p>
      </div>
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No announcements available.</div>
        ) : announcements.map(ann => (
          <div
            key={ann.id}
            onClick={() => { setSelected(ann.id); markRead(ann.id); }}
            className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all duration-200 ${ann.read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!ann.read && <span className="inline-block w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />}
                  <h3 className="font-semibold text-sm text-gray-900 leading-snug">{ann.title}</h3>
                </div>
                <p className="text-xs text-gray-500">{ann.date}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
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
function SectionMyProfile({ user }) {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">My Profile</h2>
        <p className="text-sm text-gray-500">Your account information.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-14 h-14 rounded-2xl bg-cyan-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
            {user?.name?.charAt(0) || 'T'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="badge bg-cyan-100 text-cyan-800 mt-1">Technician</span>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Full Name</span>
            <span className="font-medium text-gray-900">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Role</span>
            <span className="font-medium text-gray-900">Technician</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Department</span>
            <span className="font-medium text-gray-900">MESOB Center – ICT</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-xl text-sm text-cyan-900">
        <strong>Note:</strong> To update your profile or change your password, contact the Institution Manager or MESOB administration.
      </div>
    </>
  );
}

// ─── Main ICTStaffDashboard ───────────────────────────────────────
export default function ICTStaffDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function navigate(section) {
    setActiveSection(section);
    setSidebarOpen(false);
  }

  function renderSection() {
    switch (activeSection) {
      case 'Dashboard':           return <SectionDashboard setActiveSection={navigate} user={user} />;
      case 'My Tasks':            return <SectionMyTasks user={user} />;
      case 'Maintenance Reports': return <SectionMaintenanceReports user={user} />;
      case 'Announcements':       return <SectionAnnouncements />;
      case 'My Profile':          return <SectionMyProfile user={user} />;
      default:                    return <SectionDashboard setActiveSection={navigate} user={user} />;
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex min-h-screen">

        {/* ── Sidebar ── */}
        <aside className={`db-sidebar fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200${sidebarOpen ? ' open' : ''}`}>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-sm">
                ICT
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">MESOB Center</p>
                <p className="text-xs text-gray-500">Technician Portal</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {SECTIONS.map(section => (
              <button
                key={section}
                onClick={() => navigate(section)}
                className={`sidebar-link w-full text-left${activeSection === section ? ' active' : ''}`}
              >
                {section}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => { localStorage.removeItem('mesob_auth'); window.location.href = '/'; }}
              className="sidebar-link w-full text-left text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen(o => !o)}
                aria-label="Toggle sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="4" x2="20" y1="6" y2="6"/>
                  <line x1="4" x2="20" y1="12" y2="12"/>
                  <line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {activeSection === 'Dashboard' ? 'Technician Dashboard' : activeSection}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge bg-cyan-100 text-cyan-800">Technician</span>
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
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
