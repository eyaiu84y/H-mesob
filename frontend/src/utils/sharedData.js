/**
 * Notification Helper Functions
 * 
 * These functions help create notification objects for specific events.
 * The NotificationContext handles storage and retrieval via backend API.
 * 
 * NOTE: All business data (maintenance, announcements, applications, institutions, users)
 * is now managed via backend APIs through React contexts:
 * - Maintenance: MaintenanceContext -> /api/maintenance
 * - Announcements: AnnouncementContext -> /api/announcements
 * - Applications: ApplicationContext -> /api/applications
 * - Institutions: ServiceContext -> /api/institutions
 * - Users: AuthContext -> /api/users
 * - Queues: QueueContext -> /api/queues
 * - Notifications: NotificationContext -> /api/notifications
 */

// ─── NOTIFICATION HELPERS ─────────────────────────────────────────
// These functions help create notifications for specific events
// The NotificationContext handles storage and retrieval

export function createMaintenanceReportNotification(report, managerEmail) {
  return {
    type: 'maintenance_report',
    recipientEmail: managerEmail,
    institution: report.institution,
    title: 'New Maintenance Report',
    message: `${report.employeeName} submitted a maintenance report: ${report.problemType}`,
    relatedId: report.id,
  };
}

export function createTaskAssignmentNotification(task, technicianEmail) {
  return {
    type: 'task_assigned',
    recipientEmail: technicianEmail,
    institution: task.institution,
    title: 'New Task Assigned',
    message: `You have been assigned a maintenance task: ${task.title}`,
    relatedId: task.id,
  };
}

export function createTaskCompletionNotification(task, managerEmail) {
  return {
    type: 'task_completed',
    recipientEmail: managerEmail,
    institution: task.institution,
    title: 'Task Completed',
    message: `${task.assignedTo} completed the maintenance task: ${task.title}`,
    relatedId: task.id,
  };
}

export function createAnnouncementNotification(announcement, recipientEmail) {
  return {
    type: 'announcement',
    recipientEmail: recipientEmail,
    institution: announcement.institution || null,
    title: 'New Announcement',
    message: announcement.title,
    relatedId: announcement.id,
  };
}
