/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const QueueContext = createContext(null);

// ─── Status mapping: Backend → Frontend ───────────────────────────
function mapBackendStatusToFrontend(backendStatus) {
  const norm = String(backendStatus || '').trim().toUpperCase();
  const mapping = {
    'PENDING': 'waiting',
    'WAITING': 'waiting',
    'CALLED': 'called',
    'IN_PROGRESS': 'called',
    'SERVING': 'called',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
  };
  return mapping[norm] || 'waiting';
}

// ─── Transform backend queue to frontend format ───────────────────
function transformQueueEntry(backendQueue, allQueues = []) {
  const status = mapBackendStatusToFrontend(backendQueue.status);
  
  // Find current serving token: prefer backend calculated value, fallback to memory
  let currentServing = backendQueue.current_serving !== undefined && backendQueue.current_serving !== null
    ? backendQueue.current_serving
    : 'None';

  if ((currentServing === 'None' || currentServing === 'N/A') && allQueues && allQueues.length > 0) {
    const servingEntry = allQueues.find(q => 
      q.institution_id === backendQueue.institution_id &&
      q.service_id === backendQueue.service_id &&
      (String(q.status).toUpperCase() === 'IN_PROGRESS' || String(q.status).toUpperCase() === 'CALLED' || String(q.status).toUpperCase() === 'SERVING')
    );
    currentServing = servingEntry ? servingEntry.queue_number : 'None';
  }
  
  // Calculate people ahead: prefer backend calculated value from actual DB records
  let peopleAhead = backendQueue.people_ahead !== undefined && backendQueue.people_ahead !== null
    ? backendQueue.people_ahead
    : 0;

  if (backendQueue.people_ahead === undefined && status === 'waiting' && allQueues && allQueues.length > 0) {
    peopleAhead = allQueues.filter(q =>
      q.institution_id === backendQueue.institution_id &&
      q.service_id === backendQueue.service_id &&
      q.status === 'PENDING' &&
      q.queue_number < backendQueue.queue_number
    ).length;
  }

  // Estimated wait minutes: prefer backend calculated value (peopleAhead * duration)
  const estimatedWaitMinutes = backendQueue.estimated_wait_minutes !== undefined && backendQueue.estimated_wait_minutes !== null
    ? backendQueue.estimated_wait_minutes
    : (peopleAhead * 6);
  
  const token = backendQueue.queue_number || backendQueue.token || backendQueue.queueNumber || 'N/A';
  const customerName = backendQueue.users?.full_name || backendQueue.customer?.full_name || backendQueue.citizenName || backendQueue.customerName || 'Customer';
  const startedAt = backendQueue.started_at || backendQueue.startedAt || backendQueue.called_at || backendQueue.calledAt || null;
  const completedAt = backendQueue.completed_at || backendQueue.completedAt || null;
  const createdAt = backendQueue.created_at || backendQueue.createdAt || null;
  const windowNumber = String(
    backendQueue.metadata?.window_number ||
    backendQueue.metadata?.window ||
    backendQueue.metadata?.counter_number ||
    backendQueue.metadata?.counter ||
    backendQueue.window_number ||
    backendQueue.counter_number ||
    '1'
  );
  const counterNumber = windowNumber;

  return {
    id: backendQueue.id,
    institutionId: backendQueue.institution_id || backendQueue.institutionId,
    serviceId: backendQueue.service_id || backendQueue.serviceId, // FIXED: Added serviceId for feedback
    institutionName: backendQueue.institutions?.name_en || backendQueue.institutionName || 'Unknown Institution',
    serviceName: backendQueue.services?.title_en || backendQueue.services?.name || backendQueue.serviceName || 'Unknown Service',
    token,
    ticketNumber: token,
    queueNumber: token,
    queue_number: token,
    windowNumber,
    counterNumber,
    window: windowNumber,
    counter: counterNumber,
    status,
    rawStatus: backendQueue.status,
    currentServing,
    peopleAhead,
    estimatedWaitMinutes,
    queueReadiness: backendQueue.queue_readiness || (status === 'called' ? 'CALLED' : (peopleAhead > 0 ? 'WAITING' : 'READY_TO_CALL')),
    createdAt,
    created_at: createdAt,
    calledAt: startedAt,
    called_at: startedAt,
    startedAt,
    started_at: startedAt,
    completedAt,
    completed_at: completedAt,
    priority: backendQueue.priority,
    assignedTo: backendQueue.assigned_to || backendQueue.assignedTo,
    customerId: backendQueue.customer_id || backendQueue.citizen_id || backendQueue.customerId,
    citizenId: backendQueue.citizen_id || backendQueue.customer_id,
    customerName,
    citizenName: customerName,
  };
}

