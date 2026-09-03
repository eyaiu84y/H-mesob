import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useAnnouncements } from '../../context/AnnouncementContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

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
function SectionDashboard({ setActiveSection, tasks }) {
  const { announcements } = useAnnouncements();
  const pending = tasks.filter(t => t.status !== 'Completed').length;

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
          <p className="text-2xl font-bold">{announcements.filter(a => !a.is_read).length}</p>
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
function SectionMyTasks({ tasks, setTasks, loadingTasks, reloadTasks }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolutionError, setResolutionError] = useState('');

  // Update selectedTask when tasks change (after reload)
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask?.id]);

  async function advanceStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (task.backendStatus === 'IN_PROGRESS') {
      setSelectedTask(task);
      setShowResolutionModal(true);
      setResolution('');
      setResolutionError('');
      return;
    }

    if (task.backendStatus === 'PENDING') {
      try {
        const response = await api.patch(
          `/maintenance/tasks/${task.id}/status`,
          { status: 'IN_PROGRESS' }
        );

        if (!response.success) {
          alert(response.message || 'Failed to start task.');
          return;
        }

        await reloadTasks();

        setSelectedTask(prev =>
          prev && prev.id === task.id
            ? { ...prev, status: 'In Progress', backendStatus: 'IN_PROGRESS' }
            : prev
        );

        alert('Task started successfully.');
      } catch (error) {
        console.error('Failed to start maintenance task:', error);
        alert(error.message || 'Failed to start task.');
      }
    }
  }

  async function handleCompleteTask() {
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

    try {
      setResolutionError('');

      const response = await api.patch(
        `/maintenance/tasks/${task.id}/resolve`,
        {
          resolutionNotes: resolution.trim()
        }
      );

      if (!response.success) {
        setResolutionError(
          response.message || 'Failed to complete task.'
        );
        return;
      }

      await reloadTasks();

      setShowResolutionModal(false);
      setResolution('');
      setResolutionError('');

      const completedTask = {
        ...task,
        status: 'Completed',
        backendStatus: 'COMPLETED',
        resolution: resolution.trim()
      };

      setSelectedTask(completedTask);

      alert(
        'Task completed successfully!\\n\\n' +
        'The maintenance report has been resolved.'
      );
    } catch (error) {
      console.error('Failed to complete maintenance task:', error);
      setResolutionError(
        error.message || 'Failed to complete task.'
      );
    }
  }

  const actionLabel = status => {
    return {
      Assigned: 'Start',
      'In Progress': 'Complete'
    }[status] || null;
  };

  if (selectedTask) {
    const live = tasks.find(t => t.id === selectedTask.id) || selectedTask;
    const label = actionLabel(live.status);

    return (
      <>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Task Details</h2>
              <p className="text-gray-500">Maintenance task information</p>
            </div>

            <button
              onClick={() => setSelectedTask(null)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Back to My Tasks
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold">{live.title}</h3>
                <p className="text-sm text-gray-500">
                  Task ID: {live.id}
                </p>
              </div>

              <StatusBadge status={live.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Institution</p>
                <p className="font-medium">{live.institution}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <PriorityBadge priority={live.priority} />
              </div>

              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{live.location || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Assigned Date</p>
                <p className="font-medium">{live.assignedDate}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-500">Description</p>
              <p className="mt-1 text-gray-800 whitespace-pre-wrap">
                {live.description || 'No description provided.'}
              </p>
            </div>

            {live.equipmentInfo && (
              <div className="mt-6">
                <p className="text-sm text-gray-500">Equipment / Office</p>
                <p className="mt-1 text-gray-800">
                  {live.equipmentInfo}
                </p>
              </div>
            )}

            {live.photo && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Problem Photo</p>
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                  <img 
                    src={live.photo} 
                    alt={live.photoName || 'Problem photo'} 
                    className="w-full max-w-2xl h-auto"
                    style={{ maxHeight: '500px', objectFit: 'contain' }}
                  />
                </div>
                {live.photoName && (
                  <p className="text-xs text-gray-500 mt-1">{live.photoName}</p>
                )}
              </div>
            )}

            {live.attachments && live.attachments.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Attachments ({live.attachments.length})</p>
                <div className="space-y-2">
                  {live.attachments.map((attachment, i) => (
                    <a
                      key={i}
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {attachment.file_type} · {(attachment.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {live.status === 'Completed' && live.resolution && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">
                  Resolution
                </p>
                <p className="mt-1 text-gray-800 whitespace-pre-wrap">
                  {live.resolution}
                </p>
              </div>
            )}

            <div className="mt-8 flex items-center gap-3">
              {label && (
                <button
                  onClick={() => advanceStatus(live.id)}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  {label} Task
                </button>
              )}

              {live.status === 'Completed' && (
                <span className="text-green-600 font-medium">
                  Task Completed
                </span>
              )}
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2 text-sm">
                <span className={live.status === 'Assigned' || live.status === 'In Progress' || live.status === 'Completed' ? 'font-medium' : ''}>
                  Assigned
                </span>
                <span>→</span>
                <span className={live.status === 'In Progress' || live.status === 'Completed' ? 'font-medium' : ''}>
                  In Progress
                </span>
                <span>→</span>
                <span className={live.status === 'Completed' ? 'font-medium' : ''}>
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>

        {showResolutionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-gray-900">
                Complete Task
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Enter the resolution details for this maintenance task.
              </p>

              <textarea
                value={resolution}
                onChange={e => {
                  setResolution(e.target.value);
                  setResolutionError('');
                }}
                rows={6}
                className="mt-4 w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
                placeholder="Describe how the maintenance issue was resolved..."
              />

              {resolutionError && (
                <p className="mt-2 text-sm text-red-600">
                  {resolutionError}
                </p>
              )}

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowResolutionModal(false);
                    setResolution('');
                    setResolutionError('');
                  }}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleCompleteTask}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
        <p className="text-gray-500">
          Maintenance tasks assigned to you
        </p>
      </div>

      {loadingTasks ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          No maintenance tasks assigned to you.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4">Task ID</th>
                  <th className="text-left p-4">Task</th>
                  <th className="text-left p-4">Institution</th>
                  <th className="text-left p-4">Priority</th>
                  <th className="text-left p-4">Assigned Date</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} className="border-b last:border-0">
                    <td className="p-4 text-sm">{task.id}</td>
                    <td className="p-4 font-medium">{task.title}</td>
                    <td className="p-4">{task.institution}</td>
                    <td className="p-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="p-4">{task.assignedDate}</td>
                    <td className="p-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
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
      )}
    </div>
  );
}

function SectionMaintenanceReports({ tasks }) {
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
                  <td>{task.completedDate || task.assignedDate}</td>
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
  const { announcements, loading } = useAnnouncements();
  const [selected, setSelected] = useState(null);

  if (selected) {
    const ann = announcements.find(a => a.id === selected);
    if (!ann) return null;

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
            {ann.is_active && <span className="badge bg-green-100 text-green-800 flex-shrink-0">Active</span>}
          </div>
          <p className="text-sm text-gray-500 mb-4">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{ann.content}</p>
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

      {loading && !announcements.length && (
        <div className="text-center py-8 text-gray-500">Loading announcements...</div>
      )}

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No announcements available.</div>
        ) : announcements.map(ann => (
          <div
            key={ann.id}
            onClick={() => setSelected(ann.id)}
            className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all duration-200 ${ann.is_active ? 'border-gray-100' : 'border-gray-200 bg-gray-50'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {ann.is_active && <span className="inline-block w-2 h-2 rounded-full bg-green-600 flex-shrink-0" />}
                  <h3 className="font-semibold text-sm text-gray-900 leading-snug">{ann.title}</h3>
                </div>
                <p className="text-xs text-gray-500">{new Date(ann.published_at || ann.created_at).toLocaleDateString()}</p>
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
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Load tasks at parent level so all sections can access them
  const loadTasks = useCallback(async () => {
    try {
      console.log('=== ICT STAFF: Loading tasks ===');
      const response = await api.get('/maintenance/my-tasks');
      console.log('Tasks response:', response);
      
      if (!response.success || !response.data) {
        console.log('No tasks or failed response');
        setTasks([]);
        return;
      }
      
      const backendTasks = Array.isArray(response.data) ? response.data : [];
      console.log('Backend tasks count:', backendTasks.length);
      console.log('Tasks by status:', backendTasks.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {}));
      
      const normalizedTasks = backendTasks.map(task => {
        const report = task.maintenance_reports || {};
        const institution = report.institutions || {};
        const attachments = report.maintenance_attachments || [];
        const photo = attachments.find(a => a.file_type?.startsWith('image/'));
        
        const statusMap = {
          PENDING: 'Assigned',
          IN_PROGRESS: 'In Progress',
          COMPLETED: 'Completed',
          CANCELLED: 'Cancelled'
        };
        
        return {
          id: task.id,
          maintenanceTaskId: task.id,
          reportId: report.id,
          title: report.title || 'Maintenance Task',
          description: report.description || '',
          location: report.location || '',
          equipmentInfo: report.equipment_info || '',
          institution: institution.name_en || 'Unknown Institution',
          institutionName_am: institution.name_am || '',
          priority: report.priority || 'Normal',
          status: statusMap[task.status] || task.status,
          backendStatus: task.status,
          assignedDate: task.created_at
            ? new Date(task.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
            : 'N/A',
          completedAt: task.completed_at || null,
          completedDate: task.completed_at
            ? new Date(task.completed_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
            : 'N/A',
          resolution: task.completion_notes || '',
          photo: photo?.file_url || null,
          photoName: photo?.file_name || null,
          attachments: attachments
        };
      });
      
      console.log('Normalized tasks:', normalizedTasks);
      console.log('Completed tasks:', normalizedTasks.filter(t => t.status === 'Completed').length);
      setTasks(normalizedTasks);
    } catch (error) {
      console.error('Failed to load maintenance tasks:', error);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function navigate(section) {
    setActiveSection(section);
    setSidebarOpen(false);
    
    // Reload tasks when navigating to task-related sections
    if (section === 'My Tasks' || section === 'Maintenance Reports' || section === 'Dashboard') {
      loadTasks();
    }
  }

  function renderSection() {
    switch (activeSection) {
      case 'Dashboard':           return <SectionDashboard setActiveSection={navigate} tasks={tasks} />;
      case 'My Tasks':            return <SectionMyTasks user={user} tasks={tasks} setTasks={setTasks} loadingTasks={loadingTasks} reloadTasks={loadTasks} />;
      case 'Maintenance Reports': return <SectionMaintenanceReports user={user} tasks={tasks} />;
      case 'Announcements':       return <SectionAnnouncements />;
      case 'My Profile':          return <SectionMyProfile user={user} />;
      default:                    return <SectionDashboard setActiveSection={navigate} tasks={tasks} />;
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
              <LanguageSwitcher />
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
