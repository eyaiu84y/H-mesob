/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const ApplicationContext = createContext(null);

// ─── Status mapping: Backend → Frontend ───────────────────────────
function mapBackendStatusToFrontend(backendStatus) {
  const mapping = {
    'SUBMITTED': 'Submitted',
    'UNDER_REVIEW': 'Under Review',
    'PENDING_DOCUMENTS': 'Pending Documents',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
  };
  return mapping[backendStatus] || 'Submitted';
}

// ─── Status mapping: Frontend → Backend ───────────────────────────
function mapFrontendStatusToBackend(frontendStatus) {
  const mapping = {
    'Submitted': 'SUBMITTED',
    'Under Review': 'UNDER_REVIEW',
    'Pending Documents': 'PENDING_DOCUMENTS',
    'Approved': 'APPROVED',
    'Rejected': 'REJECTED',
    'Completed': 'COMPLETED',
    'Cancelled': 'CANCELLED',
  };
  return mapping[frontendStatus] || 'SUBMITTED';
}

// ─── Transform backend application to frontend format ──────────────
function transformApplication(backendApp) {
  return {
    id: backendApp.id,
    applicationNumber: backendApp.application_number,
    referenceNumber: backendApp.application_number, // Same as application_number
    status: mapBackendStatusToFrontend(backendApp.status),
    submittedDate: backendApp.submitted_at ? new Date(backendApp.submitted_at).toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true,
      timeZone: 'Africa/Addis_Ababa'
    }) : 'N/A',
    lastUpdated: backendApp.updated_at ? new Date(backendApp.updated_at).toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true,
      timeZone: 'Africa/Addis_Ababa'
    }) : 'N/A',
    // Raw date fields for filtering
    submitted_at: backendApp.submitted_at,
    submittedAt: backendApp.submitted_at,
    updated_at: backendApp.updated_at,
    created_at: backendApp.submitted_at, // Alias for compatibility
    createdAt: backendApp.submitted_at,
    completed_at: backendApp.completed_at,
    application_number: backendApp.application_number,
    service: backendApp.services?.title_en || backendApp.services?.name || backendApp.application_data?.serviceName || 'Unknown Service',
    serviceName: backendApp.services?.title_en || backendApp.services?.name || backendApp.application_data?.serviceName || 'Unknown Service',
    serviceName_am: backendApp.services?.title_am || backendApp.services?.name_am,
    institution: backendApp.institutions?.name_en || backendApp.application_data?.institutionName || 'Unknown Institution',
    institutionName: backendApp.institutions?.name_en || backendApp.application_data?.institutionName || 'Unknown Institution',

    institutionName_am: backendApp.institutions?.name_am,
    customerName: backendApp.users?.full_name,
    customerEmail: backendApp.users?.email,
    customerPhone: backendApp.users?.phone,
    customerId: backendApp.customer_id || backendApp.citizen_id,
    citizenName: backendApp.users?.full_name,
    citizenEmail: backendApp.users?.email,
    citizenPhone: backendApp.users?.phone,
    assignedTo: backendApp.assigned_to,
    assignedEmployee: backendApp.assigned_employee?.full_name,
    reviewedAt: backendApp.reviewed_at,
    completedAt: backendApp.completed_at,
    reviewNotes: backendApp.review_notes,
    applicationData: backendApp.application_data,
    documents: backendApp.documents,
    // Keep backend IDs for API calls
    serviceId: backendApp.services?.id,
    institutionId: backendApp.institutions?.id,
    citizenId: backendApp.customer_id || backendApp.citizen_id,
  };
}

