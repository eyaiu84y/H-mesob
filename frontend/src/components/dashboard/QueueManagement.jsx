import { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { organizationsData } from '../../data/organizations';

// ─── Status badge styles ──────────────────────────────────────────
const STATUS_STYLES = {
  waiting:   'bg-yellow-100 text-yellow-800',
  called:    'bg-blue-100 text-blue-800 animate-pulse',
  serving:   'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  waiting:   'Waiting',
  called:    'Called — Go to Counter!',
  serving:   'Being Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// ─── Ticket card component ────────────────────────────────────────
function TicketCard({ ticket, onView, onCancel }) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${ticket.status === 'called' ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">{ticket.institutionName}</p>
          <p className="text-sm font-medium text-gray-700">{ticket.serviceName}</p>
        </div>
        <span className={`badge text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[ticket.status]}`}>
          {STATUS_LABELS[ticket.status]}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="text-center">
          <p className="text-xs text-gray-500">Your Token</p>
          <p className="text-2xl font-bold text-[#1e3a8a]">{ticket.token}</p>
        </div>
        {(ticket.status === 'waiting' || ticket.status === 'called') && (
          <>
            <div className="h-10 border-l border-gray-200" />
            <div className="text-center">
              <p className="text-xs text-gray-500">Now Serving</p>
              <p className="text-lg font-semibold text-gray-800">{ticket.currentServing}</p>
            </div>
            <div className="h-10 border-l border-gray-200" />
            <div className="text-center">
              <p className="text-xs text-gray-500">Ahead</p>
              <p className="text-lg font-semibold text-gray-800">{ticket.peopleAhead}</p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {' · '}
          {new Date(ticket.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="flex gap-2">
          {onView && (
            <button onClick={() => onView(ticket)} className="text-xs text-blue-600 hover:underline font-medium">
              View Details
            </button>
          )}
          {onCancel && (ticket.status === 'waiting' || ticket.status === 'called') && (
            <button onClick={() => onCancel(ticket.id)} className="text-xs text-red-500 hover:underline font-medium">
              Leave Queue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main QueueManagement component ───────────────────────────────
export default function QueueManagement() {
  const { getActiveTickets, getTicketHistory, registerForQueue, cancelTicket } = useQueue();

  // Steps: 'overview' | 'select-institution' | 'select-service' | 'confirm' | 'token-display'
  const [step, setStep] = useState('overview');
  const [historyTab, setHistoryTab] = useState('active'); // 'active' | 'history'
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [newTicket, setNewTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Force re-render for live updates from simulation
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const activeTickets = getActiveTickets();
  const ticketHistory = getTicketHistory();

  function handleSelectInstitution(org) {
    setSelectedInstitution(org);
    setSelectedService(null);
    setStep('select-service');
  }

  function handleSelectService(svc) {
    setSelectedService(svc);
    setStep('confirm');
  }

  function handleRegister() {
    const ticket = registerForQueue(
      selectedInstitution.id,
      selectedInstitution.name_en,
      selectedService.title_en
    );
    setNewTicket(ticket);
    setStep('token-display');
  }

  function handleBack() {
    if (step === 'select-service') {
      setStep('select-institution');
      setSelectedInstitution(null);
    } else if (step === 'confirm') {
      setStep('select-service');
      setSelectedService(null);
    } else if (step === 'token-display') {
      setStep('overview');
      setNewTicket(null);
      setSelectedInstitution(null);
      setSelectedService(null);
    } else {
      setStep('overview');
    }
  }

  function handleViewTicket(ticket) {
    setNewTicket(ticket);
    setStep('token-display');
  }

  // Filter institutions by search
  const filteredOrgs = organizationsData.filter(org =>
    org.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.name_am.includes(searchTerm)
  );

  // ─── STEP: Overview ─────────────────────────────────────────────
  if (step === 'overview') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">My Queue</h2>
            <p className="text-gray-600 text-sm">Register for queues and track your token status.</p>
          </div>
          <button
            onClick={() => { setStep('select-institution'); setSearchTerm(''); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            + Join a Queue
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setHistoryTab('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${historyTab === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Active ({activeTickets.length})
          </button>
          <button
            onClick={() => setHistoryTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${historyTab === 'history' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            History ({ticketHistory.length})
          </button>
        </div>

        {/* Active tickets */}
        {historyTab === 'active' && (
          <div className="space-y-4">
            {activeTickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <p className="font-medium text-gray-500">No active queue tickets</p>
                <p className="text-sm text-gray-400 mt-1">Click &quot;Join a Queue&quot; to register for a service queue</p>
              </div>
            ) : (
              activeTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onView={handleViewTicket}
                  onCancel={cancelTicket}
                />
              ))
            )}
          </div>
        )}

        {/* History */}
        {historyTab === 'history' && (
          <div className="space-y-4">
            {ticketHistory.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium text-gray-500">No queue history yet</p>
                <p className="text-sm text-gray-400 mt-1">Completed and cancelled queues will appear here</p>
              </div>
            ) : (
              ticketHistory.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} onView={handleViewTicket} />
              ))
            )}
          </div>
        )}

        {/* Info */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
          <strong>Queue Management:</strong> Join a service queue, receive a system-generated token, and track your position in real time. Your token number is assigned automatically.
        </div>
      </div>
    );
  }

  // ─── STEP: Select Institution ───────────────────────────────────
  if (step === 'select-institution') {
    return (
      <div className="space-y-6">
        <div>
          <button onClick={handleBack} className="text-sm text-blue-600 hover:underline font-medium mb-2 inline-flex items-center gap-1">
            ← Back to My Queue
          </button>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Select Institution</h2>
          <p className="text-gray-600 text-sm">Choose the institution you want to queue for.</p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search institutions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Institution grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrgs.map(org => (
            <button
              key={org.id}
              onClick={() => handleSelectInstitution(org)}
              className="stat-card hover:border-blue-400 transition text-left cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                  {org.name_en.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight">{org.name_en}</h3>
                  <p className="text-xs text-gray-500 truncate">{org.name_am}</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">{org.services.length} {org.services.length === 1 ? 'service' : 'services'} →</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {filteredOrgs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="font-medium">No institutions found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    );
  }

  // ─── STEP: Select Service ───────────────────────────────────────
  if (step === 'select-service') {
    return (
      <div className="space-y-6">
        <div>
          <button onClick={handleBack} className="text-sm text-blue-600 hover:underline font-medium mb-2 inline-flex items-center gap-1">
            ← Back to Institutions
          </button>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Select Service</h2>
          <p className="text-gray-600 text-sm">
            Choose a service at <span className="font-medium">{selectedInstitution.name_en}</span>
          </p>
        </div>

        {/* Services list */}
        <div className="space-y-3">
          {selectedInstitution.services.map((svc, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectService(svc)}
              className="w-full stat-card hover:border-blue-400 transition text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{svc.title_en}</h3>
                  <p className="text-xs text-gray-500">{svc.title_am}</p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-gray-500">
                      <span className="font-medium">Time:</span> {svc.time}
                    </span>
                    <span className="text-xs text-gray-500">
                      <span className="font-medium">Fee:</span> {svc.fee}
                    </span>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── STEP: Confirm Registration ─────────────────────────────────
  if (step === 'confirm') {
    return (
      <div className="space-y-6">
        <div>
          <button onClick={handleBack} className="text-sm text-blue-600 hover:underline font-medium mb-2 inline-flex items-center gap-1">
            ← Back to Services
          </button>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Confirm Queue Registration</h2>
          <p className="text-gray-600 text-sm">Review and confirm your queue registration.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                {selectedInstitution.name_en.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedInstitution.name_en}</p>
                <p className="text-sm text-gray-500">{selectedInstitution.name_am}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Service</p>
              <p className="font-medium text-gray-900">{selectedService.title_en}</p>
              <p className="text-sm text-gray-500">{selectedService.title_am}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Processing Time</p>
                <p className="text-sm font-medium text-gray-700">{selectedService.time}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fee</p>
                <p className="text-sm font-medium text-gray-700">{selectedService.fee}</p>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800">
              <strong>Note:</strong> Your queue token will be generated automatically by the system. You cannot choose a token number.
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleRegister}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Register for Queue
            </button>
            <button
              onClick={handleBack}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP: Token Display ────────────────────────────────────────
  if (step === 'token-display' && newTicket) {
    // Find the latest version of this ticket from context (for live updates)
    const { myTickets } = useQueue(); // eslint-disable-line react-hooks/rules-of-hooks
    const liveTicket = myTickets.find(t => t.id === newTicket.id) || newTicket;

    return (
      <div className="space-y-6">
        <div>
          <button onClick={handleBack} className="text-sm text-blue-600 hover:underline font-medium mb-2 inline-flex items-center gap-1">
            ← Back to My Queue
          </button>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Your Queue Token</h2>
          <p className="text-gray-600 text-sm">Your token has been generated. Please wait for your number to be called.</p>
        </div>

        {/* Token card */}
        <div className={`bg-white rounded-2xl border-2 shadow-lg p-6 text-center ${liveTicket.status === 'called' ? 'border-blue-400 ring-4 ring-blue-100' : 'border-gray-100'}`}>
          {liveTicket.status === 'called' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl animate-pulse">
              <p className="text-blue-800 font-bold text-lg">🔔 Your number is being called!</p>
              <p className="text-blue-600 text-sm">Please proceed to the service counter.</p>
            </div>
          )}

          {liveTicket.status === 'completed' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-800 font-bold text-lg">✅ Service Completed</p>
              <p className="text-green-600 text-sm">Your queue session has been completed.</p>
            </div>
          )}

          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Token Number</p>
          <p className="text-5xl font-extrabold text-[#1e3a8a] mb-2">{liveTicket.token}</p>
          <span className={`inline-block badge text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLES[liveTicket.status]}`}>
            {STATUS_LABELS[liveTicket.status]}
          </span>
        </div>

        {/* Queue status details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Queue Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Now Serving</p>
              <p className="text-xl font-bold text-gray-900">{liveTicket.currentServing}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">People Ahead</p>
              <p className="text-xl font-bold text-gray-900">{liveTicket.peopleAhead}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Institution</p>
              <p className="text-sm font-medium text-gray-900 leading-tight">{liveTicket.institutionName}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Service</p>
              <p className="text-sm font-medium text-gray-900 leading-tight">{liveTicket.serviceName}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Registered</p>
              <p className="font-medium text-gray-700">
                {new Date(liveTicket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' '}
                {new Date(liveTicket.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {liveTicket.calledAt && (
              <div>
                <p className="text-xs text-gray-500">Called At</p>
                <p className="font-medium text-gray-700">
                  {new Date(liveTicket.calledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
            {liveTicket.completedAt && (
              <div>
                <p className="text-xs text-gray-500">
                  {liveTicket.status === 'cancelled' ? 'Cancelled At' : 'Completed At'}
                </p>
                <p className="font-medium text-gray-700">
                  {new Date(liveTicket.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cancel button (only for active tickets) */}
        {(liveTicket.status === 'waiting' || liveTicket.status === 'called') && (
          <button
            onClick={() => { cancelTicket(liveTicket.id); handleBack(); }}
            className="w-full px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-medium"
          >
            Leave Queue
          </button>
        )}
      </div>
    );
  }

  return null;
}
