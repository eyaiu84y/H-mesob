import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import { useServices } from '../../context/ServiceContext';
import { useApp } from '../../context/AppContext';
import FeedbackRating from './FeedbackRating';
import { formatDisplayDate } from '../../utils/formatters';
import { getInstitutionName, getServiceTitle } from '../../utils/localizedContent';

// ─── Status badge styles ──────────────────────────────────────────
const STATUS_STYLES = {
  waiting:   'bg-amber-50 text-amber-800 border border-amber-200',
  called:    'bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold',
  serving:   'bg-emerald-50 text-emerald-800 border border-emerald-200',
  completed: 'bg-slate-100 text-slate-700 border border-slate-200',
  cancelled: 'bg-rose-50 text-rose-800 border border-rose-200',
};

// ─── Format estimated wait label accurately ────────────────────────
function formatEstimatedWait(ticket, t, i18nT) {
  if (ticket.status === 'called') {
    return t.at_counter || i18nT('queue.atCounter', 'At counter');
  }
  if (ticket.peopleAhead > 0) {
    return `~${ticket.estimatedWaitMinutes} min`;
  }
  // When peopleAhead === 0:
  if (ticket.queueReadiness === 'AWAITING_STAFF') {
    return t.awaiting_counter || i18nT('queue.awaitingCounter', 'Awaiting counter');
  }
  // Ready to be called:
  return t.ready_to_be_called || i18nT('queue.readyToBeCalled', 'Ready to be called');
}

