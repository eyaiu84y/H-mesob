import { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLES = {
  waiting:   'bg-yellow-100 text-yellow-800',
  called:    'bg-blue-100 text-blue-800 animate-pulse',
  completed: 'bg-green-100 text-green-600',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  waiting:   'Waiting',
  called:    'Being Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function QueueTokenCard({ ticket, isCurrent }) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${isCurrent ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
            {ticket.token}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{ticket.serviceName}</p>
            <p className="text-xs text-gray-500">{ticket.institutionName}</p>
          </div>
        </div>
        <span className={`badge text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[ticket.status]}`}>
          {STATUS_LABELS[ticket.status]}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500">Registered</p>
          <p className="font-medium text-gray-700">
            {new Date(ticket.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {ticket.calledAt && (
          <div>
            <p className="text-xs text-gray-500">Called At</p>
            <p className="font-medium text-gray-700">
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
  const { getInstitutionQueue, getCurrentServing, callNextToken, completeCurrentToken } = useQueue();
  
  const institutionNameToId = {
    'Commercial Bank of Ethiopia': 'cbe',
    'Ethio Telecom': 'ethiotel',
    'Ethiopian Electric Utility': 'electric',
    'National ID Program': 'fayda',
    'Ministry of Justice': 'justice',
    'Revenues Bureau': 'revenue',
  };
  
  const institutionId = institutionNameToId[user?.institution] || null;
  const [actionMessage, setActionMessage] = useState('');
  
  if (!institutionId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">My Queue</h2>
          <p className="text-gray-600 text-sm">Manage queue tokens for your institution.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-medium text-gray-500">No Institution Assigned</p>
          <p className="text-sm text-gray-400 mt-1">You are not assigned to any institution for queue management.</p>
        </div>
      </div>
    );
  }

  const waitingQueue = getInstitutionQueue(institutionId);
  const currentServing = getCurrentServing(institutionId);
  const waitingCount = waitingQueue.filter(t => t.status === 'waiting').length;

  function handleCallNext() {
    if (waitingCount === 0) {
      setActionMessage('No waiting customers to call.');
      setTimeout(() => setActionMessage(''), 3000);
      return;
    }

    callNextToken(institutionId);
    setActionMessage('Next customer called successfully!');
    setTimeout(() => setActionMessage(''), 3000);
  }

  function handleCompleteCurrent() {
    if (!currentServing) {
      setActionMessage('No customer currently being served.');
      setTimeout(() => setActionMessage(''), 3000);
      return;
    }

    completeCurrentToken(institutionId);
    setActionMessage('Customer marked as completed.');
    setTimeout(() => setActionMessage(''), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">My Queue</h2>
        <p className="text-gray-600 text-sm">Manage queue tokens for {user?.institution}.</p>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          actionMessage.includes('successfully') || actionMessage.includes('completed')
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-amber-50 text-amber-800 border border-amber-200'
        }`}>
          {actionMessage}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Currently Serving</h3>
          <span className="text-sm text-gray-500">
            {currentServing ? '1 customer' : 'No customer'}
          </span>
        </div>
        
        {currentServing ? (
          <div className="p-6">
            <QueueTokenCard ticket={currentServing} isCurrent={true} />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleCompleteCurrent}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                Complete Service
              </button>
              <button
                onClick={handleCallNext}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Call Next
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium text-gray-500">No customer currently being served</p>
            <p className="text-sm text-gray-400 mt-1">Click "Call Next" to serve the next waiting customer</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Waiting Queue</h3>
          <span className="text-sm text-gray-500">{waitingCount} waiting</span>
        </div>
        
        {waitingCount > 0 ? (
          <div className="p-6 space-y-3">
            {waitingQueue.filter(t => t.status === 'waiting').map((ticket, index) => (
              <div key={ticket.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <QueueTokenCard ticket={ticket} isCurrent={false} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <p className="font-medium text-gray-500">No waiting customers</p>
            <p className="text-sm text-gray-400 mt-1">The queue is empty</p>
          </div>
        )}
      </div>

      {!currentServing && waitingCount > 0 && (
        <button
          onClick={handleCallNext}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium font-semibold"
        >
          Call Next Customer ({waitingCount} waiting)
        </button>
      )}

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
        <strong>Queue Operations:</strong> Click "Call Next" to automatically select the next waiting token. The system will complete the current serving token and call the next one in order. You cannot manually create tokens or operate queues for other institutions.
      </div>
    </div>
  );
}