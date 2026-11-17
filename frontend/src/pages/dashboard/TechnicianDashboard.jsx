import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useAnnouncements } from '../../context/AnnouncementContext';
import { useApp } from '../../context/AppContext';
import { getLocalizedStatus, getLocalizedPriority, getLocalizedRole, getInstitutionName } from '../../utils/localizedContent';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/dashboard/NotificationBell';
import SidebarNavIcon from '../../components/dashboard/SidebarNavIcon';

// ─── Navigation sections ─────────────────────────────────────────
const SECTIONS = [
  'Dashboard',
  'My Tasks',
  'Maintenance Reports',
  'Announcements',
  'My Profile',
];

const SECTION_KEYS = {
  'Dashboard': 'dashboard',
  'My Tasks': 'my_tasks',
  'Maintenance Reports': 'maintenance_reports',
  'Announcements': 'announcements',
  'My Profile': 'my_profile',
};

// ─── Badge helpers ────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const { lang } = useApp();
  const norm = String(priority || '').toUpperCase();
  const cls = {
    HIGH:   'badge bg-rose-50 text-rose-800 border border-rose-200 font-semibold',
    MEDIUM: 'badge bg-amber-50 text-amber-800 border border-amber-200 font-semibold',
    NORMAL: 'badge bg-slate-100 text-slate-700 border border-slate-200 font-semibold',
    LOW:    'badge bg-slate-100 text-slate-700 border border-slate-200 font-semibold',
  }[norm] || 'badge bg-slate-100 text-slate-700 border border-slate-200 font-semibold';
  return <span className={cls}>{getLocalizedPriority(priority, lang)}</span>;
}

function StatusBadge({ status }) {
  const { lang } = useApp();
  const norm = String(status || '').toUpperCase().replace(/[\s-]/g, '_');
  const cls = {
    ASSIGNED:      'badge bg-amber-50 text-amber-800 border border-amber-200 font-semibold',
    IN_PROGRESS:   'badge bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold',
    WAITING_PARTS: 'badge bg-amber-50 text-amber-800 border border-amber-200 font-semibold',
    COMPLETED:     'badge bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold',
    RESOLVED:      'badge bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold',
    CLOSED:        'badge bg-slate-100 text-slate-800 border border-slate-300 font-semibold',
    SUBMITTED:     'badge bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold',
    DRAFT:         'badge bg-slate-100 text-slate-700 border border-slate-200 font-semibold',
  }[norm] || 'badge bg-slate-100 text-slate-700 border border-slate-200 font-semibold';
  return <span className={cls}>{getLocalizedStatus(status, lang)}</span>;
}

