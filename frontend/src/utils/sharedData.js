/**
 * Shared Data Management for Maintenance Reports, Tasks, and Announcements
 * Uses localStorage for frontend persistence until backend integration
 */

// ─── MAINTENANCE REPORTS ──────────────────────────────────────────
const MAINTENANCE_REPORTS_KEY = 'mesob_maintenance_reports';
const MAINTENANCE_TASKS_KEY = 'mesob_maintenance_tasks';
const ANNOUNCEMENTS_KEY = 'mesob_announcements';
const APPLICATIONS_KEY = 'mesob_citizen_applications';
const INSTITUTIONS_KEY = 'mesob_institutions';

// Initialize default data if not exists
function initializeData() {
  if (!localStorage.getItem(MAINTENANCE_REPORTS_KEY)) {
    localStorage.setItem(MAINTENANCE_REPORTS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(MAINTENANCE_TASKS_KEY)) {
    localStorage.setItem(MAINTENANCE_TASKS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(APPLICATIONS_KEY)) {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(INSTITUTIONS_KEY)) {
    localStorage.setItem(INSTITUTIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(ANNOUNCEMENTS_KEY)) {
    const defaultAnnouncements = [
      { id: 1, title: 'Scheduled System Maintenance – Sat Aug 16', body: 'System maintenance is planned for Aug 16, 2026 from 8–11 PM. All staff should complete pending operations before the window.', date: 'Aug 14, 2026', read: false, author: 'System Admin', scope: 'system', institution: null },
      { id: 2, title: 'System Update v2.4.1 Released', body: 'System update v2.4.1 has been deployed. Changes include improved queue processing performance and security patches.', date: 'Aug 10, 2026', read: false, author: 'System Admin', scope: 'system', institution: null },
      { id: 3, title: 'New Institution Onboarding – Labor & Skills', body: 'Labor & Skills Bureau has been onboarded to Hawassa MESOB. Institution Manager has been assigned. Services are now active.', date: 'Aug 05, 2026', read: true, author: 'System Admin', scope: 'system', institution: null },
    ];
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(defaultAnnouncements));
  }
}

initializeData();

// ─── MAINTENANCE REPORTS API ──────────────────────────────────────
export function getMaintenanceReports(filters = {}) {
  try {
    const reports = JSON.parse(localStorage.getItem(MAINTENANCE_REPORTS_KEY) || '[]');
    
    let filtered = reports;
    
    if (filters.reportedBy) {
      filtered = filtered.filter(r => r.reportedBy === filters.reportedBy);
    }
    
    if (filters.institution) {
      filtered = filtered.filter(r => r.institution === filters.institution);
    }
    
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    
    return filtered.sort((a, b) => b.id - a.id);
  } catch {
    return [];
  }
}

export function createMaintenanceReport(report) {
  try {
    const reports = JSON.parse(localStorage.getItem(MAINTENANCE_REPORTS_KEY) || '[]');
    const newReport = {
      id: `MR-${Date.now().toString().slice(-6)}`,
      ...report,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Submitted',
      assignedTo: null,
      taskId: null,
      createdAt: Date.now(),
    };
    reports.push(newReport);
    localStorage.setItem(MAINTENANCE_REPORTS_KEY, JSON.stringify(reports));
    return { success: true, report: newReport };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export function updateMaintenanceReport(id, updates) {
  try {
    const reports = JSON.parse(localStorage.getItem(MAINTENANCE_REPORTS_KEY) || '[]');
    const index = reports.findIndex(r => r.id === id);
    if (index === -1) return { success: false, message: 'Report not found' };
    
    reports[index] = { ...reports[index], ...updates };
    localStorage.setItem(MAINTENANCE_REPORTS_KEY, JSON.stringify(reports));
    return { success: true, report: reports[index] };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ─── MAINTENANCE TASKS API ────────────────────────────────────────
export function getMaintenanceTasks(filters = {}) {
  try {
    const tasks = JSON.parse(localStorage.getItem(MAINTENANCE_TASKS_KEY) || '[]');
    
    let filtered = tasks;
    
    if (filters.assignedTo) {
      filtered = filtered.filter(t => t.assignedTo === filters.assignedTo);
    }
    
    if (filters.institution) {
      filtered = filtered.filter(t => t.institution === filters.institution);
    }
    
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    
    return filtered.sort((a, b) => b.id - a.id);
  } catch {
    return [];
  }
}

export function createMaintenanceTask(task) {
  try {
    const tasks = JSON.parse(localStorage.getItem(MAINTENANCE_TASKS_KEY) || '[]');
    const newTask = {
      id: `TASK-${Date.now().toString().slice(-6)}`,
      ...task,
      assignedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Assigned',
      report: null,
      createdAt: Date.now(),
    };
    tasks.push(newTask);
    localStorage.setItem(MAINTENANCE_TASKS_KEY, JSON.stringify(tasks));
    
    // Update related maintenance report if exists
    if (task.reportId) {
      updateMaintenanceReport(task.reportId, {
        status: 'Assigned',
        assignedTo: task.assignedTo,
        taskId: newTask.id,
      });
    }
    
    return { success: true, task: newTask };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export function updateMaintenanceTask(id, updates) {
  try {
    const tasks = JSON.parse(localStorage.getItem(MAINTENANCE_TASKS_KEY) || '[]');
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return { success: false, message: 'Task not found' };
    
    tasks[index] = { ...tasks[index], ...updates };
    localStorage.setItem(MAINTENANCE_TASKS_KEY, JSON.stringify(tasks));
    
    // Update related maintenance report if exists
    if (tasks[index].reportId) {
      const statusMap = {
        'Assigned': 'Assigned',
        'In Progress': 'In Progress',
        'Completed': 'Completed',
      };
      updateMaintenanceReport(tasks[index].reportId, {
        status: statusMap[updates.status] || tasks[index].status,
      });
    }
    
    return { success: true, task: tasks[index] };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ─── ANNOUNCEMENTS API ────────────────────────────────────────────
export function getAnnouncements(filters = {}) {
  try {
    const announcements = JSON.parse(localStorage.getItem(ANNOUNCEMENTS_KEY) || '[]');
    
    let filtered = announcements;
    
    if (filters.scope) {
      filtered = filtered.filter(a => {
        if (filters.scope === 'system') return a.scope === 'system';
        if (filters.scope === 'mesob') return a.scope === 'mesob';
        if (filters.scope === 'institution') {
          return a.scope === 'institution' && a.institution === filters.institution;
        }
        return true;
      });
    }
    
    if (filters.institution && filters.scope !== 'institution') {
      // Show system + mesob + institution-specific announcements
      filtered = filtered.filter(a => 
        a.scope === 'system' || 
        a.scope === 'mesob' || 
        (a.scope === 'institution' && a.institution === filters.institution)
      );
    }
    
    return filtered.sort((a, b) => b.id - a.id);
  } catch {
    return [];
  }
}

export function createAnnouncement(announcement) {
  try {
    const announcements = JSON.parse(localStorage.getItem(ANNOUNCEMENTS_KEY) || '[]');
    const newAnnouncement = {
      id: Date.now(),
      ...announcement,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      read: false,
      createdAt: Date.now(),
    };
    announcements.push(newAnnouncement);
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
    return { success: true, announcement: newAnnouncement };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export function markAnnouncementRead(id) {
  try {
    const announcements = JSON.parse(localStorage.getItem(ANNOUNCEMENTS_KEY) || '[]');
    const index = announcements.findIndex(a => a.id === id);
    if (index !== -1) {
      announcements[index].read = true;
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ─── CITIZEN APPLICATIONS API ─────────────────────────────────────
export function getApplications(filters = {}) {
  try {
    const applications = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
    
    let filtered = applications;
    
    if (filters.citizenEmail) {
      filtered = filtered.filter(app => app.citizenEmail === filters.citizenEmail);
    }
    
    if (filters.status) {
      filtered = filtered.filter(app => app.status === filters.status);
    }
    
    if (filters.institution) {
      filtered = filtered.filter(app => app.institution === filters.institution);
    }
    
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function createApplication(application) {
  try {
    const applications = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
    const applicationId = `APP-${Date.now().toString().slice(-6)}`;
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const newApplication = {
      id: applicationId,
      referenceNumber: applicationId,
      ...application,
      status: 'Submitted',
      submittedDate: currentDate,
      lastUpdated: currentDate,
      createdAt: Date.now(),
    };
    
    applications.push(newApplication);
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
    return { success: true, application: newApplication };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export function updateApplication(id, updates) {
  try {
    const applications = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
    const index = applications.findIndex(app => app.id === id);
    if (index === -1) return { success: false, message: 'Application not found' };
    
    applications[index] = {
      ...applications[index],
      ...updates,
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
    return { success: true, application: applications[index] };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export function getApplication(id) {
  try {
    const applications = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
    const application = applications.find(app => app.id === id);
    return application || null;
  } catch {
    return null;
  }
}


// ─── INSTITUTIONS API ─────────────────────────────────────────────
export function getInstitutions(filters = {}) {
  try {
    const institutions = JSON.parse(localStorage.getItem(INSTITUTIONS_KEY) || '[]');
    
    let filtered = institutions;
    
    if (filters.status) {
      filtered = filtered.filter(inst => inst.status === filters.status);
    }
    
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(inst => 
        inst.name_en.toLowerCase().includes(q) ||
        inst.name_am.toLowerCase().includes(q)
      );
    }
    
    return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch {
    return [];
  }
}

export function createInstitution(institution) {
  try {
    const institutions = JSON.parse(localStorage.getItem(INSTITUTIONS_KEY) || '[]');
    
    // Validate required fields
    if (!institution.name_en || !institution.image || !institution.officialUrl) {
      return { success: false, message: 'Required fields missing' };
    }
    
    // Validate services
    if (!institution.services || institution.services.length === 0) {
      return { success: false, message: 'At least one service is required' };
    }
    
    // Validate each service has required fields
    for (const service of institution.services) {
      if (!service.title_en || !service.time || !service.fee) {
        return { success: false, message: 'All service fields are required' };
      }
      if (!service.docs_en || service.docs_en.length === 0) {
        return { success: false, message: 'Each service must have at least one required document' };
      }
    }
    
    const newInstitution = {
      id: institution.id || `inst-${Date.now()}`,
      ...institution,
      status: institution.status || 'Active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    institutions.push(newInstitution);
    localStorage.setItem(INSTITUTIONS_KEY, JSON.stringify(institutions));
    return { success: true, institution: newInstitution };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export function updateInstitution(id, updates) {
  try {
    const institutions = JSON.parse(localStorage.getItem(INSTITUTIONS_KEY) || '[]');
    const index = institutions.findIndex(inst => inst.id === id);
    
    if (index === -1) {
      return { success: false, message: 'Institution not found' };
    }
    
    // Validate if updating services
    if (updates.services) {
      if (updates.services.length === 0) {
        return { success: false, message: 'At least one service is required' };
      }
      
      for (const service of updates.services) {
        if (!service.title_en || !service.time || !service.fee) {
          return { success: false, message: 'All service fields are required' };
        }
        if (!service.docs_en || service.docs_en.length === 0) {
          return { success: false, message: 'Each service must have at least one required document' };
        }
      }
    }
    
    institutions[index] = {
      ...institutions[index],
      ...updates,
      updatedAt: Date.now(),
    };
    
    localStorage.setItem(INSTITUTIONS_KEY, JSON.stringify(institutions));
    return { success: true, institution: institutions[index] };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export function deleteInstitution(id) {
  try {
    const institutions = JSON.parse(localStorage.getItem(INSTITUTIONS_KEY) || '[]');
    const filtered = institutions.filter(inst => inst.id !== id);
    
    if (filtered.length === institutions.length) {
      return { success: false, message: 'Institution not found' };
    }
    
    localStorage.setItem(INSTITUTIONS_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export function getInstitution(id) {
  try {
    const institutions = JSON.parse(localStorage.getItem(INSTITUTIONS_KEY) || '[]');
    const institution = institutions.find(inst => inst.id === id);
    return institution || null;
  } catch {
    return null;
  }
}

// Add service to institution
export function addServiceToInstitution(institutionId, service) {
  try {
    const institutions = JSON.parse(localStorage.getItem(INSTITUTIONS_KEY) || '[]');
    const index = institutions.findIndex(inst => inst.id === institutionId);
    
    if (index === -1) {
      return { success: false, message: 'Institution not found' };
    }
    
    // Validate service
    if (!service.title_en || !service.time || !service.fee) {
      return { success: false, message: 'All service fields are required' };
    }
    if (!service.docs_en || service.docs_en.length === 0) {
      return { success: false, message: 'Service must have at least one required document' };
    }
    
    const serviceWithId = {
      ...service,
      id: `svc-${Date.now()}`,
      createdAt: Date.now(),
    };
    
    institutions[index].services = institutions[index].services || [];
    institutions[index].services.push(serviceWithId);
    institutions[index].updatedAt = Date.now();
    
    localStorage.setItem(INSTITUTIONS_KEY, JSON.stringify(institutions));
    return { success: true, service: serviceWithId };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Update service in institution
export function updateServiceInInstitution(institutionId, serviceIndex, updates) {
  try {
    const institutions = JSON.parse(localStorage.getItem(INSTITUTIONS_KEY) || '[]');
    const index = institutions.findIndex(inst => inst.id === institutionId);
    
    if (index === -1) {
      return { success: false, message: 'Institution not found' };
    }
    
    if (!institutions[index].services || !institutions[index].services[serviceIndex]) {
      return { success: false, message: 'Service not found' };
    }
    
    // Validate updates
    const updatedService = { ...institutions[index].services[serviceIndex], ...updates };
    if (!updatedService.title_en || !updatedService.time || !updatedService.fee) {
      return { success: false, message: 'All service fields are required' };
    }
    if (!updatedService.docs_en || updatedService.docs_en.length === 0) {
      return { success: false, message: 'Service must have at least one required document' };
    }
    
    institutions[index].services[serviceIndex] = updatedService;
    institutions[index].updatedAt = Date.now();
    
    localStorage.setItem(INSTITUTIONS_KEY, JSON.stringify(institutions));
    return { success: true, service: updatedService };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Delete service from institution
export function deleteServiceFromInstitution(institutionId, serviceIndex) {
  try {
    const institutions = JSON.parse(localStorage.getItem(INSTITUTIONS_KEY) || '[]');
    const index = institutions.findIndex(inst => inst.id === institutionId);
    
    if (index === -1) {
      return { success: false, message: 'Institution not found' };
    }
    
    if (!institutions[index].services || institutions[index].services.length <= serviceIndex) {
      return { success: false, message: 'Service not found' };
    }
    
    // Prevent deletion if it's the last service
    if (institutions[index].services.length === 1) {
      return { success: false, message: 'Cannot delete the last service. Institution must have at least one service.' };
    }
    
    institutions[index].services.splice(serviceIndex, 1);
    institutions[index].updatedAt = Date.now();
    
    localStorage.setItem(INSTITUTIONS_KEY, JSON.stringify(institutions));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}


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