// ─── Provider ──────────────────────────────────────────────────────
export function ApplicationProvider({ children }) {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch applications from backend ────────────────────────────
  const fetchApplications = useCallback(async (filters = {}) => {
    const token = localStorage.getItem('mesob_token');
    if (!token) {
      setApplications([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.status) {
        const backendStatus = mapFrontendStatusToBackend(filters.status);
        params.append('status', backendStatus);
      }
      if (filters.institutionId) params.append('institutionId', filters.institutionId);
      if (filters.assignedToMe) params.append('assignedToMe', 'true');

      const queryString = params.toString();
      const url = queryString ? `/applications?${queryString}` : '/applications';

      const response = await api.get(url);

      // Handle both response formats: { success, data } or direct data array
      if (response && response.success && response.data) {
        const transformed = response.data.map(transformApplication);
        setApplications(transformed);
      } else if (response && Array.isArray(response)) {
        const transformed = response.map(transformApplication);
        setApplications(transformed);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError(err.response?.data?.message || 'Failed to fetch applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Auto-fetch applications on mount and user auth change ───────
  useEffect(() => {
    if (user && localStorage.getItem('mesob_token')) {
      fetchApplications();
    } else {
      setApplications([]);
    }
  }, [user, fetchApplications]);

  // ── Create application ─────────────────────────────────────────
  const createApplication = useCallback(async (serviceId, institutionId, applicationData, documents) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/applications', {
        serviceId,
        institutionId,
        applicationData,
        documents,
      });

      if (!response || response.success === false) {
        const errorMsg = response?.message || 'Failed to create application';
        setError(errorMsg);
        return {
          success: false,
          isDuplicate: response?.isDuplicate || false,
          message: errorMsg,
          existingApplication: response?.existingApplication || null
        };
      }

      // Handle both response formats
      const appData = response?.data?.data || response?.data || response;
      
      if (appData && appData.id) {
        // Transform partial data as fallback
        const partialApp = transformApplication(appData);

        // Fetch complete application data with joined service/institution info
        try {
          // Make direct API call instead of calling getApplication to avoid circular dependency
          const completeResponse = await api.get(`/applications/${appData.id}`);
          const completeData = completeResponse?.data?.data || completeResponse?.data || completeResponse;
          
          if (completeData && completeData.id) {
            const completeApp = transformApplication(completeData);
            setApplications(prev => [completeApp, ...prev]);
            await fetchApplications();
            return { success: true, application: completeApp };
          } else {
            console.warn('Could not fetch complete application data, using partial data');
            setApplications(prev => [partialApp, ...prev]);
            await fetchApplications();
            return { success: true, application: partialApp };
          }
        } catch (fetchError) {
          console.error('Failed to fetch complete application data:', fetchError);
          setApplications(prev => [partialApp, ...prev]);
          await fetchApplications();
          return { success: true, application: partialApp };
        }
      } else {
        throw new Error('Failed to create application');
      }
    } catch (err) {
      console.error('Failed to create application:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create application';
      setError(errorMessage);
      return {
        success: false,
        isDuplicate: err.response?.data?.isDuplicate || err.response?.status === 409 || false,
        message: errorMessage,
        existingApplication: err.response?.data?.existingApplication || null
      };
    } finally {
      setLoading(false);
    }
  }, [fetchApplications]);

  // ── Resubmit application with updated documents ────────────────
  const resubmitApplication = useCallback(async (applicationId, documents, notes = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/applications/${applicationId}/resubmit`, {
        documents,
        notes,
      });

      if (!response || response.success === false) {
        const errorMsg = response?.message || 'Failed to resubmit application';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }

      await fetchApplications();
      return { success: true, application: response.data };
    } catch (err) {
      console.error('Failed to resubmit application:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to resubmit application';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchApplications]);


  // ── Get application by ID ──────────────────────────────────────
  const getApplication = useCallback(async (applicationId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/applications/${applicationId}`);

      // Handle both response formats
      const appData = response?.data?.data || response?.data || response;
      
      if (appData && appData.id) {
        return transformApplication(appData);
      }
      return null;
    } catch (err) {
      console.error('Failed to get application:', err);
      setError(err.response?.data?.message || 'Failed to get application');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Update application status ──────────────────────────────────
  const updateApplicationStatus = useCallback(async (applicationId, newStatus, notes = '') => {
    try {
      setLoading(true);
      setError(null);

      const backendStatus = mapFrontendStatusToBackend(newStatus);

      const response = await api.patch(`/applications/${applicationId}/status`, {
        status: backendStatus,
        notes,
      });

      // Check if update was successful
      const success = response?.success !== false;
      
      if (success) {
        // Update local state
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId
              ? { ...app, status: newStatus, lastUpdated: new Date().toLocaleString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  hour12: true,
                  timeZone: 'Africa/Addis_Ababa'
                }) }
              : app
          )
        );

        // Refresh from backend
        await fetchApplications();

        return { success: true };
      } else {
        throw new Error('Failed to update application status');
      }
    } catch (err) {
      console.error('Failed to update application status:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update application status';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchApplications]);

  // ── Filter applications by status ──────────────────────────────
  const getApplicationsByStatus = useCallback((status) => {
    if (!status) return applications;
    return applications.filter(app => app.status === status);
  }, [applications]);

  // ── Get active applications ────────────────────────────────────
  const getActiveApplications = useCallback(() => {
    return applications.filter(app => 
      app.status === 'Submitted' || app.status === 'Under Review' || app.status === 'Pending Documents'
    );
  }, [applications]);

  // ── Get completed applications ─────────────────────────────────
  const getCompletedApplications = useCallback(() => {
    return applications.filter(app => 
      app.status === 'Approved' || app.status === 'Completed'
    );
  }, [applications]);

  return (
    <ApplicationContext.Provider
      value={{
        applications,
        loading,
        error,
        createApplication,
        resubmitApplication,
        getApplication,
        updateApplicationStatus,
        getApplicationsByStatus,
        getActiveApplications,
        getCompletedApplications,
        refreshApplications: fetchApplications,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplications() {
  const ctx = useContext(ApplicationContext);
  if (!ctx) throw new Error('useApplications must be used inside ApplicationProvider');
  return ctx;
}
