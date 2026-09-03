/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';

const MaintenanceContext = createContext(null);

// ─── Status mapping: Backend → Frontend ───────────────────────────
function mapBackendStatusToFrontend(backendStatus) {
  const mapping = {
    'REPORTED': 'Submitted',
    'ASSIGNED': 'Assigned',
    'IN_PROGRESS': 'In Progress',
    'RESOLVED': 'Completed',
    'CANCELLED': 'Cancelled',
  };
  return mapping[backendStatus] || 'Submitted';
}

// ─── Transform backend report to frontend format ───────────────────
function transformReport(backendReport) {
  return {
    id: backendReport.id,
    reportNumber: backendReport.report_number,
    problemType: backendReport.title,
    description: backendReport.description,
    location: backendReport.location,
    officeNumber: backendReport.equipment_info ? backendReport.equipment_info.replace(/^Office:\s*/i, "") : "",
    category: backendReport.category,
    priority: backendReport.priority,
    status: mapBackendStatusToFrontend(backendReport.status),
    backendStatus: backendReport.status, // Keep original for API calls
    institution: backendReport.institutions?.name_en || 'Unknown Institution',
    institutionName_am: backendReport.institutions?.name_am,
    reportedBy: backendReport.reporter?.full_name || 'Unknown',
    reportedByPhone: backendReport.reporter?.phone,
    assignedTo: backendReport.assigned_user?.full_name,
    reportedAtTimestamp: backendReport.created_at,
    reportedAt: backendReport.created_at ? new Date(backendReport.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Africa/Nairobi", timeZoneName: "short" }) : "N/A",
    date: backendReport.created_at ? new Date(backendReport.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
    resolvedAt: backendReport.resolved_at,
    resolutionNotes: backendReport.resolution_notes,
    attachments: backendReport.maintenance_attachments || [],
    photo: (backendReport.maintenance_attachments || []).find(a => a.file_type?.startsWith("image/"))?.file_url || "",
    photoPreview: (backendReport.maintenance_attachments || []).find(a => a.file_type?.startsWith("image/"))?.file_url || "",
    // Keep backend IDs for API calls
    institutionId: backendReport.institutions?.id,
    reportedById: backendReport.reporter?.id,
    assignedToId: backendReport.assigned_user?.id,
  };
}

// ─── Provider ──────────────────────────────────────────────────────
export function MaintenanceProvider({ children }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
  useEffect(() => {
    let mounted = true;
    const loadReports = async () => {
      try {
        console.log('=== MAINTENANCE CONTEXT: AUTO-LOADING REPORTS ===');
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
  }, []);

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

  // ── Assign report to ICT staff ─────────────────────────────────
  const assignReport = useCallback(async (reportId, ictStaffId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/maintenance/reports/${reportId}/assign`, {
        ictStaffId,
      });

      if (response.success) {
        // Update local state
        setReports(prev =>
          prev.map(report =>
            report.id === reportId
              ? { ...report, status: 'Assigned' }
              : report
          )
        );

        // Refresh from backend
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

  // ── Filter reports by status ───────────────────────────────────
  const getReportsByStatus = useCallback((status) => {
    if (!status) return reports;
    return reports.filter(report => report.status === status);
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
