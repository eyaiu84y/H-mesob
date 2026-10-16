import { useState, useEffect, useRef, useMemo } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function NotificationBell({ onNavigate, className = '' }) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();

  const { user } = useAuth();
  const { t } = useApp() || {};

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const dropdownRef = useRef(null);
  const bellButtonRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        bellButtonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filtered notifications
  const displayedNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter(n => !n.is_read);
    }
    return notifications;
  }, [notifications, activeTab]);

  // Handle Mark All as Read
  const handleMarkAll = async () => {
    if (markingAll || unreadCount === 0) return;
    try {
      setMarkingAll(true);
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  // Handle Mark Single as Read
  const handleMarkSingle = async (e, id) => {
    e.stopPropagation();
    if (markingId) return;
    try {
      setMarkingId(id);
      await markAsRead(id);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    } finally {
      setMarkingId(null);
    }
  };

  // Resolve section based on role and notification type
  const resolveTargetSection = (notification) => {
    const role = (user?.role || '').toLowerCase();
    const type = notification.type;

    if (role === 'customer' || role === 'citizen') {
      switch (type) {
        case 'APPLICATION_UPDATE':
          return 'applications';
        case 'QUEUE_ASSIGNMENT':
          return 'queue';
        case 'ANNOUNCEMENT':
          return 'announcements';
        default:
          return 'dashboard';
      }
    }

    if (role === 'employee') {
      switch (type) {
        case 'APPLICATION_UPDATE':
          return 'Search Applications';
        case 'QUEUE_ASSIGNMENT':
          return 'My Queue';
        case 'MAINTENANCE_ASSIGNMENT':
          return 'Maintenance Report';
        case 'ANNOUNCEMENT':
          return 'Announcements';
        default:
          return 'Dashboard';
      }
    }

    if (role === 'technician' || role === 'ict_staff') {
      switch (type) {
        case 'MAINTENANCE_ASSIGNMENT':
          return 'My Tasks';
        case 'ANNOUNCEMENT':
          return 'Announcements';
        default:
          return 'Dashboard';
      }
    }

    if (role === 'institution_manager') {
      switch (type) {
        case 'APPLICATION_UPDATE':
          return 'Applications';
        case 'QUEUE_ASSIGNMENT':
          return 'Queue Management';
        case 'MAINTENANCE_ASSIGNMENT':
          return 'Maintenance';
        case 'ANNOUNCEMENT':
          return 'Announcements';
        default:
          return 'Dashboard';
      }
    }

    if (role === 'mesob_manager') {
      if (type === 'SYSTEM_MESSAGE' || notification.related_entity_type === 'approval_request') {
        return t?.central_approvals || 'Central Approvals';
      }
      switch (type) {
        case 'APPLICATION_UPDATE':
          return t?.application_monitoring || 'Application Monitoring';
        case 'QUEUE_ASSIGNMENT':
          return t?.queue_monitoring || 'Queue Monitoring';
        case 'MAINTENANCE_ASSIGNMENT':
          return t?.maintenance_oversight || 'Maintenance Oversight';
        case 'ANNOUNCEMENT':
          return t?.announcements || 'Announcements';
        default:
          return t?.dashboard || 'Dashboard';
      }
    }

    if (role === 'super_admin') {
      if (type === 'SYSTEM_MESSAGE' || notification.related_entity_type === 'approval_decision') {
        return t?.central_approvals || 'Central Approvals';
      }
      switch (type) {
        case 'ANNOUNCEMENT':
          return t?.announcements || 'Announcements';
        case 'SYSTEM_MESSAGE':
          return t?.central_approvals || 'Central Approvals';
        default:
          return t?.dashboard || 'Dashboard';
      }
    }

    return null;
  };

  // Handle clicking a notification
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);

    if (onNavigate) {
      const target = resolveTargetSection(notification);
      if (target) {
        onNavigate(target, notification);
      }
    }
  };

  // Render icon based on notification type
  const renderTypeIcon = (type) => {
    switch (type) {
      case 'APPLICATION_UPDATE':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'QUEUE_ASSIGNMENT':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'MAINTENANCE_ASSIGNMENT':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
        );
      case 'ANNOUNCEMENT':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
        );
      case 'SYSTEM_MESSAGE':
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  // Format relative timestamp
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 45) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Bell Button */}
      <button
        ref={bellButtonRef}
        type="button"
        id="mesob-notification-bell"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Notifications, ${unreadCount} unread`}
        className={`relative p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-[#314ea1]/30 ${
          isOpen ? 'bg-slate-100 text-[#314ea1]' : ''
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 transition-transform duration-200 group-hover:scale-105"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span
            id="notification-unread-badge"
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white shadow-sm animate-in fade-in zoom-in duration-150"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          role="region"
          aria-label="Notification panel"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={refreshNotifications}
                title="Refresh notifications"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                aria-label="Refresh notifications"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 ${loading ? 'animate-spin text-[#314ea1]' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  disabled={markingAll}
                  className="text-xs font-medium text-[#314ea1] hover:text-[#1e3a8a] hover:underline px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                >
                  {markingAll ? 'Marking...' : 'Mark all read'}
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 bg-white px-4 pt-2 gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`pb-2.5 transition-colors border-b-2 ${
                activeTab === 'all'
                  ? 'border-[#314ea1] text-[#314ea1]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`pb-2.5 transition-colors border-b-2 ${
                activeTab === 'unread'
                  ? 'border-[#314ea1] text-[#314ea1]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border-b border-rose-100 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={refreshNotifications}
                className="underline font-semibold ml-2 hover:text-rose-900"
              >
                Retry
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 overscroll-contain">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-[#314ea1] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-medium">Loading notifications...</p>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {activeTab === 'unread' ? 'All caught up!' : 'No notifications'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {activeTab === 'unread'
                    ? 'You have no unread notifications right now.'
                    : 'System notifications and updates will appear here.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative group ${
                    item.is_read
                      ? 'bg-white hover:bg-slate-50/80 text-slate-700'
                      : 'bg-blue-50/40 hover:bg-blue-50/80 text-slate-900'
                  }`}
                >
                  {/* Type Icon */}
                  {renderTypeIcon(item.type)}

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs truncate ${item.is_read ? 'font-medium text-slate-800' : 'font-bold text-slate-900'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap shrink-0">
                        {formatTime(item.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {/* Read / Unread Indicator & Actions */}
                  <div className="flex items-center shrink-0 self-center">
                    {!item.is_read ? (
                      <button
                        type="button"
                        onClick={(e) => handleMarkSingle(e, item.id)}
                        disabled={markingId === item.id}
                        title="Mark as read"
                        className="w-5 h-5 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-600 group-hover:scale-125 transition-transform" />
                      </button>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-transparent" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 text-center text-[11px] text-slate-600">
            Hawassa MESOB Notifications
          </div>
        </div>
      )}
    </div>
  );
}