// ─── Provider ─────────────────────────────────────────────────────
export function QueueProvider({ children }) {
  const { user } = useAuth();
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'offline'
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  // ── Fetch queues from backend ──────────────────────────────────
  const fetchQueues = useCallback(async (filters = {}, options = {}) => {
    const token = localStorage.getItem('mesob_token');
    if (!token) {
      setMyTickets([]);
      setIsLive(false);
      setConnectionStatus('offline');
      return;
    }

    const { silent = false } = options;

    try {
      if (!silent) setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.institutionId) params.append('institutionId', filters.institutionId);
      if (filters.date) params.append('date', filters.date);
      
      const queryString = params.toString();
      const url = queryString ? `/queues?${queryString}` : '/queues';
      
      const response = await api.get(url);
      
      if (response && response.success && Array.isArray(response.data)) {
        const transformed = response.data.map(q => transformQueueEntry(q, response.data));
        setMyTickets(prev => {
          const prevKey = prev.map(p => `${p.id}_${p.status}_${p.peopleAhead}_${p.estimatedWaitMinutes}_${p.currentServing}_${p.queueReadiness}`).join('|');
          const nextKey = transformed.map(p => `${p.id}_${p.status}_${p.peopleAhead}_${p.estimatedWaitMinutes}_${p.currentServing}_${p.queueReadiness}`).join('|');
          return prevKey === nextKey ? prev : transformed;
        });
        setIsLive(true);
        setConnectionStatus('connected');
        setLastUpdated(new Date());
        setConnectionError(null);
      } else {
        setIsLive(false);
        setConnectionStatus('offline');
        setConnectionError(response?.message || 'Failed to fetch queue data');
        if (!silent) setMyTickets([]);
      }
    } catch (err) {
      console.error('Fetch queues error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch queues';
      setIsLive(false);
      setConnectionStatus('offline');
      setConnectionError(errMsg);
      if (!silent) {
        setError(errMsg);
        setMyTickets([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ── Auto-fetch queues on mount and user auth change ─────────────
  useEffect(() => {
    if (user && localStorage.getItem('mesob_token')) {
      fetchQueues();
    } else {
      setMyTickets([]);
      setIsLive(false);
      setConnectionStatus('offline');
    }
  }, [user, fetchQueues]);

  // ── Live auto-updates polling & connectivity mechanism ──────────
  const hasActiveTickets = myTickets.some(t => t.status === 'waiting' || t.status === 'called');

  useEffect(() => {
    if (!user || !localStorage.getItem('mesob_token')) return;

    // Poll every 3 seconds when waiting in queue, or 8s otherwise
    const pollInterval = hasActiveTickets ? 3000 : 8000;

    const intervalId = setInterval(() => {
      fetchQueues({}, { silent: true });
    }, pollInterval);

    // Immediate refresh on tab focus / visibility return
    const handleFocus = () => fetchQueues({}, { silent: true });
    const handleVisibility = () => {
      if (!document.hidden) fetchQueues({}, { silent: true });
    };

    // Network status listeners
    const handleOffline = () => {
      setIsLive(false);
      setConnectionStatus('offline');
      setConnectionError('Network connection lost');
    };
    const handleOnline = () => {
      setConnectionStatus('connecting');
      fetchQueues({}, { silent: true });
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [user, hasActiveTickets, fetchQueues]);

  // ── Register for a queue ───────────────────────────────────────
  const registerForQueue = useCallback(async (institutionUUID, serviceUUID, priority = 'NORMAL') => {
    try {
      setLoading(true);
      setError(null);

      // Support both positional arguments and object parameter
      let instId = institutionUUID;
      let svcId = serviceUUID;
      let prio = priority;

      if (typeof institutionUUID === 'object' && institutionUUID !== null) {
        instId = institutionUUID.institutionId || institutionUUID.institution_id;
        svcId = institutionUUID.serviceId || institutionUUID.service_id;
        prio = institutionUUID.priority || 'NORMAL';
      }

      console.log('=== JOIN QUEUE REQUEST ===');
      console.log('Institution ID:', instId);
      console.log('Service ID:', svcId);
      console.log('Priority:', prio);
      console.log('Token:', localStorage.getItem('mesob_token') ? 'EXISTS' : 'MISSING');

      const response = await api.post('/queues/join', {
        institutionId: instId,
        serviceId: svcId,
        priority: prio,
      });

      console.log('=== JOIN QUEUE RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response success:', response?.success);
      console.log('Response data:', response?.data);
      console.log('Response message:', response?.message);

      // api.post() returns { success, data, message } directly (not wrapped in response.data)
      if (response.success && response.data) {
        // Transform with empty array since we don't have full queue data yet
        const newTicket = transformQueueEntry(response.data, [response.data]);

        // Add to local state immediately
        setMyTickets(prev => [newTicket, ...prev]);

        // Background non-blocking sync to keep positions accurate
        fetchQueues({}, { silent: true });

        return { success: true, ticket: newTicket, ...newTicket };
      }

      const errorMsg = response?.message || 'Failed to join queue';
      console.error('❌ Queue registration failed:', errorMsg);
      setError(errorMsg);
      return { success: false, message: errorMsg, code: response?.code };
    } catch (err) {
      console.error('=== JOIN QUEUE ERROR ===');
      console.error('Error object:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);

      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to join queue. Please check your connection and try again.';

      setError(errorMessage);
      return { success: false, message: errorMessage, code: err.response?.data?.code };
    } finally {
      setLoading(false);
    }
  }, [fetchQueues]);

  // ── Cancel / leave queue ───────────────────────────────────────
  const cancelTicket = useCallback(async (ticketId) => {
    try {
      setLoading(true);
      setError(null);

      // Instant optimistic local update
      setMyTickets(prev =>
        prev.map(t =>
          t.id === ticketId
            ? { ...t, status: 'cancelled', rawStatus: 'CANCELLED', completedAt: new Date().toISOString() }
            : t
        )
      );

      const response = await api.patch(`/queues/${ticketId}/status`, {
        status: 'CANCELLED',
      });

      if (response.success) {
        // Fast background sync without blocking UI
        fetchQueues({}, { silent: true });
      } else {
        await fetchQueues();
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
      (t.status === 'called' || t.status === 'serving' || String(t.rawStatus).toUpperCase() === 'CALLED' || String(t.rawStatus).toUpperCase() === 'IN_PROGRESS')
    );
  }, [myTickets]);

  const callNextToken = useCallback(async (institutionId) => {
    try {
      setLoading(true);
      setError(null);

      // Backend automatically selects next pending/waiting queue entry
      const response = await api.post('/queues/call-next', institutionId ? { institutionId } : {});

      if (response.success) {
        if (response.data) {
          const calledEntry = transformQueueEntry(response.data);
          // Instant optimistic UI update: mark previous active ticket as completed and mark this one called
          setMyTickets(prev => {
            const updated = prev.map(t => {
              if (t.id === calledEntry.id) {
                return { ...t, ...calledEntry, status: 'called', rawStatus: 'CALLED' };
              }
              if (t.institutionId === (institutionId || calledEntry.institutionId) && (t.status === 'called' || t.status === 'serving')) {
                return { ...t, status: 'completed', rawStatus: 'COMPLETED' };
              }
              return t;
            });
            if (!updated.some(t => t.id === calledEntry.id)) {
              return [calledEntry, ...updated];
            }
            return updated;
          });
        }

        // Fast background sync without blocking UI
        fetchQueues({}, { silent: true });
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
        (t.status === 'called' || t.status === 'serving' || String(t.rawStatus).toUpperCase() === 'CALLED' || String(t.rawStatus).toUpperCase() === 'IN_PROGRESS')
      );

      if (!currentTicket) {
        throw new Error('No customer currently being served');
      }

      // Instant optimistic UI update
      setMyTickets(prev =>
        prev.map(t =>
          t.id === currentTicket.id
            ? { ...t, status: 'completed', rawStatus: 'COMPLETED', completedAt: new Date().toISOString() }
            : t
        )
      );

      const response = await api.patch(`/queues/${currentTicket.id}/status`, {
        status: 'COMPLETED',
      });

      if (response.success) {
        // Fast background sync without blocking UI
        fetchQueues({}, { silent: true });
      } else {
        await fetchQueues();
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
        isLive,
        connectionStatus,
        lastUpdated,
        connectionError,
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