// ─── Ticket card component ────────────────────────────────────────
function TicketCard({ ticket, onView, onCancel }) {
  const { t } = useApp();
  const { i18n, t: i18nT } = useTranslation();
  const [cancelling, setCancelling] = useState(false);
  const currentLang = i18n.language || 'en';

  const statusLabels = {
    waiting:   t.status_waiting || i18nT('status.waiting', 'Waiting'),
    called:    t.status_called || i18nT('status.called', 'Called — Go to Counter!'),
    serving:   t.status_serving || i18nT('status.serving', 'Being Served'),
    completed: t.status_completed || i18nT('status.completed', 'Completed'),
    cancelled: t.status_cancelled || i18nT('status.cancelled', 'Cancelled'),
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

  const timeLocale = currentLang === 'am' ? 'am-ET' : 'en-US';

  return (
    <div className={`bg-white rounded-2xl border shadow-xs p-5 transition-all ${ticket.status === 'called' ? 'border-[#314ea1] ring-2 ring-blue-100' : 'border-slate-200/90 hover:border-blue-300'}`}>
      {/* Prominent Called Notification Banner displaying Window / Desk */}
      {ticket.status === 'called' && (
        <div className="mb-3 p-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                {currentLang === 'am' ? 'ተራዎ ደርሷል — ወደ መስኮት ይሂዱ' : 'Now Calling — Go to Window'}
              </p>
              <p className="text-xs font-semibold text-white/90">
                {ticket.institutionName} • {ticket.serviceName}
              </p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/25 text-right">
            <p className="text-[9px] uppercase font-bold text-blue-100">{currentLang === 'am' ? 'መስኮት' : 'Window'}</p>
            <p className="text-base font-black text-[#f4b51a] leading-none">
              {currentLang === 'am' ? `መስኮት ${ticket.windowNumber || ticket.counterNumber || '1'}` : `Window #${ticket.windowNumber || ticket.counterNumber || '1'}`}
            </p>
          </div>
        </div>
      )}

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
          <p className="text-xs text-slate-500">{t.your_token || i18nT('queue.yourToken', 'Your Token')}</p>
          <p className="text-2xl font-bold text-[#1e3a8a]">{ticket.token}</p>
        </div>
        {(ticket.status === 'waiting' || ticket.status === 'called') && (
          <>
            <div className="h-10 border-l border-slate-200" />
            <div className="text-center">
              <p className="text-xs text-slate-500">{t.now_serving || i18nT('queue.nowServing', 'Now Serving')}</p>
              <p className="text-lg font-bold text-slate-800">{ticket.currentServing}</p>
            </div>
            <div className="h-10 border-l border-slate-200" />
            <div className="text-center">
              <p className="text-xs text-slate-500">{t.ahead || i18nT('queue.ahead', 'Ahead')}</p>
              <p className="text-lg font-bold text-slate-800">{ticket.peopleAhead}</p>
            </div>
            <div className="h-10 border-l border-slate-200" />
            <div className="text-center">
              <p className="text-xs text-slate-500">{t.est_wait || i18nT('queue.estWait', 'Est. Wait')}</p>
              <p className="text-lg font-bold text-[#1e3a8a]">
                {formatEstimatedWait(ticket, t, i18nT)}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          {formatDisplayDate(ticket.createdAt, currentLang)}
          {' · '}
          {new Date(ticket.createdAt).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="flex gap-3">
          {onView && (
            <button onClick={() => onView(ticket)} className="text-xs text-[#314ea1] hover:text-[#1e3a8a] font-semibold cursor-pointer">
              {t.details || i18nT('common.viewDetails', 'View Details')}
            </button>
          )}
          {onCancel && (ticket.status === 'waiting' || ticket.status === 'called') && (
            <button 
              onClick={handleCancel} 
              disabled={cancelling}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold disabled:opacity-50 cursor-pointer"
            >
              {cancelling ? (t.leaving || i18nT('queue.leaving', 'Leaving...')) : (t.leave_queue || i18nT('queue.leaveQueue', 'Leave Queue'))}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Queue Management Component ─────────────────────────────
export default function QueueManagement({ initialStep = 'list', onBack = null, onVerifyEmail = null }) {
  const { user } = useAuth();
  const { 
    myTickets, 
    registerForQueue, 
    cancelTicket, 
    connectionStatus, 
    lastUpdated, 
    connectionError 
  } = useQueue();
  const { institutions, getServicesByInstitution } = useServices();
  const { t } = useApp();
  const { i18n, t: i18nT } = useTranslation();

  const currentLang = i18n.language || 'en';
  const timeLocale = currentLang === 'am' ? 'am-ET' : 'en-US';

  const [step, setStep] = useState(initialStep);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [newTicket, setNewTicket] = useState(null);
  const [historyTab, setHistoryTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeTickets = myTickets.filter(t => t.status === 'waiting' || t.status === 'called');
  const ticketHistory = myTickets.filter(t => t.status === 'completed' || t.status === 'cancelled');

  function handleStartRegistration() {
    setStep('select-institution');
    setSearchTerm('');
    setRegistrationError('');
  }

  function handleSelectInstitution(inst) {
    setSelectedInstitution(inst);
    setStep('select-service');
  }

  function handleSelectService(svc) {
    setSelectedService(svc);
    setStep('confirm');
  }

  async function handleRegister() {
    if (submitting) return;
    setRegistrationError('');

    if (user?.emailVerified === false) {
      if (onVerifyEmail) {
        onVerifyEmail();
      } else {
        setRegistrationError(i18nT('queue.verifyEmailBeforeQueue', 'Please verify your email address before registering for a queue ticket.'));
      }
      return;
    }

    if (!selectedService || !selectedInstitution) {
      setRegistrationError(i18nT('queue.selectServiceFirst', 'Please select a valid institution and service first.'));
      return;
    }

    setSubmitting(true);

    try {
      const result = await registerForQueue(
        selectedInstitution.id,
        selectedService.id,
        'NORMAL'
      );

      const ticket = result?.ticket || (result?.id ? result : null);
      if (result?.success || ticket) {
        setNewTicket(ticket);
        setStep('token-display');
      } else {
        if (result?.code === 'EMAIL_VERIFICATION_REQUIRED' && onVerifyEmail) {
          onVerifyEmail();
        }
        setRegistrationError(result?.message || i18nT('queue.registrationFailed', 'Failed to register for queue'));
      }
    } catch (err) {
      console.error('Queue registration error:', err);
      setRegistrationError(err.message || i18nT('queue.registrationFailed', 'Failed to register for queue'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleViewTicket(ticket) {
    setNewTicket(ticket);
    setStep('token-display');
  }

  function handleBack() {
    if (step === 'token-display') {
      setStep('list');
      setNewTicket(null);
    } else if (step === 'confirm') {
      setStep('select-service');
    } else if (step === 'select-service') {
      setStep('select-institution');
    } else if (step === 'select-institution') {
      setStep('list');
    } else if (onBack) {
      onBack();
    }
  }

  const filteredInstitutions = institutions.filter(inst => {
    const term = searchTerm.toLowerCase();
    const nameEn = (inst.name_en || inst.name || '').toLowerCase();
    const nameAm = (inst.name_am || '').toLowerCase();
    return nameEn.includes(term) || nameAm.includes(term);
  });

  // ─── STEP: Queue List View ──────────────────────────────────────
  if (step === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.my_queue_title || i18nT('queue.title', 'My Queue')}</h2>
            <p className="text-slate-500 text-sm">{t.queue_desc || i18nT('queue.desc', 'View and manage your active queue tokens.')}</p>
          </div>
          <button
            onClick={handleStartRegistration}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl shadow-xs transition font-semibold text-sm cursor-pointer"
          >
            <span className="text-base leading-none">+</span>
            <span>{t.join_queue || i18nT('queue.joinQueue', 'Join a Queue')}</span>
          </button>
        </div>

        {registrationError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-center justify-between">
            <div>
              <strong>{t.error || i18nT('common.error', 'Error')}:</strong> {registrationError}
            </div>
            {onVerifyEmail && (
              <button
                onClick={onVerifyEmail}
                className="px-3 py-1 bg-[#1e3a8a] hover:bg-[#172554] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                {t.verify_now || 'Verify Now'}
              </button>
            )}
          </div>
        )}

        {/* Tab switcher + live badge */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setHistoryTab('active')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                historyTab === 'active' 
                  ? 'bg-[#314ea1] text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 font-medium'
              }`}
            >
              {t.tab_active || i18nT('status.active', 'Active')} ({activeTickets.length})
            </button>
            <button
              onClick={() => setHistoryTab('history')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                historyTab === 'history' 
                  ? 'bg-[#314ea1] text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 font-medium'
              }`}
            >
              {t.tab_history || i18nT('common.history', 'History')} ({ticketHistory.length})
            </button>
          </div>

          {activeTickets.length > 0 && historyTab === 'active' && (
            connectionStatus === 'connected' ? (
              <span 
                className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"
                title={lastUpdated ? `${i18nT('queue.lastUpdated', 'Last updated:')} ${lastUpdated.toLocaleTimeString(timeLocale)}` : ''}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {i18nT('queue.liveUpdatesActive', 'Live updates active')}
              </span>
            ) : connectionStatus === 'connecting' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                {i18nT('queue.connecting', 'Connecting...')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200" title={connectionError || i18nT('queue.connectionLost', 'Connection lost')}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {i18nT('queue.offlineRetrying', 'Offline (retrying...)')}
              </span>
            )
          )}
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
                <p className="font-semibold text-slate-700 text-sm">{t.no_active_tickets || i18nT('queue.noActiveTickets', 'No active queue tickets')}</p>
                <p className="text-xs text-slate-500 mt-1">{t.no_active_tickets_desc || i18nT('queue.noActiveTicketsDesc', 'Click "+ Join a Queue" to register for a service queue.')}</p>
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
                <p className="font-semibold text-slate-700 text-sm">{t.no_history_tickets || i18nT('queue.noHistoryTickets', 'No queue history yet')}</p>
                <p className="text-xs text-slate-500 mt-1">{t.no_history_tickets_desc || i18nT('queue.noHistoryTicketsDesc', 'Completed and cancelled queues will appear here.')}</p>
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
            <strong className="font-semibold text-[#1e3a8a]">{t.queue_management || i18nT('queue.title', 'Queue Management')}:</strong>{' '}
            {t.queue_info_banner || i18nT('queue.infoBanner', 'Join a service queue, receive a system-generated token, and track your position in real time. Your token number is assigned automatically.')}
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
            ← {t.back_to_applications || t.my_queue_title || i18nT('queue.backToMyQueue', 'Back to My Queue')}
          </button>
          <h2 className="text-xl font-bold text-slate-900 mb-1">{t.select_institution || i18nT('institutions.selectInstitution', 'Select Institution')}</h2>
          <p className="text-slate-500 text-sm">{t.choose_institution_desc || i18nT('institutions.chooseInstitutionDesc', 'Choose the institution you want to queue for.')}</p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder={t.search_institutions_services || i18nT('queue.searchInstitutionsOrServices', 'Search institutions or services...')}
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
            const instDisplayName = getInstitutionName(inst, currentLang);
            const instSecondaryName = currentLang === 'am' ? inst.name_en : inst.name_am;

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
                      {instServices.length} {instServices.length === 1 ? i18nT('common.service', 'service') : i18nT('common.services', 'services')} →
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredInstitutions.length === 0 && (
          <div className="text-center py-8 text-slate-500 bg-white rounded-2xl border border-slate-200/90 p-8">
            <p className="font-semibold text-slate-700">{t.no_institutions_found || i18nT('institutions.noInstitutionsFound', 'No institutions found')}</p>
            <p className="text-xs text-slate-400 mt-1">{t.try_diff_search || i18nT('common.tryDifferentSearch', 'Try a different search term')}</p>
          </div>
        )}
      </div>
    );
  }

  // ─── STEP: Select Service ───────────────────────────────────────
  if (step === 'select-service') {
    const institutionServices = getServicesByInstitution(selectedInstitution.id);
    const selectedInstName = getInstitutionName(selectedInstitution, currentLang);
    
    return (
      <div className="space-y-6">
        <div>
          <button onClick={handleBack} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold mb-2 inline-flex items-center gap-1.5 cursor-pointer">
            ← {t.back_to_institutions || i18nT('institutions.backToInstitutions', 'Back to Institutions')}
          </button>
          <h2 className="text-xl font-bold text-slate-900 mb-1">{t.select_service || i18nT('services.selectService', 'Select Service')}</h2>
          <p className="text-slate-500 text-sm">
            {t.choose_service_at || i18nT('services.chooseServiceAt', 'Choose a service at')} <span className="font-semibold text-[#1e3a8a]">{selectedInstName}</span>
          </p>
        </div>

        {/* Services list */}
        <div className="space-y-3">
          {institutionServices.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-white rounded-2xl border border-slate-200/90 p-8">
              <p className="font-semibold text-slate-700">{t.no_services_available || i18nT('services.noServicesAvailable', 'No services available')}</p>
              <p className="text-xs text-slate-400 mt-1">{t.try_diff_search || i18nT('services.noServicesConfigured', 'This institution has no services configured yet')}</p>
            </div>
          ) : (
            institutionServices.map((svc) => {
              const svcTitle = getServiceTitle(svc, currentLang);
              const svcSecondaryTitle = currentLang === 'am' ? (svc.title_en || svc.name) : (svc.title_am || svc.name_am);

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
                            <span className="font-semibold text-slate-700">{t.processing_time || i18nT('common.processingTime', 'Time')}:</span> {svc.processing_time}
                          </span>
                        )}
                        {svc.service_fee && (
                          <span>
                            <span className="font-semibold text-[#1e3a8a]">{t.service_fee || i18nT('common.serviceFee', 'Fee')}:</span> {svc.service_fee}
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
    const selectedInstName = getInstitutionName(selectedInstitution, currentLang);
    const selectedInstSecondary = currentLang === 'am' ? selectedInstitution.name_en : selectedInstitution.name_am;
    const selectedSvcTitle = getServiceTitle(selectedService, currentLang);
    const selectedSvcSecondary = currentLang === 'am' ? (selectedService.title_en || selectedService.name) : (selectedService.title_am || selectedService.name_am);

    return (
      <div className="space-y-6">
        <div>
          <button onClick={handleBack} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold mb-2 inline-flex items-center gap-1.5 cursor-pointer">
            ← {t.back_to_service_details || i18nT('services.backToServices', 'Back to Services')}
          </button>
          <h2 className="text-xl font-bold text-slate-900 mb-1">{t.confirm_queue_reg || i18nT('queue.confirmQueueReg', 'Confirm Queue Registration')}</h2>
          <p className="text-slate-500 text-sm">{t.review_confirm_queue || i18nT('queue.reviewConfirmQueue', 'Review and confirm your queue registration.')}</p>
        </div>

        {registrationError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800">
            <strong>{t.error || i18nT('common.error', 'Error')}:</strong> {registrationError}
          </div>
        )}

        {user?.emailVerified === false && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold">{i18nT('auth.emailVerificationRequired', 'Email Verification Required')}</p>
                <p className="mt-0.5">{i18nT('queue.verifyEmailBeforeQueue', 'Please verify your email address before registering for a queue ticket.')}</p>
              </div>
            </div>
            {onVerifyEmail && (
              <button
                type="button"
                onClick={onVerifyEmail}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer transition shadow-xs"
              >
                {currentLang === 'am' ? 'ኢሜይል አረጋግጥ' : 'Verify Email'}
              </button>
            )}
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{t.service || i18nT('common.service', 'Service')}</p>
              <p className="font-bold text-slate-900 text-base">{selectedSvcTitle}</p>
              {selectedSvcSecondary && <p className="text-xs text-slate-500">{selectedSvcSecondary}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{t.processing_time || i18nT('common.processingTime', 'Processing Time')}</p>
                <p className="text-sm font-bold text-[#1e3a8a]">{selectedService.processing_time || i18nT('common.notSpecified', 'N/A')}</p>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{t.service_fee || i18nT('common.serviceFee', 'Fee')}</p>
                <p className="text-sm font-bold text-emerald-800">{selectedService.service_fee || i18nT('common.notSpecified', 'N/A')}</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs sm:text-sm text-amber-900">
              <strong>{t.info || i18nT('common.info', 'Note')}:</strong> {t.auto_token_note || i18nT('queue.autoTokenNote', 'Your queue token will be generated automatically by the system. You cannot choose a token number.')}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleRegister}
              disabled={submitting}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl shadow-xs transition text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{currentLang === 'am' ? 'በመመዝገብ ላይ...' : 'Registering...'}</span>
                </span>
              ) : user?.emailVerified === false ? (
                onVerifyEmail ? (currentLang === 'am' ? 'ኢሜይል አረጋግጥ እና ተመዝገብ' : 'Verify Email & Register') : (t.register_for_queue || i18nT('queue.registerForQueue', 'Register for Queue'))
              ) : (
                t.register_for_queue || i18nT('queue.registerForQueue', 'Register for Queue')
              )}
            </button>
            <button
              onClick={handleBack}
              disabled={submitting}
              className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition text-sm font-medium cursor-pointer disabled:opacity-50"
            >
              {t.cancel || i18nT('common.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP: Token Display ────────────────────────────────────────
  if (step === 'token-display' && newTicket) {
    const liveTicket = myTickets.find(t => t.id === newTicket.id) || newTicket;
    const statusLabels = {
      waiting:   t.status_waiting || i18nT('status.waiting', 'Waiting'),
      called:    t.status_called || i18nT('status.called', 'Called — Go to Counter!'),
      serving:   t.status_serving || i18nT('status.serving', 'Being Served'),
      completed: t.status_completed || i18nT('status.completed', 'Completed'),
      cancelled: t.status_cancelled || i18nT('status.cancelled', 'Cancelled'),
    };

    return (
      <div className="space-y-6">
        <div>
          <button onClick={handleBack} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold mb-2 inline-flex items-center gap-1.5 cursor-pointer">
            ← {t.my_queue_title || i18nT('queue.backToMyQueue', 'Back to My Queue')}
          </button>
          <h2 className="text-xl font-bold text-slate-900 mb-1">{t.your_token || i18nT('queue.yourQueueToken', 'Your Queue Token')}</h2>
          <p className="text-slate-500 text-sm">{t.token_generated_desc || i18nT('queue.tokenGeneratedDesc', 'Your token has been generated. Please wait for your number to be called.')}</p>
        </div>

        {/* Token card */}
        <div className={`bg-white rounded-2xl border-2 shadow-xs p-6 text-center ${liveTicket.status === 'called' ? 'border-[#314ea1] ring-4 ring-blue-100' : 'border-slate-200/90'}`}>
          {liveTicket.status === 'called' && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white border border-blue-300 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="text-left">
                <p className="text-white font-black text-lg">🔔 {t.number_being_called || i18nT('queue.numberBeingCalled', 'Your number is being called!')}</p>
                <p className="text-blue-100 text-sm mt-0.5">{t.proceed_counter || i18nT('queue.proceedToCounter', 'Please proceed to the service counter.')}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/30 text-right shrink-0 ml-3">
                <p className="text-[10px] uppercase font-bold text-blue-100">{currentLang === 'am' ? 'የአገልግሎት መስኮት' : 'Service Window'}</p>
                <p className="text-2xl font-black text-[#f4b51a] leading-tight">
                  {currentLang === 'am' ? `መስኮት ${liveTicket.windowNumber || liveTicket.counterNumber || '1'}` : `Window #${liveTicket.windowNumber || liveTicket.counterNumber || '1'}`}
                </p>
              </div>
            </div>
          )}

          {liveTicket.status === 'completed' && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-emerald-800 font-bold text-lg">✅ {t.service_completed_title || i18nT('queue.serviceCompletedTitle', 'Service Completed')}</p>
              <p className="text-emerald-700 text-sm">{t.service_completed_desc || i18nT('queue.serviceCompletedDesc', 'Your queue session has been completed.')}</p>
            </div>
          )}

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.your_token || i18nT('queue.yourTokenNumber', 'Your Token Number')}</p>
          <p className="text-5xl font-extrabold text-[#1e3a8a] mb-2">{liveTicket.token}</p>
          <span className={`inline-block text-xs px-3 py-1 rounded-full font-semibold border ${STATUS_STYLES[liveTicket.status]}`}>
            {statusLabels[liveTicket.status] || liveTicket.status}
          </span>
        </div>

        {/* Queue status details */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-bold text-slate-900 text-base">{t.queue_status || i18nT('queue.queueStatus', 'Queue Status')}</h3>
            {connectionStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {i18nT('queue.liveTrackingActive', 'Live tracking active')}
              </span>
            ) : connectionStatus === 'connecting' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                {i18nT('queue.connecting', 'Connecting...')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200" title={connectionError || i18nT('queue.connectionLost', 'Connection lost')}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {i18nT('queue.offlineRetrying', 'Offline (retrying...)')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="text-center p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">{t.now_serving || i18nT('queue.nowServing', 'Now Serving')}</p>
              <p className="text-xl font-bold text-slate-900">{liveTicket.currentServing}</p>
            </div>
            <div className="text-center p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">{t.people_ahead || i18nT('queue.peopleAhead', 'People Ahead')}</p>
              <p className="text-xl font-bold text-[#314ea1]">{liveTicket.peopleAhead}</p>
            </div>
            <div className="text-center p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">{t.est_wait || i18nT('queue.estWait', 'Est. Wait')}</p>
              <p className="text-xl font-bold text-[#1e3a8a]">
                {formatEstimatedWait(liveTicket, t, i18nT)}
              </p>
            </div>
            <div className="text-center p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">{t.institution || i18nT('common.institution', 'Institution')}</p>
              <p className="text-sm font-semibold text-slate-900 leading-tight">{liveTicket.institutionName}</p>
            </div>
            <div className="text-center p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">{t.service || i18nT('common.service', 'Service')}</p>
              <p className="text-sm font-semibold text-slate-900 leading-tight">{liveTicket.serviceName}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:text-sm pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">{t.registered || i18nT('queue.registered', 'Registered')}</p>
              <p className="font-medium text-slate-800">
                {formatDisplayDate(liveTicket.createdAt, currentLang)}
                {' '}
                {new Date(liveTicket.createdAt).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {liveTicket.calledAt && (
              <div>
                <p className="text-xs text-slate-500">{t.called_at || i18nT('queue.calledAt', 'Called At')}</p>
                <p className="font-medium text-slate-800">
                  {new Date(liveTicket.calledAt).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
            {liveTicket.completedAt && (
              <div>
                <p className="text-xs text-slate-500">
                  {liveTicket.status === 'cancelled' ? (t.cancelled_at || i18nT('queue.cancelledAt', 'Cancelled At')) : (t.completed_at || i18nT('queue.completedAt', 'Completed At'))}
                </p>
                <p className="font-medium text-slate-800">
                  {new Date(liveTicket.completedAt).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' })}
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
            {t.leave_queue || i18nT('queue.leaveQueue', 'Leave Queue')}
          </button>
        )}

        {/* Feedback Rating - Only show for completed queue entries */}
        {liveTicket.status === 'completed' && liveTicket.institutionId && liveTicket.serviceId && (
          <div>
            <h3 className="font-bold text-slate-900 mb-4 text-base">{t.rate_your_experience || i18nT('feedback.rateYourExperience', 'Rate Your Experience')}</h3>
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
