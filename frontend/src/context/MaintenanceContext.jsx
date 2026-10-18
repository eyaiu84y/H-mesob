/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const MaintenanceContext = createContext(null);

// ─── Status mapping: Backend → Frontend ───────────────────────────
function mapBackendStatusToFrontend(backendStatus) {
  const mapping = {
    'REPORTED': 'Submitted',
    'APPROVED': 'Approved',
    'ACKNOWLEDGED': 'Approved',
    'ASSIGNED': 'Assigned',
    'IN_PROGRESS': 'In Progress',
    'WAITING_PARTS': 'Waiting Parts',
    'ON_HOLD': 'On Hold',
    'RESOLVED': 'Resolved',
    'COMPLETED': 'Completed',
    'CLOSED': 'Closed',
    'REJECTED': 'Rejected',
    'CANCELLED': 'Cancelled',
  };
  return mapping[backendStatus] || backendStatus || 'Submitted';
}

// ─── Transform backend report to frontend format ───────────────────
function transformReport(backendReport) {
  return {
    id: backendReport.id,
    reportNumber: backendReport.report_number,
    report_number: backendReport.report_number,
    problemType: backendReport.title,
    title: backendReport.title,
    description: backendReport.description,
    location: backendReport.location,
    officeNumber: backendReport.equipment_info ? backendReport.equipment_info.replace(/^Office:\s*/i, "") : "",
    category: backendReport.category,
    priority: backendReport.priority,
    status: mapBackendStatusToFrontend(backendReport.status),
    backendStatus: backendReport.status, // Keep original for API calls
    institution: backendReport.institutions?.name_en || 'Unknown Institution',
    institutionName: backendReport.institutions?.name_en || 'Unknown Institution',
    institutionName_am: backendReport.institutions?.name_am,
    reportedBy: backendReport.reporter?.full_name || 'Unknown',
    reportedByPhone: backendReport.reporter?.phone,
    assignedTo: backendReport.assigned_user?.full_name,
    reportedAtTimestamp: backendReport.created_at,
    created_at: backendReport.created_at,
    createdAt: backendReport.created_at,
    reportedAt: backendReport.created_at ? new Date(backendReport.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Africa/Nairobi", timeZoneName: "short" }) : "N/A",
    date: backendReport.created_at ? new Date(backendReport.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
    resolvedAt: backendReport.resolved_at,
    resolved_at: backendReport.resolved_at,
    resolutionNotes: backendReport.resolution_notes,
    metadata: backendReport.metadata || {},
    approval: backendReport.metadata?.approval,
    closure: backendReport.metadata?.closure,
    reopened: backendReport.metadata?.reopened,
    attachments: backendReport.maintenance_attachments || [],
    photo: (backendReport.maintenance_attachments || []).find(a => a.file_type?.startsWith("image/"))?.file_url || "",
    photoPreview: (backendReport.maintenance_attachments || []).find(a => a.file_type?.startsWith("image/"))?.file_url || "",
    // Keep backend IDs for API calls
    institutionId: backendReport.institutions?.id || backendReport.institution_id,
    reportedById: backendReport.reporter?.id || backendReport.reported_by,
    assignedToId: backendReport.assigned_to || backendReport.assigned_user?.id,
  };
}

// ─── Provider ──────────────────────────────────────────────────────
export function MaintenanceProvider({ children }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Get current user

  // ── Fetch maintenance reports from backend ─────────────────────
  const fetchReports = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.institutionId) params.append('institutionId', filters.institutionId);

      const queryString = params.toString();
      const url = queryString ? `/maintenance/reports?${queryString}` : '/maintenance/reports';

      const response = await api.get(url);

      if (response.success && response.data) {
        const transformed = response.data.map(transformReport);
        setReports(transformed);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error('Failed to fetch maintenance reports:', err);
      setError(err.response?.data?.message || 'Failed to fetch maintenance reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Automatically load maintenance reports ────────────────────
  // Skip loading for Customers - they don't have access to maintenance reports
  useEffect(() => {
    // Check if user has permission to view maintenance reports
    const userRole = user?.role?.toUpperCase();
    const canViewMaintenance = ['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF'].includes(userRole);
    
    if (!canViewMaintenance) {
      console.log('=== MAINTENANCE CONTEXT: Skipping auto-load for role:', user?.role, '(no permission) ===');
      return; // Customers and other roles don't have access
    }

    let mounted = true;
    const loadReports = async () => {
      try {
        console.log('=== MAINTENANCE CONTEXT: AUTO-LOADING REPORTS for role:', user?.role, '===');
        setLoading(true);
        setError(null);
        const response = await api.get('/maintenance/reports');
        console.log('Maintenance reports response:', response);
        if (mounted) {
          // api.get() returns {success, data} directly
          if (response.success && response.data) {
            const transformed = response.data.map(transformReport);
            console.log('Transformed maintenance reports:', transformed.length);
            setReports(transformed);
          } else {
            console.log('No reports or failed response');
            setReports([]);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Failed to fetch maintenance reports:', err);
          setError(err.response?.data?.message || 'Failed to fetch maintenance reports');
          setReports([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadReports();
    return () => { mounted = false; };
  }, [user?.role]); // Re-run when user role changes

  // ── Create maintenance report ──────────────────────────────────
  const createReport = useCallback(async (institutionId, problemType, description, location, officeNumber, priority = 'NORMAL', category = 'General', attachments = []) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/maintenance/reports', {
        institutionId,
        problemType,
        description,
        location,
        officeNumber,
        priority,
        category,
        attachments,
      });

      if (response.success && response.data) {
        const newReport = transformReport(response.data);

        // Add to local state
        setReports(prev => [newReport, ...prev]);

        // Refresh from backend to get complete data
        await fetchReports();

        return { success: true, report: newReport };
      } else {
        throw new Error(response.message || 'Failed to create maintenance report');
      }
    } catch (err) {
      console.error('Failed to create maintenance report:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create maintenance report';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchReports]);

  // ── Get report by ID ───────────────────────────────────────────
  const getReport = useCallback(async (reportId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/maintenance/reports/${reportId}`);

      if (response.success && response.data) {
        return transformReport(response.data);
      }
      return null;
    } catch (err) {
      console.error('Failed to get maintenance report:', err);
      setError(err.response?.data?.message || 'Failed to get maintenance report');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Assign report to Technician ────────────────────────────────
  const assignReport = useCallback(async (reportId, technicianId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/maintenance/reports/${reportId}/assign`, {
        technicianId,
        ictStaffId: technicianId // backwards-compatibility
      });

      if (response.success) {
        setReports(prev =>
          prev.map(report =>
            report.id === reportId
              ? { ...report, status: 'Assigned', backendStatus: 'ASSIGNED', assignedToId: technicianId }
              : report
          )
        );
        await fetchReports();
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to assign maintenance report');
      }
    } catch (err) {
      console.error('Failed to assign maintenance report:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to assign maintenance report';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchReports]);

  // ── Approve report (Institution Manager) ───────────────────────
  const approveReport = useCallback(async (reportId, notes = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.patch(`/maintenance/reports/${reportId}/approve`, { notes });

      if (response.success) {
        setReports(prev =>
          prev.map(report =>
            report.id === reportId
              ? { ...report, status: 'Approved', backendStatus: 'APPROVED' }
              : report
          )
        );
        await fetchReports();
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to approve maintenance report');
      }
    } catch (err) {
      console.error('Failed to approve maintenance report:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to approve report';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchReports]);

  // ── Reject report with mandatory reason (Institution Manager) ──
  const rejectReport = useCallback(async (reportId, reason) => {
    try {
      if (!reason || !reason.trim()) {
        throw new Error('A mandatory rejection reason is required.');
      }
      setLoading(true);
      setError(null);

      const response = await api.patch(`/maintenance/reports/${reportId}/reject`, { reason: reason.trim() });

      if (response.success) {
        setReports(prev =>
          prev.map(report =>
            report.id === reportId
              ? { ...report, status: 'Rejected', backendStatus: 'REJECTED' }
              : report
          )
        );
        await fetchReports();
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to reject maintenance report');
      }
    } catch (err) {
      console.error('Failed to reject maintenance report:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reject report';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchReports]);

  // ── Close report / Verify completion (Institution Manager) ─────
  const closeReport = useCallback(async (reportId, notes = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.patch(`/maintenance/reports/${reportId}/close`, { notes });

      if (response.success) {
        setReports(prev =>
          prev.map(report =>
            report.id === reportId
              ? { ...report, status: 'Closed', backendStatus: 'CLOSED' }
              : report
          )
        );
        await fetchReports();
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to close maintenance report');
      }
    } catch (err) {
      console.error('Failed to close maintenance report:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to close report';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchReports]);

  // ── Reopen / Return report to technician (Institution Manager) ──
  const reopenReport = useCallback(async (reportId, reason) => {
    try {
      if (!reason || !reason.trim()) {
        throw new Error('A return/reopen reason is required.');
      }
      setLoading(true);
      setError(null);

      const response = await api.patch(`/maintenance/reports/${reportId}/reopen`, { reason: reason.trim() });

      if (response.success) {
        setReports(prev =>
          prev.map(report =>
            report.id === reportId
              ? { ...report, status: 'In Progress', backendStatus: 'IN_PROGRESS' }
              : report
          )
        );
        await fetchReports();
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to return maintenance report');
      }
    } catch (err) {
      console.error('Failed to return maintenance report:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to return report';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchReports]);

  // ── Resolve report directly (Technician) ───────────────────────
  const resolveReportDirect = useCallback(async (reportId, resolutionNotes) => {
    try {
      if (!resolutionNotes || !resolutionNotes.trim()) {
        throw new Error('Resolution notes are required.');
      }
      setLoading(true);
      setError(null);

      const response = await api.patch(`/maintenance/reports/${reportId}/resolve`, {
        resolutionNotes: resolutionNotes.trim()
      });

      if (response.success) {
        setReports(prev =>
          prev.map(report =>
            report.id === reportId
              ? { ...report, status: 'Resolved', backendStatus: 'RESOLVED', resolutionNotes }
              : report
          )
        );
        await fetchReports();
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to resolve maintenance report');
      }
    } catch (err) {
      console.error('Failed to resolve maintenance report:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to resolve report';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchReports]);

  // ── Update report status directly (Technician) ─────────────────
  const updateReportStatusDirect = useCallback(async (reportId, status) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.patch(`/maintenance/reports/${reportId}/status`, { status });

      if (response.success) {
        setReports(prev =>
          prev.map(report =>
            report.id === reportId
              ? { ...report, status: mapBackendStatusToFrontend(status), backendStatus: status }
              : report
          )
        );
        await fetchReports();
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to update report status');
      }
    } catch (err) {
      console.error('Failed to update report status:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update report status';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchReports]);

  // ── Filter reports by status ───────────────────────────────────
  const getReportsByStatus = useCallback((status) => {
    if (!status) return reports;
    return reports.filter(report => report.status === status || report.backendStatus === status);
  }, [reports]);

  // ── Get my reports (for employees) ─────────────────────────────
  const getMyReports = useCallback((userId) => {
    return reports.filter(report => report.reportedById === userId);
  }, [reports]);

  return (
    <MaintenanceContext.Provider
      value={{
        reports,
        loading,
        error,
        createReport,
        getReport,
        assignReport,
        approveReport,
        rejectReport,
        closeReport,
        reopenReport,
        resolveReportDirect,
        updateReportStatusDirect,
        getReportsByStatus,
        getMyReports,
        refreshReports: fetchReports,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const ctx = useContext(MaintenanceContext);
  if (!ctx) throw new Error('useMaintenance must be used inside MaintenanceProvider');
  return ctx;
}
