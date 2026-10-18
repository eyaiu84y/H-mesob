import { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { useServices } from '../../context/ServiceContext';
import { useApp } from '../../context/AppContext';
import FeedbackRating from './FeedbackRating';

// ─── Status badge styles ──────────────────────────────────────────
const STATUS_STYLES = {
  waiting:   'bg-amber-50 text-amber-800 border border-amber-200',
  called:    'bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold',
  serving:   'bg-emerald-50 text-emerald-800 border border-emerald-200',
  completed: 'bg-slate-100 text-slate-700 border border-slate-200',
  cancelled: 'bg-rose-50 text-rose-800 border border-rose-200',
};

// ─── Ticket card component ────────────────────────────────────────
function TicketCard({ ticket, onView, onCancel }) {
  const { t, lang } = useApp();
  const [cancelling, setCancelling] = useState(false);

  const statusLabels = {
    waiting:   t.status_waiting || 'Waiting',
    called:    t.status_called || 'Called — Go to Counter!',
    serving:   t.status_serving || 'Being Served',
    completed: t.status_completed || 'Completed',
    cancelled: t.status_cancelled || 'Cancelled',
  };

  async function handleCancel() {
    if (cancelling) return;
    setCancelling(true);
    try {
      await onCancel(ticket.id);
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-xs p-5 transition-all ${ticket.status === 'called' ? 'border-[#314ea1] ring-2 ring-blue-100' : 'border-slate-200/90 hover:border-blue-300'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1">{ticket.institutionName}</p>
          <p className="text-sm font-bold text-slate-900">{ticket.serviceName}</p>
        </div>
        <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold border ${STATUS_STYLES[ticket.status]}`}>
          {statusLabels[ticket.status] || ticket.status}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="text-center">
          <p className="text-xs text-slate-500">{t.your_token || 'Your Token'}</p>
          <p className="text-2xl font-bold text-[#1e3a8a]">{ticket.token}</p>
        </div>
        {(ticket.status === 'waiting' || ticket.status === 'called') && (
          <>
            <div className="h-10 border-l border-slate-200" />
            <div className="text-center">
              <p className="text-xs text-slate-500">{t.now_serving || 'Now Serving'}</p>
              <p className="text-lg font-bold text-slate-800">{ticket.currentServing}</p>
            </div>
            <div className="h-10 border-l border-slate-200" />
            <div className="text-center">
              <p className="text-xs text-slate-500">{t.ahead || 'Ahead'}</p>
              <p className="text-lg font-bold text-slate-800">{ticket.peopleAhead}</p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          {new Date(ticket.createdAt).toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {' · '}
          {new Date(ticket.createdAt).toLocaleTimeString(lang === 'am' ? 'am-ET' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="flex gap-3">
          {onView && (
            <button onClick={() => onView(ticket)} className="text-xs text-[#314ea1] hover:text-[#1e3a8a] font-semibold cursor-pointer">
              {t.details || 'View Details'}
            </button>
          )}
          {onCancel && (ticket.status === 'waiting' || ticket.status === 'called') && (
            <button 
              onClick={handleCancel} 
              disabled={cancelling}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold disabled:opacity-50 cursor-pointer"
            >
              {cancelling ? (t.leaving || 'Leaving...') : (t.leave_queue || 'Leave Queue')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main QueueManagement component ───────────────────────────────
export default function QueueManagement() {
  const { t, lang } = useApp();
  const { getActiveTickets, getTicketHistory, registerForQueue, cancelTicket, myTickets } = useQueue();
  const { institutions, getServicesByInstitution } = useServices();

  // Steps: 'overview' | 'select-institution' | 'select-service' | 'confirm' | 'token-display'
  const [step, setStep] = useState('overview');
  const [historyTab, setHistoryTab] = useState('active'); // 'active' | 'history'
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [newTicket, setNewTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [registrationError, setRegistrationError] = useState(null);

  // Force re-render for live updates from simulation
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const activeTickets = getActiveTickets();
  const ticketHistory = getTicketHistory();

  function handleSelectInstitution(inst) {
    setSelectedInstitution(inst);
    setSelectedService(null);
    setStep('select-service');
  }

  function handleSelectService(svc) {
    setSelectedService(svc);
    setStep('confirm');
  }

  async function handleRegister() {
    try {
      setRegistrationError(null);
      const ticket = await registerForQueue(
        selectedInstitution.id,  // UUID
        selectedService.id,       // UUID
        'NORMAL'
      );
      setNewTicket(ticket);
      setStep('token-display');
    } catch (err) {
      console.error('Registration failed:', err);
      setRegistrationError(err.message || 'Failed to register for queue. Please try again.');
    }
  }

  function handleBack() {
    if (step === 'select-service') {
      setStep('select-institution');
      setSelectedInstitution(null);
    } else if (step === 'confirm') {
      setStep('select-service');
      setSelectedService(null);
      setRegistrationError(null);
    } else if (step === 'token-display') {
      setStep('overview');
      setNewTicket(null);
      setSelectedInstitution(null);
      setSelectedService(null);
      setRegistrationError(null);
    } else {
      setStep('overview');
    }
  }

  function handleViewTicket(ticket) {
    setNewTicket(ticket);
    setStep('token-display');
  }

  // Filter institutions by search
  const filteredInstitutions = institutions.filter(inst =>
    inst.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.name_am?.includes(searchTerm)
  );

  // ─── STEP: Overview ─────────────────────────────────────────────
  if (step === 'overview') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{t.my_queue_title || 'My Queue'}</h2>
            <p className="text-slate-500 text-sm">{t.my_queue_desc || 'Register for queues and track your token status.'}</p>
          </div>
          <button
            onClick={() => { setStep('select-institution'); setSearchTerm(''); }}
            className="px-5 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl shadow-xs transition text-sm font-semibold cursor-pointer"
          >
            {t.join_queue_btn || '+ Join a Queue'}
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setHistoryTab('active')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              historyTab === 'active' 
                ? 'bg-[#314ea1] text-white shadow-xs' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 font-medium'
            }`}
          >
            {t.tab_active || 'Active'} ({activeTickets.length})
          </button>
          <button
            onClick={() => setHistoryTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              historyTab === 'history' 
                ? 'bg-[#314ea1] text-white shadow-xs' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 font-medium'
            }`}
          >
            {t.tab_history || 'History'} ({ticketHistory.length})
          </button>
        </div>

        {/* Active tickets */}
        {historyTab === 'active' && (
          <div className="space-y-4">
            {activeTickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-10 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <p className="font-semibold text-slate-700 text-sm">{t.no_active_tickets || 'No active queue tickets'}</p>
                <p className="text-xs text-slate-500 mt-1">{t.no_active_tickets_desc || 'Click "+ Join a Queue" to register for a service queue.'}</p>
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
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-10 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-slate-700 text-sm">{t.no_history_tickets || 'No queue history yet'}</p>
                <p className="text-xs text-slate-500 mt-1">{t.no_history_tickets_desc || 'Completed and cancelled queues will appear here.'}</p>
              </div>
            ) : (
              ticketHistory.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} onView={handleViewTicket} />
              ))
            )}
          </div>
        )}

        {/* Info */}
        <div className="p-4.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs sm:text-sm text-blue-950 flex items-start gap-3 shadow-xs">
          <span className="text-base flex-shrink-0">ℹ️</span>
          <div>
            <strong className="font-semibold text-[#1e3a8a]">{t.queue_management || 'Queue Management'}:</strong>{' '}
            {t.queue_info_banner || 'Join a service queue, receive a system-generated token, and track your position in real time. Your token number is assigned automatically.'}
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP: Select Institution ───────────────────────────────────
  if (step === 'select-institution') {
    return (
      <div className="space-y-6">
        <div>
          <button onClick={handleBack} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold mb-2 inline-flex items-center gap-1.5 cursor-pointer">
            ← {t.back_to_applications || t.my_queue_title || 'Back to My Queue'}
          </button>
          <h2 className="text-xl font-bold text-slate-900 mb-1">{t.select_institution || 'Select Institution'}</h2>
          <p className="text-slate-500 text-sm">{t.choose_institution_desc || 'Choose the institution you want to queue for.'}</p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder={t.search_institutions_services || (lang === 'am' ? 'ተቋማትን ወይም አገልግሎቶችን ይፈልጉ...' : 'Search institutions or services...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-11 rounded-2xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none shadow-2xs text-sm"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3.5 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Institution grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInstitutions.map(inst => {
            const instServices = getServicesByInstitution(inst.id);
            const instDisplayName = lang === 'am' && inst.name_am ? inst.name_am : (inst.name_en || inst.name);
            const instSecondaryName = lang === 'am' ? inst.name_en : inst.name_am;

            return (
              <button
                key={inst.id}
                onClick={() => handleSelectInstitution(inst)}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-[#314ea1] hover:shadow-md transition-all text-left cursor-pointer group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] flex items-center justify-center flex-shrink-0 font-bold text-base shadow-xs">
                    {inst.name_en?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 group-hover:text-[#314ea1] transition-colors mb-1 text-sm leading-tight">{instDisplayName}</h3>
                    {instSecondaryName && <p className="text-xs text-slate-500 truncate">{instSecondaryName}</p>}
                    <p className="text-xs text-[#314ea1] mt-1.5 font-semibold group-hover:translate-x-0.5 transition-transform inline-block">
                      {instServices.length} {lang === 'am' ? 'አገልግሎቶች' : (instServices.length === 1 ? 'service' : 'services')} →
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredInstitutions.length === 0 && (
          <div className="text-center py-8 text-slate-500 bg-white rounded-2xl border border-slate-200/90 p-8">
            <p className="font-semibold text-slate-700">{t.no_institutions_found || 'No institutions found'}</p>
            <p className="text-xs text-slate-400 mt-1">{t.try_diff_search || 'Try a different search term'}</p>
          </div>
        )}
      </div>
    );
  }

  // ─── STEP: Select Service ───────────────────────────────────────
  if (step === 'select-service') {
    const institutionServices = getServicesByInstitution(selectedInstitution.id);
    const selectedInstName = lang === 'am' && selectedInstitution.name_am ? selectedInstitution.name_am : selectedInstitution.name_en;
    
    return (
      <div className="space-y-6">
        <div>
          <button onClick={handleBack} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold mb-2 inline-flex items-center gap-1.5 cursor-pointer">
            ← {t.back_to_institutions || 'Back to Institutions'}
          </button>
          <h2 className="text-xl font-bold text-slate-900 mb-1">{t.select_service || 'Select Service'}</h2>
          <p className="text-slate-500 text-sm">
            {t.choose_service_at || 'Choose a service at'} <span className="font-semibold text-[#1e3a8a]">{selectedInstName}</span>
          </p>
        </div>

        {/* Services list */}
        <div className="space-y-3">
          {institutionServices.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-white rounded-2xl border border-slate-200/90 p-8">
              <p className="font-semibold text-slate-700">{t.no_services_available || 'No services available'}</p>
              <p className="text-xs text-slate-400 mt-1">{t.try_diff_search || 'This institution has no services configured yet'}</p>
            </div>
          ) : (
            institutionServices.map((svc) => {
              const svcTitle = lang === 'am' && (svc.title_am || svc.name_am) ? (svc.title_am || svc.name_am) : (svc.title_en || svc.name);
              const svcSecondaryTitle = lang === 'am' ? (svc.title_en || svc.name) : (svc.title_am || svc.name_am);

              return (
                <button
                  key={svc.id}
                  onClick={() => handleSelectService(svc)}
                  className="w-full bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-[#314ea1] hover:shadow-md transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-[#314ea1] transition-colors mb-1 text-base">{svcTitle}</h3>
                      {svcSecondaryTitle && <p className="text-xs text-slate-500">{svcSecondaryTitle}</p>}
                      <div className="flex gap-4 mt-2 text-xs text-slate-600">
                        {svc.processing_time && (
                          <span>
                            <span className="font-semibold text-slate-700">{t.processing_time || 'Time'}:</span> {svc.processing_time}
                          </span>
                        )}
                        {svc.service_fee && (
                          <span>
                            <span className="font-semibold text-[#1e3a8a]">{t.service_fee || 'Fee'}:</span> {svc.service_fee}
                          </span>
                        )}
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-hover:text-[#314ea1] group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ─── STEP: Confirm Registration ─────────────────────────────────
  if (step === 'confirm') {
    const selectedInstName = lang === 'am' && selectedInstitution.name_am ? selectedInstitution.name_am : selectedInstitution.name_en;
    const selectedInstSecondary = lang === 'am' ? selectedInstitution.name_en : selectedInstitution.name_am;
    const selectedSvcTitle = lang === 'am' && (selectedService.title_am || selectedService.name_am) ? (selectedService.title_am || selectedService.name_am) : (selectedService.title_en || selectedService.name);
    const selectedSvcSecondary = lang === 'am' ? (selectedService.title_en || selectedService.name) : (selectedService.title_am || selectedService.name_am);

    return (
      <div className="space-y-6">
        <div>
          <button onClick={handleBack} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold mb-2 inline-flex items-center gap-1.5 cursor-pointer">
            ← {t.back_to_service_details || 'Back to Services'}
          </button>
          <h2 className="text-xl font-bold text-slate-900 mb-1">{t.confirm_queue_reg || 'Confirm Queue Registration'}</h2>
          <p className="text-slate-500 text-sm">{t.review_confirm_queue || 'Review and confirm your queue registration.'}</p>
        </div>

        {registrationError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800">
            <strong>{t.error || 'Error'}:</strong> {registrationError}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] flex items-center justify-center font-bold text-lg shadow-xs">
                {selectedInstitution.name_en?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-base">{selectedInstName}</p>
                {selectedInstSecondary && <p className="text-xs text-slate-500">{selectedInstSecondary}</p>}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{t.service || 'Service'}</p>
              <p className="font-bold text-slate-900 text-base">{selectedSvcTitle}</p>
              {selectedSvcSecondary && <p className="text-xs text-slate-500">{selectedSvcSecondary}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{t.processing_time || 'Processing Time'}</p>
                <p className="text-sm font-bold text-[#1e3a8a]">{selectedService.processing_time || 'N/A'}</p>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{t.service_fee || 'Fee'}</p>
                <p className="text-sm font-bold text-emerald-800">{selectedService.service_fee || 'N/A'}</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs sm:text-sm text-amber-900">
              <strong>{t.info || 'Note'}:</strong> {t.auto_token_note || 'Your queue token will be generated automatically by the system. You cannot choose a token number.'}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleRegister}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl shadow-xs transition text-sm font-semibold cursor-pointer"
            >
              {t.register_for_queue || 'Register for Queue'}
            </button>
            <button
              onClick={handleBack}
              className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition text-sm font-medium cursor-pointer"
            >
              {t.cancel || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP: Token Display ────────────────────────────────────────
  if (step === 'token-display' && newTicket) {
    // Find the latest version of this ticket from context (for live updates)
    const liveTicket = myTickets.find(t => t.id === newTicket.id) || newTicket;
    const statusLabels = {
      waiting:   t.status_waiting || 'Waiting',
      called:    t.status_called || 'Called — Go to Counter!',
      serving:   t.status_serving || 'Being Served',
      completed: t.status_completed || 'Completed',
      cancelled: t.status_cancelled || 'Cancelled',
    };

    return (
      <div className="space-y-6">
        <div>
          <button onClick={handleBack} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold mb-2 inline-flex items-center gap-1.5 cursor-pointer">
            ← {t.my_queue_title || 'Back to My Queue'}
          </button>
          <h2 className="text-xl font-bold text-slate-900 mb-1">{t.your_token || 'Your Queue Token'}</h2>
          <p className="text-slate-500 text-sm">{t.token_generated_desc || 'Your token has been generated. Please wait for your number to be called.'}</p>
        </div>

        {/* Token card */}
        <div className={`bg-white rounded-2xl border-2 shadow-xs p-6 text-center ${liveTicket.status === 'called' ? 'border-[#314ea1] ring-4 ring-blue-100' : 'border-slate-200/90'}`}>
          {liveTicket.status === 'called' && (
            <div className="mb-4 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-[#1e3a8a] font-bold text-lg">🔔 {t.number_being_called || 'Your number is being called!'}</p>
              <p className="text-blue-700 text-sm">{t.proceed_counter || 'Please proceed to the service counter.'}</p>
            </div>
          )}

          {liveTicket.status === 'completed' && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-emerald-800 font-bold text-lg">✅ {t.service_completed_title || 'Service Completed'}</p>
              <p className="text-emerald-700 text-sm">{t.service_completed_desc || 'Your queue session has been completed.'}</p>
            </div>
          )}

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.your_token || 'Your Token Number'}</p>
          <p className="text-5xl font-extrabold text-[#1e3a8a] mb-2">{liveTicket.token}</p>
          <span className={`inline-block text-xs px-3 py-1 rounded-full font-semibold border ${STATUS_STYLES[liveTicket.status]}`}>
            {statusLabels[liveTicket.status] || liveTicket.status}
          </span>
        </div>

        {/* Queue status details */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <h3 className="font-bold text-slate-900 mb-4 text-base">{t.queue_status || 'Queue Status'}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">{t.now_serving || 'Now Serving'}</p>
              <p className="text-xl font-bold text-slate-900">{liveTicket.currentServing}</p>
            </div>
            <div className="text-center p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">{t.people_ahead || 'People Ahead'}</p>
              <p className="text-xl font-bold text-[#314ea1]">{liveTicket.peopleAhead}</p>
            </div>
            <div className="text-center p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">{t.institution || 'Institution'}</p>
              <p className="text-sm font-semibold text-slate-900 leading-tight">{liveTicket.institutionName}</p>
            </div>
            <div className="text-center p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">{t.service || 'Service'}</p>
              <p className="text-sm font-semibold text-slate-900 leading-tight">{liveTicket.serviceName}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:text-sm pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">{t.registered || 'Registered'}</p>
              <p className="font-medium text-slate-800">
                {new Date(liveTicket.createdAt).toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' '}
                {new Date(liveTicket.createdAt).toLocaleTimeString(lang === 'am' ? 'am-ET' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {liveTicket.calledAt && (
              <div>
                <p className="text-xs text-slate-500">{t.called_at || 'Called At'}</p>
                <p className="font-medium text-slate-800">
                  {new Date(liveTicket.calledAt).toLocaleTimeString(lang === 'am' ? 'am-ET' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
            {liveTicket.completedAt && (
              <div>
                <p className="text-xs text-slate-500">
                  {liveTicket.status === 'cancelled' ? (t.cancelled_at || 'Cancelled At') : (t.completed_at || 'Completed At')}
                </p>
                <p className="font-medium text-slate-800">
                  {new Date(liveTicket.completedAt).toLocaleTimeString(lang === 'am' ? 'am-ET' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cancel button (only for active tickets) */}
        {(liveTicket.status === 'waiting' || liveTicket.status === 'called') && (
          <button
            onClick={() => { cancelTicket(liveTicket.id); handleBack(); }}
            className="w-full px-4 py-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 transition text-sm font-semibold cursor-pointer"
          >
            {t.leave_queue || 'Leave Queue'}
          </button>
        )}

        {/* Feedback Rating - Only show for completed queue entries */}
        {liveTicket.status === 'completed' && liveTicket.institutionId && liveTicket.serviceId && (
          <div>
            <h3 className="font-bold text-slate-900 mb-4 text-base">{t.rate_your_experience || 'Rate Your Experience'}</h3>
            <FeedbackRating
              queueEntryId={liveTicket.id}
              institutionId={liveTicket.institutionId}
              serviceId={liveTicket.serviceId}
              institutionName={liveTicket.institutionName}
              serviceName={liveTicket.serviceName}
              onSuccess={handleBack}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}