// ─── SECTION: Dashboard Overview ─────────────────────────────────
function SectionDashboard({ setActiveSection, tasks }) {
  const { announcements } = useAnnouncements();
  const { user } = useAuth();
  const { t, lang } = useApp();
  const pending = tasks.filter(t => t.status !== 'Completed').length;
  const highPriority = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;

  return (
    <>
      {/* Technician Overview Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#2563eb] rounded-2xl p-6 text-white mb-8 shadow-sm border border-blue-900/40">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f4b51a] via-[#f59e0b] to-[#f4b51a]" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#f4b51a] border border-[#f4b51a]/30 text-xs font-semibold mb-2.5 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{lang === 'am' ? 'የቴክኒክ ስራዎች እና ጥገና' : 'Technical Operations & Maintenance'}</span>
              <span>•</span>
              <span className="text-blue-100 font-normal">{lang === 'am' ? 'መሶብ ማዕከል' : 'MESOB Center'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {lang === 'am' ? `እንኳን ደህና መጡ፣ ${user?.name || 'ቴክኒሻን'}` : `Welcome, ${user?.name || 'Technician'}`}
            </h2>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              {t.technician_role_banner}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <button
              onClick={() => setActiveSection('My Tasks')}
              className="px-4 py-2.5 rounded-xl bg-[#f4b51a] hover:bg-[#e0a20e] text-slate-900 text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>{t.view_my_tasks}</span>
            </button>
            <button
              onClick={() => setActiveSection('Report Issue')}
              className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold transition backdrop-blur-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{t.report_issue}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => setActiveSection('My Tasks')}
          className="bg-white rounded-2xl border border-slate-200/90 border-t-3 border-t-indigo-500 shadow-xs p-5 hover:border-indigo-400 hover:shadow-sm transition-all text-left cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-indigo-800 transition-colors">{t.assigned_tasks}</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#1e3a8a]">{tasks.length}</p>
          <p className="text-xs text-amber-700 mt-1.5 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{highPriority} {t.high_priority_tasks}</span>
            </span>
            <span>→</span>
          </p>
        </button>

        <button
          onClick={() => setActiveSection('My Tasks')}
          className="bg-white rounded-2xl border border-slate-200/90 border-t-3 border-t-amber-500 shadow-xs p-5 hover:border-amber-400 hover:shadow-sm transition-all text-left cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-amber-800 transition-colors">{t.pending_tasks}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 group-hover:bg-amber-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-700">{pending}</p>
          <p className="text-xs text-amber-800 font-medium mt-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{t.awaiting_resolution}</span>
            </span>
            <span>→</span>
          </p>
        </button>

        <button
          onClick={() => setActiveSection('Announcements')}
          className="bg-white rounded-2xl border border-slate-200/90 border-t-3 border-t-blue-500 shadow-xs p-5 hover:border-blue-400 hover:shadow-sm transition-all text-left cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-blue-800 transition-colors">{t.announcements}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#1e3a8a]">{announcements.filter(a => !a.is_read).length}</p>
          <p className="text-xs text-blue-700 font-medium mt-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{t.unread_announcements}</span>
            </span>
            <span>→</span>
          </p>
        </button>
      </div>

      {/* My Tasks preview */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
            <h2 className="font-bold text-slate-900 text-base">{t.active_maintenance_tasks}</h2>
          </div>
          <button
            onClick={() => setActiveSection('My Tasks')}
            className="text-xs sm:text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8] flex items-center gap-1 group cursor-pointer"
          >
            <span>{t.view_all_tasks}</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>
        <div className="table-container border-0 rounded-none overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200/80">
                <th className="px-5 py-3 text-left">{t.task_id}</th>
                <th className="px-5 py-3 text-left">{t.task_details}</th>
                <th className="px-5 py-3 text-left">{t.institution || (lang === 'am' ? 'ተቋም' : 'Institution')}</th>
                <th className="px-5 py-3 text-left">{t.priority || (lang === 'am' ? 'ቅድሚያ' : 'Priority')}</th>
                <th className="px-5 py-3 text-left">{t.status || (lang === 'am' ? 'ሁኔታ' : 'Status')}</th>
                <th className="px-5 py-3 text-left">{t.actions_label || (lang === 'am' ? 'ድርጊት' : 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.filter(t => t.status !== 'Completed').length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-12 px-4">
                    <p className="font-semibold text-slate-700 text-sm">{t.all_tasks_completed}</p>
                    <p className="text-xs text-slate-500 mt-1">{t.no_pending_tasks_desc}</p>
                  </td>
                </tr>
              ) : (
                tasks.filter(t => t.status !== 'Completed').slice(0, 4).map(task => (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-sm font-semibold text-slate-900">{task.id}</td>
                    <td className="px-5 py-3.5 text-slate-800 text-sm font-medium">{task.title}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-sm">{getInstitutionName(task.institution, lang)}</td>
                    <td className="px-5 py-3.5"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={task.status} /></td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setActiveSection('My Tasks')}
                        className="text-[#2563eb] hover:text-[#1d4ed8] text-sm font-semibold transition"
                      >
                        {t.open_task || (lang === 'am' ? 'ተግባር ክፈት' : 'Open Task')} →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start sm:items-center gap-3.5 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] text-[#f4b51a] flex items-center justify-center flex-shrink-0 shadow-xs border border-blue-900/40">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-xs sm:text-sm text-blue-950 leading-relaxed">
          <strong className="font-semibold text-[#1e3a8a]">{lang === 'am' ? 'የቴክኒሻን ሚና:' : 'Technician Role:'}</strong>{' '}
          {t.technician_role_banner}
        </div>
      </div>
    </>
  );
}

// ─── SECTION: My Tasks ────────────────────────────────────────────
function SectionMyTasks({ tasks, loadingTasks, reloadTasks }) {
  const { t, lang } = useApp();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, selectedTask?.id]); // Intentionally using selectedTask?.id

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

        alert(lang === 'am' ? 'ተግባሩ በተሳካ ሁኔታ ተጀምሯል።' : 'Task started successfully.');
      } catch (error) {
        console.error('Failed to start maintenance task:', error);
        alert(error.message || 'Failed to start task.');
      }
    }
  }

  async function handleCompleteTask() {
    if (!resolution.trim()) {
      setResolutionError(lang === 'am' ? 'የመፍትሄ መግለጫ ያስፈልጋል' : 'Resolution is required');
      return;
    }

    if (resolution.trim().length < 20) {
      setResolutionError(lang === 'am' ? 'የመፍትሄው መግለጫ ቢያንስ 20 ፊደላት መሆን አለበት' : 'Resolution must be at least 20 characters');
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
        lang === 'am'
          ? 'ተግባሩ በተሳካ ሁኔታ ተጠናቋል!\n\nየጥገና ሪፖርቱ መፍትሄ አግኝቷል።'
          : 'Task completed successfully!\n\nThe maintenance report has been resolved.'
      );
    } catch (error) {
      console.error('Failed to complete maintenance task:', error);
      setResolutionError(
        error.message || 'Failed to complete task.'
      );
    }
  }

  async function handleWaitingParts(task) {
    const reportId = task.reportId || task.maintenance_report_id;
    if (!reportId) return;
    try {
      const response = await api.patch(`/maintenance/reports/${reportId}/status`, {
        status: 'WAITING_PARTS'
      });
      if (response.success) {
        await reloadTasks();
        alert(lang === 'am' ? 'ሪፖርቱ መለዋወጫ በመጠባበቅ ላይ ተብሎ ምልክት ተደርጓል።' : 'Report marked as Waiting for Parts.');
      } else {
        alert(response.message || 'Failed to update status.');
      }
    } catch (err) {
      alert(err.message || 'Error updating status to Waiting Parts.');
    }
  }

  async function handleResumeWork(task) {
    const reportId = task.reportId || task.maintenance_report_id;
    if (!reportId) return;
    try {
      const response = await api.patch(`/maintenance/reports/${reportId}/status`, {
        status: 'IN_PROGRESS'
      });
      if (response.success) {
        await reloadTasks();
        alert(lang === 'am' ? 'ስራው ቀጥሏል። ሁኔታው በሂደት ላይ ተደርጓል።' : 'Work resumed. Status set to In Progress.');
      } else {
        alert(response.message || 'Failed to resume work.');
      }
    } catch (err) {
      alert(err.message || 'Error resuming work.');
    }
  }

  const actionLabel = status => {
    const norm = String(status || '').toUpperCase().replace(/[\s-]/g, '_');
    if (norm === 'ASSIGNED') return t.start_task || (lang === 'am' ? 'ጀምር' : 'Start');
    if (norm === 'IN_PROGRESS') return t.complete_task || (lang === 'am' ? 'አጠናቅቅ' : 'Complete');
    return null;
  };

  if (selectedTask) {
    const live = tasks.find(t => t.id === selectedTask.id) || selectedTask;
    const label = actionLabel(live.status);

    return (
      <>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t.task_details}</h2>
              <p className="text-sm text-slate-500">{lang === 'am' ? 'የጥገና ስራ መረጃ' : 'Maintenance task information'}</p>
            </div>

            <button
              onClick={() => setSelectedTask(null)}
              className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-sm transition shadow-xs cursor-pointer"
            >
              {t.back_to_tasks}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{live.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t.task_id}: <span className="font-mono text-slate-700">{live.id}</span>
                </p>
              </div>

              <StatusBadge status={live.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.institution || (lang === 'am' ? 'ተቋም' : 'Institution')}</p>
                <p className="font-semibold text-slate-900 mt-1">{getInstitutionName(live.institution, lang)}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.priority || (lang === 'am' ? 'ቅድሚያ' : 'Priority')}</p>
                <PriorityBadge priority={live.priority} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{lang === 'am' ? 'ቦታ' : 'Location'}</p>
                <p className="font-medium text-slate-900 mt-1">{live.location || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{lang === 'am' ? 'የተመደበበት ቀን' : 'Assigned Date'}</p>
                <p className="font-medium text-slate-900 mt-1">{live.assignedDate}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.description || (lang === 'am' ? 'መግለጫ' : 'Description')}</p>
              <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {live.description || (lang === 'am' ? 'ምንም መግለጫ አልተሰጠም።' : 'No description provided.')}
              </p>
            </div>

            {live.equipmentInfo && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.equipment_office}</p>
                <p className="mt-1 text-sm text-slate-800 font-medium">
                  {live.equipmentInfo}
                </p>
              </div>
            )}

            {live.photo && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t.problem_photo}</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <img 
                    src={live.photo} 
                    alt={live.photoName || 'Problem photo'} 
                    className="w-full max-w-2xl h-auto"
                    style={{ maxHeight: '500px', objectFit: 'contain' }}
                  />
                </div>
                {live.photoName && (
                  <p className="text-xs text-slate-500 mt-1">{live.photoName}</p>
                )}
              </div>
            )}

            {live.attachments && live.attachments.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t.attachments_count} ({live.attachments.length})</p>
                <div className="space-y-2">
                  {live.attachments.map((attachment, i) => (
                    <a
                      key={i}
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                    >
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{attachment.file_name}</p>
                        <p className="text-xs text-slate-500">
                          {attachment.file_type} · {(attachment.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {live.status === 'Completed' && live.resolution && (
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t.resolution_title}
                </p>
                <p className="mt-1 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {live.resolution}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {label && (
                <button
                  onClick={() => advanceStatus(live.id)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white font-semibold transition shadow-xs text-sm cursor-pointer"
                >
                  {label}
                </button>
              )}

              {live.status === 'In Progress' && (
                <button
                  onClick={() => handleWaitingParts(live)}
                  className="px-4 py-2.5 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-50 font-semibold transition text-sm cursor-pointer"
                >
                  {t.mark_waiting_parts}
                </button>
              )}

              {live.status === 'Waiting Parts' && (
                <button
                  onClick={() => handleResumeWork(live)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition text-sm cursor-pointer"
                >
                  {t.resume_work}
                </button>
              )}

              {live.status === 'Completed' && (
                <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-sm py-1.5 px-3">
                  {t.task_completed}
                </span>
              )}
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className={live.status === 'Assigned' || live.status === 'In Progress' || live.status === 'Completed' ? 'text-[#314ea1] font-bold' : ''}>
                  {getLocalizedStatus('ASSIGNED', lang)}
                </span>
                <span>→</span>
                <span className={live.status === 'In Progress' || live.status === 'Completed' ? 'text-[#314ea1] font-bold' : ''}>
                  {getLocalizedStatus('IN_PROGRESS', lang)}
                </span>
                <span>→</span>
                <span className={live.status === 'Completed' ? 'text-emerald-700 font-bold' : ''}>
                  {getLocalizedStatus('COMPLETED', lang)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {showResolutionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {t.resolution_modal_title}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {t.resolution_modal_desc}
              </p>

              <textarea
                value={resolution}
                onChange={e => {
                  setResolution(e.target.value);
                  setResolutionError('');
                }}
                rows={6}
                className="mt-4 w-full rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] focus:outline-none text-sm bg-white"
                placeholder={t.resolution_placeholder}
              />

              {resolutionError && (
                <p className="mt-2 text-sm text-rose-600 font-medium">
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
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-semibold text-sm text-slate-700 transition cursor-pointer"
                >
                  {t.cancel_action}
                </button>

                <button
                  onClick={handleCompleteTask}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white font-semibold text-sm transition shadow-xs cursor-pointer"
                >
                  {t.submit_complete_task}
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
        <h2 className="text-xl font-bold text-slate-900">{t.my_tasks}</h2>
        <p className="text-sm text-slate-500">
          {lang === 'am' ? 'ለእርስዎ የተመደቡ የጥገና ተግባራት' : 'Maintenance tasks assigned to you'}
        </p>
      </div>

      {loadingTasks ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 text-center text-slate-500">
          {lang === 'am' ? 'ተግባራት በመጫን ላይ...' : 'Loading tasks...'}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 text-center text-slate-500">
          {t.no_pending_tasks_desc}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="text-left p-4">{t.task_id}</th>
                  <th className="text-left p-4">{t.task_details}</th>
                  <th className="text-left p-4">{t.institution || (lang === 'am' ? 'ተቋም' : 'Institution')}</th>
                  <th className="text-left p-4">{t.priority || (lang === 'am' ? 'ቅድሚያ' : 'Priority')}</th>
                  <th className="text-left p-4">{lang === 'am' ? 'የተመደበበት ቀን' : 'Assigned Date'}</th>
                  <th className="text-left p-4">{t.status || (lang === 'am' ? 'ሁኔታ' : 'Status')}</th>
                  <th className="text-left p-4">{t.actions_label || (lang === 'am' ? 'ድርጊት' : 'Action')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {tasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-mono text-xs text-slate-600">{task.id}</td>
                    <td className="p-4 font-semibold text-slate-900">{task.title}</td>
                    <td className="p-4 text-slate-700">{getInstitutionName(task.institution, lang)}</td>
                    <td className="p-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="p-4 text-slate-600">{task.assignedDate}</td>
                    <td className="p-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-semibold text-xs text-slate-700 transition cursor-pointer"
                      >
                        {task.status === 'Completed' ? (lang === 'am' ? 'ዝርዝር' : 'View') : (lang === 'am' ? 'ክፈት' : 'Open')}
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
  const { t, lang } = useApp();
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">{t.maintenance_reports}</h2>
        <p className="text-sm text-slate-500">{lang === 'am' ? 'ያጠናቀቋቸው የጥገና ተግባራት እንደ ጥገና ሪፖርት ያገለግላሉ።' : 'Your completed maintenance tasks serve as your maintenance reports.'}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">{t.completed_maintenance_work}</h3>
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full px-2.5 py-1">{completedTasks.length} {lang === 'am' ? 'ተጠናቋል' : 'completed'}</span>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.task_id}</th>
                <th>{lang === 'am' ? 'ርዕስ' : 'Title'}</th>
                <th>{lang === 'am' ? 'ተዛማጅ ሪፖርት' : 'Related Report'}</th>
                <th>{t.institution || (lang === 'am' ? 'ተቋም' : 'Institution')}</th>
                <th>{t.priority || (lang === 'am' ? 'ቅድሚያ' : 'Priority')}</th>
                <th>{lang === 'am' ? 'የተጠናቀቀበት ቀን' : 'Completed Date'}</th>
              </tr>
            </thead>
            <tbody>
              {completedTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-6">
                    {t.no_completed_tasks_desc}
                  </td>
                </tr>
              ) : completedTasks.map(task => (
                <tr key={task.id}>
                  <td className="font-medium font-mono text-xs text-slate-600">{task.id}</td>
                  <td className="font-semibold text-slate-900">{task.title}</td>
                  <td>{task.reportId || <span className="text-slate-400">—</span>}</td>
                  <td>{getInstitutionName(task.institution, lang)}</td>
                  <td><PriorityBadge priority={task.priority} /></td>
                  <td className="text-slate-600">{task.completedDate || task.assignedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800">
        <strong className="text-slate-900">{lang === 'am' ? 'የጥገና ሪፖርቶች:' : 'Maintenance Reports:'}</strong>{' '}
        {lang === 'am'
          ? 'ተግባር ሲያጠናቅቁ በራስ-ሰር ወደ ጥገና ታሪክዎ ውስጥ ይካተታል። የተቋሙ ስራ አስኪያጆች የተጠናቀቀውን ስራ መመልከት ይችላሉ።'
          : 'When you complete a task, it automatically becomes part of your maintenance history. Institution Managers can view your completed work.'}
      </div>
    </>
  );
}

// ─── SECTION: Announcements ───────────────────────────────────────
function SectionAnnouncements() {
  const { announcements, loading } = useAnnouncements();
  const { t, lang } = useApp();
  const [selected, setSelected] = useState(null);

  if (selected) {
    const ann = announcements.find(a => a.id === selected);
    if (!ann) return null;

    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelected(null)}
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {lang === 'am' ? 'ወደ ማስታወቂያዎች ተመለስ' : 'Back to Announcements'}
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900">{ann.title}</h2>
            {ann.is_active && <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex-shrink-0">{getLocalizedStatus('ACTIVE', lang)}</span>}
          </div>
          <p className="text-xs text-slate-500 mb-4">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">{t.announcements}</h2>
        <p className="text-sm text-slate-500">{lang === 'am' ? 'የስራ ማስታወቂያዎች እና ማሳወቂያዎች።' : 'Operational announcements and notifications.'}</p>
      </div>

      {loading && !announcements.length && (
        <div className="text-center py-8 text-slate-500">{lang === 'am' ? 'ማስታወቂያዎች በመጫን ላይ...' : 'Loading announcements...'}</div>
      )}

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center text-slate-400 py-12">{lang === 'am' ? 'ምንም ማስታወቂያ የለም።' : 'No announcements available.'}</div>
        ) : announcements.map(ann => (
          <div
            key={ann.id}
            onClick={() => setSelected(ann.id)}
            className={`bg-white rounded-2xl border shadow-xs p-5 cursor-pointer hover:border-slate-300 transition-all duration-200 ${ann.is_active ? 'border-slate-200/90' : 'border-slate-200 bg-slate-50/70'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {ann.is_active && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                  <h3 className="font-semibold text-sm text-slate-900 leading-snug">{ann.title}</h3>
                </div>
                <p className="text-xs text-slate-500">{new Date(ann.published_at || ann.created_at).toLocaleDateString()}</p>
              </div>
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none"
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
  const { t, lang } = useApp();
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">{t.my_profile}</h2>
        <p className="text-sm text-slate-500">{lang === 'am' ? 'የመለያዎ መረጃ።' : 'Your account information.'}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md">
            {user?.name?.charAt(0) || 'T'}
          </div>
          <div>
            <p className="font-bold text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="badge bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold mt-1">{getLocalizedRole(user?.role || 'technician', lang)}</span>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">{t.user_full_name}</span>
            <span className="font-semibold text-slate-900">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{t.user_email_address}</span>
            <span className="font-semibold text-slate-900">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{t.user_role_label}</span>
            <span className="font-semibold text-slate-900">{getLocalizedRole(user?.role || 'technician', lang)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{lang === 'am' ? 'ክፍል' : 'Department'}</span>
            <span className="font-semibold text-slate-900">{lang === 'am' ? 'መሶብ ማዕከል – አይሲቲ' : 'MESOB Center – ICT'}</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800 max-w-lg">
        <strong className="text-slate-900">Note:</strong> To update your profile or change your password, contact the Institution Manager or MESOB administration.
      </div>
    </>
  );
}

// ─── Main TechnicianDashboard ───────────────────────────────────────
export default function TechnicianDashboard() {
  const { user, logout } = useAuth();
  const { t, lang } = useApp();
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Load tasks at parent level so all sections can access them
  const loadTasks = useCallback(async () => {
    try {
      console.log('=== TECHNICIAN: Loading tasks ===');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Load tasks only on mount - setState inside loadTasks is intentional

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
      case 'My Tasks':            return <SectionMyTasks user={user} tasks={tasks} loadingTasks={loadingTasks} reloadTasks={loadTasks} />;
      case 'Maintenance Reports': return <SectionMaintenanceReports user={user} tasks={tasks} />;
      case 'Announcements':       return <SectionAnnouncements />;
      case 'My Profile':          return <SectionMyProfile user={user} />;
      default:                    return <SectionDashboard setActiveSection={navigate} tasks={tasks} />;
    }
  }

  const initials = (user?.name || user?.full_name || 'TECH')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="dashboard-bg min-h-screen text-slate-900 relative">
      <div className="flex min-h-screen relative z-10">

        {/* ── Sidebar ── */}
        <aside className={`db-sidebar fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-200${sidebarOpen ? ' open' : ''}`}>
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] text-[#f4b51a] flex items-center justify-center font-bold text-xs shadow-sm border border-slate-700/60">
                TECH
              </div>
              <div>
                <p className="font-bold text-white text-sm tracking-tight">MESOB Center</p>
                <p className="text-xs text-slate-400 font-medium">{t.technician_portal || (lang === 'am' ? 'የቴክኒሻን መግቢያ' : 'Technician Portal')}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
            {SECTIONS.map(section => {
              const isActive = activeSection === section;
              return (
                <button
                  key={section}
                  onClick={() => navigate(section)}
                  className={`sidebar-link w-full text-left${isActive ? ' active' : ''} cursor-pointer`}
                >
                  <SidebarNavIcon section={section} className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{t[SECTION_KEYS[section]] || section}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-3.5 border-t border-slate-800">
            <button
              onClick={logout}
              className="sidebar-link w-full text-left text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 font-medium transition cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span>{t.logout || 'Logout'}</span>
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-700 cursor-pointer"
                onClick={() => setSidebarOpen(o => !o)}
                aria-label="Toggle sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="4" x2="20" y1="6" y2="6"/>
                  <line x1="4" x2="20" y1="12" y2="12"/>
                  <line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              </button>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {activeSection === 'Dashboard' ? (t.technician_dashboard || 'Technician Dashboard') : (t[SECTION_KEYS[activeSection]] || activeSection)}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
              <NotificationBell onNavigate={(section) => navigate(section)} />
              <span className="badge bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold">{getLocalizedRole(user?.role || 'technician', lang)}</span>
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 hidden sm:flex">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1e3a8a] font-bold text-xs flex items-center justify-center border border-blue-200/80">
                  {initials}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</p>
                  <p className="text-xs text-slate-500 leading-tight">{user?.email}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8">
            {renderSection()}
          </main>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}