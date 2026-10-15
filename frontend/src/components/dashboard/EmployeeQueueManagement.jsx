import { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLES = {
  waiting:   'bg-amber-50 text-amber-800 border border-amber-200',
  called:    'bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold',
  completed: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-800 border border-rose-200',
};

const STATUS_LABELS = {
  waiting:   'Waiting',
  called:    'Being Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function QueueTokenCard({ ticket, isCurrent }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 shadow-xs transition ${isCurrent ? 'border-[#314ea1] ring-2 ring-[#314ea1]/20' : 'border-slate-200/90 hover:border-slate-300'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-xs ${isCurrent ? 'bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a]' : 'bg-slate-100 text-slate-700'}`}>
            {ticket.token}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{ticket.serviceName}</p>
            <p className="text-xs text-slate-500">{ticket.institutionName}</p>
          </div>
        </div>
        <span className={`badge text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[ticket.status]}`}>
          {STATUS_LABELS[ticket.status]}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-500">Registered</p>
          <p className="font-medium text-slate-700">
            {new Date(ticket.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {ticket.calledAt && (
          <div>
            <p className="text-xs text-slate-500">Called At</p>
            <p className="font-medium text-slate-700">
              {new Date(ticket.calledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmployeeQueueManagement() {
  const { user } = useAuth();
  const { myTickets, getInstitutionQueue, getCurrentServing, callNextToken, completeCurrentToken, loading, refreshQueues } = useQueue();
  
  // Use institution_id directly from authenticated user (this is UUID from backend)
  const institutionId = user?.institution_id || null;
  const [actionMessage, setActionMessage] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  // Auto-refresh on mount and when institution changes
  useEffect(() => {
    if (institutionId) {
      console.log('Refreshing queues for institution:', institutionId);
      refreshQueues();
    }
  }, [institutionId, refreshQueues]);

  // Debug logging
  console.log('=== EMPLOYEE QUEUE DEBUG ===');
  console.log('User:', user);
  console.log('Institution ID:', institutionId);
  console.log('All tickets from context:', myTickets);
  console.log('Institution queue:', getInstitutionQueue(institutionId));
  
  if (!institutionId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">My Queue</h2>
          <p className="text-slate-600 text-sm">Manage queue tokens for your institution.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-medium text-slate-700">No Institution Assigned</p>
          <p className="text-sm text-slate-500 mt-1">You are not assigned to any institution for queue management.</p>
        </div>
      </div>
    );
  }

  const waitingQueue = getInstitutionQueue(institutionId);
  const currentServing = getCurrentServing(institutionId);
  const waitingCount = waitingQueue.filter(t => t.status === 'waiting').length;

  async function handleCallNext() {
    if (actionInProgress) return;
    
    if (waitingCount === 0) {
      setActionMessage('No waiting customers to call.');
      setTimeout(() => setActionMessage(''), 3000);
      return;
    }

    setActionInProgress(true);
    try {
      await callNextToken(institutionId);
      setActionMessage('Next customer called successfully!');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage(err.message || 'Failed to call next customer');
      setTimeout(() => setActionMessage(''), 3000);
    } finally {
      setActionInProgress(false);
    }
  }

  async function handleCompleteCurrent() {
    if (actionInProgress) return;
    
    if (!currentServing) {
      setActionMessage('No customer currently being served.');
      setTimeout(() => setActionMessage(''), 3000);
      return;
    }

    setActionInProgress(true);
    try {
      await completeCurrentToken(institutionId);
      setActionMessage('Customer marked as completed.');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage(err.message || 'Failed to complete service');
      setTimeout(() => setActionMessage(''), 3000);
    } finally {
      setActionInProgress(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">My Queue</h2>
        <p className="text-slate-600 text-sm">Manage queue tokens for {user?.institution}.</p>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium border shadow-xs ${
          actionMessage.includes('successfully') || actionMessage.includes('completed')
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          {actionMessage}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-semibold text-slate-900">Currently Serving</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {currentServing ? '1 customer' : 'No customer'}
          </span>
        </div>
        
        {currentServing ? (
          <div className="p-6">
            <QueueTokenCard ticket={currentServing} isCurrent={true} />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleCompleteCurrent}
                disabled={actionInProgress || loading}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-sm font-medium shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionInProgress ? 'Processing...' : 'Complete Service'}
              </button>
              <button
                onClick={handleCallNext}
                disabled={actionInProgress || loading}
                className="px-5 py-3 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] text-white hover:from-[#253d82] hover:to-[#172554] rounded-xl transition text-sm font-medium shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionInProgress ? 'Processing...' : 'Call Next'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium text-slate-700">No customer currently being served</p>
            <p className="text-sm text-slate-500 mt-1">Click "Call Next" to serve the next waiting customer</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-semibold text-slate-900">Waiting Queue</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{waitingCount} waiting</span>
        </div>
        
        {waitingCount > 0 ? (
          <div className="p-6 space-y-3">
            {waitingQueue.filter(t => t.status === 'waiting').map((ticket, index) => (
              <div key={ticket.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-bold border border-slate-200">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <QueueTokenCard ticket={ticket} isCurrent={false} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <p className="font-medium text-slate-700">No waiting customers</p>
            <p className="text-sm text-slate-500 mt-1">The queue is empty</p>
          </div>
        )}
      </div>

      {!currentServing && waitingCount > 0 && (
        <button
          onClick={handleCallNext}
          className="w-full px-6 py-4 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] text-white hover:from-[#253d82] hover:to-[#172554] rounded-xl transition text-sm font-semibold shadow-xs"
        >
          Call Next Customer ({waitingCount} waiting)
        </button>
      )}

      <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-sm text-[#1e3a8a] shadow-xs">
        <strong className="font-semibold">Queue Operations:</strong> Click "Call Next" to automatically select the next waiting token. The system will complete the current serving token and call the next one in order. You cannot manually create tokens or operate queues for other institutions.
      </div>
    </div>
  );
}