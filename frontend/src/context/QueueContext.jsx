/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const QueueContext = createContext(null);

// ─── Status mapping: Backend → Frontend ───────────────────────────
function mapBackendStatusToFrontend(backendStatus) {
  const mapping = {
    'PENDING': 'waiting',
    'IN_PROGRESS': 'called',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
  };
  return mapping[backendStatus] || 'waiting';
}

// ─── Transform backend queue to frontend format ───────────────────
function transformQueueEntry(backendQueue) {
  const status = mapBackendStatusToFrontend(backendQueue.status);
  
  return {
    id: backendQueue.id,
    institutionId: backendQueue.institution_id,
    institutionName: backendQueue.institutions?.name_en || 'Unknown Institution',
    serviceName: backendQueue.services?.title_en || backendQueue.services?.name || 'Unknown Service',
    token: backendQueue.queue_number,
    status,
    currentServing: 'N/A', // Will be calculated from backend data
    peopleAhead: 0, // Will be calculated from backend data
    createdAt: backendQueue.created_at,
    calledAt: backendQueue.started_at,
    completedAt: backendQueue.completed_at,
    priority: backendQueue.priority,
    assignedTo: backendQueue.assigned_to,
  };
}

// ─── Provider ─────────────────────────────────────────────────────
export function QueueProvider({ children }) {
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch queues from backend ──────────────────────────────────
  const fetchQueues = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== FETCHING QUEUES ===');
      console.log('Filters:', filters);
      
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.institutionId) params.append('institutionId', filters.institutionId);
      if (filters.date) params.append('date', filters.date);
      
      const queryString = params.toString();
      const url = queryString ? `/queues?${queryString}` : '/queues';
      
      console.log('Fetching from:', url);
      
      const response = await api.get(url);
      
      console.log('=== FETCH QUEUES RESPONSE ===');
      console.log('Response:', response);
      console.log('Response.success:', response.success);
      console.log('Response.data:', response.data);
      
      if (response.success && response.data) {
        const transformed = response.data.map(transformQueueEntry);
        console.log('Transformed queues:', transformed);
        setMyTickets(transformed);
      } else {
        console.log('No queues or failed response');
        setMyTickets([]);
      }
    } catch (err) {
      console.error('=== FETCH QUEUES ERROR ===');
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Failed to fetch queues');
      setMyTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Auto-fetch queues on mount ─────────────────────────────────
  useEffect(() => {
    // Fetch queues on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQueues();
  }, [fetchQueues]);

  // ── Register for a queue ───────────────────────────────────────
  const registerForQueue = useCallback(async (institutionUUID, serviceUUID, priority = 'NORMAL') => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== JOIN QUEUE REQUEST ===');
      console.log('Institution ID:', institutionUUID);
      console.log('Service ID:', serviceUUID);
      console.log('Priority:', priority);
      console.log('Token:', localStorage.getItem('mesob_token') ? 'EXISTS' : 'MISSING');

      const response = await api.post('/queues/join', {
        institutionId: institutionUUID,
        serviceId: serviceUUID,
        priority,
      });

      console.log('=== JOIN QUEUE RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response success:', response?.success);
      console.log('Response data:', response?.data);
      console.log('Response message:', response?.message);

      // api.post() returns { success, data, message } directly (not wrapped in response.data)
      if (response.success && response.data) {
        const newTicket = transformQueueEntry(response.data);

        // Add to local state
        setMyTickets(prev => [newTicket, ...prev]);

        // Refresh from backend to get updated queue position
        await fetchQueues();

        return newTicket;
      }

      const errorMsg = response.message || 'Failed to join queue';
      console.error('❌ Queue registration failed:', errorMsg);
      throw new Error(errorMsg);
    } catch (err) {
      console.error('=== JOIN QUEUE ERROR ===');
      console.error('Error object:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);

      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to join queue. Please check your connection and try again.';

      setError(errorMessage);
      throw new Error(errorMessage, { cause: err });
    } finally {
      setLoading(false);
    }
  }, [fetchQueues]);

  // ── Cancel / leave queue ───────────────────────────────────────
  const cancelTicket = useCallback(async (ticketId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.patch(`/queues/${ticketId}/status`, {
        status: 'CANCELLED',
      });

      if (response.success) {
        // Update local state
        setMyTickets(prev =>
          prev.map(t =>
            t.id === ticketId
              ? { ...t, status: 'cancelled', completedAt: new Date().toISOString() }
              : t
          )
        );
        
        // Refresh from backend
        await fetchQueues();
      } else {
        throw new Error(response.message || 'Failed to cancel queue entry');
      }
    } catch (err) {
      console.error('Failed to cancel queue:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to cancel queue';
      setError(errorMessage);
      throw new Error(errorMessage, { cause: err });
    } finally {
      setLoading(false);
    }
  }, [fetchQueues]);

  // ── Get queue status (public endpoint) ─────────────────────────
  const getQueueStatus = useCallback(async (queueId) => {
    try {
      const response = await api.get(`/queues/${queueId}/status`);
      
      if (response.success && response.data) {
        return {
          ...transformQueueEntry(response.data),
          position: response.data.position,
        };
      }
      return null;
    } catch (err) {
      console.error('Failed to get queue status:', err);
      return null;
    }
  }, []);

  // ── Derived helpers ────────────────────────────────────────────
  const getActiveTickets = useCallback(() => {
    return myTickets.filter(t => t.status === 'waiting' || t.status === 'called');
  }, [myTickets]);

  const getTicketHistory = useCallback(() => {
    return myTickets.filter(t => t.status === 'completed' || t.status === 'cancelled');
  }, [myTickets]);

  // ── Employee queue operations ───────────────────────────────────
  const getInstitutionQueue = useCallback((institutionUUID) => {
    return myTickets
      .filter(t => t.institutionId === institutionUUID)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [myTickets]);

  const getCurrentServing = useCallback((institutionUUID) => {
    return myTickets.find(t => 
      t.institutionId === institutionUUID && 
      t.status === 'called'
    );
  }, [myTickets]);

  const callNextToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Backend automatically selects next pending queue entry
      const response = await api.post('/queues/call-next');

      if (response.success) {
        // Refresh queues from backend
        await fetchQueues();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to call next person');
      }
    } catch (err) {
      console.error('Failed to call next:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to call next person';
      setError(errorMessage);
      throw new Error(errorMessage, { cause: err });
    } finally {
      setLoading(false);
    }
  }, [fetchQueues]);

  const completeCurrentToken = useCallback(async (institutionUUID) => {
    try {
      setLoading(true);
      setError(null);

      // Find the current serving ticket
      const currentTicket = myTickets.find(t => 
        t.institutionId === institutionUUID && 
        t.status === 'called'
      );

      if (!currentTicket) {
        throw new Error('No customer currently being served');
      }

      const response = await api.patch(`/queues/${currentTicket.id}/status`, {
        status: 'COMPLETED',
      });

      if (response.success) {
        // Refresh queues from backend
        await fetchQueues();
      } else {
        throw new Error(response.message || 'Failed to complete service');
      }
    } catch (err) {
      console.error('Failed to complete service:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to complete service';
      setError(errorMessage);
      throw new Error(errorMessage, { cause: err });
    } finally {
      setLoading(false);
    }
  }, [myTickets, fetchQueues]);

  return (
    <QueueContext.Provider
      value={{
        myTickets,
        loading,
        error,
        registerForQueue,
        cancelTicket,
        getActiveTickets,
        getTicketHistory,
        getInstitutionQueue,
        getCurrentServing,
        callNextToken,
        completeCurrentToken,
        getQueueStatus,
        refreshQueues: fetchQueues,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error('useQueue must be used inside QueueProvider');
  return ctx;
}
