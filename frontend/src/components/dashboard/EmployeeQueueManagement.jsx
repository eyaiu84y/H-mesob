import { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getLocalizedStatus, getInstitutionName, getServiceName } from '../../utils/localizedContent';

const STATUS_STYLES = {
  waiting:   'bg-amber-50 text-amber-800 border border-amber-200',
  called:    'bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold',
  completed: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-800 border border-rose-200',
};

function QueueTokenCard({ ticket, isCurrent }) {
  const { lang } = useApp();
  return (
    <div className={`bg-white rounded-2xl border p-4 shadow-xs transition ${isCurrent ? 'border-[#314ea1] ring-2 ring-[#314ea1]/20' : 'border-slate-200/90 hover:border-slate-300'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-xs ${isCurrent ? 'bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a]' : 'bg-slate-100 text-slate-700'}`}>
            {ticket.token}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{getServiceName(ticket.serviceName, lang)}</p>
            <p className="text-xs text-slate-500">{getInstitutionName(ticket.institutionName, lang)}</p>
          </div>
        </div>
        <span className={`badge text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[ticket.status] || 'bg-slate-100 text-slate-700'}`}>
          {getLocalizedStatus(ticket.status === 'called' ? 'CALLED' : ticket.status, lang)}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-500">{lang === 'am' ? 'የተመዘገበበት ሰዓት' : 'Registered'}</p>
          <p className="font-medium text-slate-700">
            {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {ticket.calledAt && (
          <div>
            <p className="text-xs text-slate-500">{lang === 'am' ? 'የተጠራበት ሰዓት' : 'Called At'}</p>
            <p className="font-medium text-slate-700">
              {new Date(ticket.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>

      {/* Called window badge */}
      {(isCurrent || ticket.status === 'called') && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {lang === 'am' ? 'የአገልግሎት መስኮት' : 'Service Window / Desk'}
          </span>
          <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-[#1e3a8a] text-white shadow-2xs">
            {lang === 'am' ? `መስኮት ${ticket.windowNumber || ticket.counterNumber || '1'}` : `Window #${ticket.windowNumber || ticket.counterNumber || '1'}`}
          </span>
        </div>
      )}
    </div>
  );
}

export default function EmployeeQueueManagement() {
  const { user } = useAuth();
  const { t, lang } = useApp();
  const { myTickets, getInstitutionQueue, getCurrentServing, callNextToken, completeCurrentToken, loading, refreshQueues } = useQueue();
  
  // Use institution_id directly from authenticated user (this is UUID from backend)
  const institutionId = user?.institution_id || null;
  const [actionMessage, setActionMessage] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  // Auto-refresh on mount and when institution changes
  useEffect(() => {
    if (institutionId) {
      refreshQueues();
    }
  }, [institutionId, refreshQueues]);
  
  if (!institutionId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">{t.my_queue}</h2>
          <p className="text-slate-600 text-sm">{lang === 'am' ? 'ለተቋምዎ የተራ ቲኬቶችን ያስተዳድሩ።' : 'Manage queue tokens for your institution.'}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-medium text-slate-700">{lang === 'am' ? 'የተመደበ ተቋም የለም' : 'No Institution Assigned'}</p>
          <p className="text-sm text-slate-500 mt-1">{lang === 'am' ? 'ለተራ አስተዳደር የተመደቡበት ተቋም የለም።' : 'You are not assigned to any institution for queue management.'}</p>
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
      setActionMessage(lang === 'am' ? 'የሚጠራ ደንበኛ የለም።' : 'No waiting customers to call.');
      setTimeout(() => setActionMessage(''), 3000);
      return;
    }

    setActionInProgress(true);
    try {
      await callNextToken(institutionId);
      setActionMessage(lang === 'am' ? 'ቀጣዩ ደንበኛ በተሳካ ሁኔታ ተጠርቷል!' : 'Next customer called successfully!');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage(err.message || (lang === 'am' ? 'ቀጣዩን ደንበኛ መጥራት አልተቻለም' : 'Failed to call next customer'));
      setTimeout(() => setActionMessage(''), 3000);
    } finally {
      setActionInProgress(false);
    }
  }

  async function handleCompleteCurrent() {
    if (actionInProgress) return;
    
    if (!currentServing) {
      setActionMessage(lang === 'am' ? 'በአሁኑ ሰዓት የሚስተናገድ ደንበኛ የለም።' : 'No customer currently being served.');
      setTimeout(() => setActionMessage(''), 3000);
      return;
    }

    setActionInProgress(true);
    try {
      await completeCurrentToken(institutionId);
      setActionMessage(lang === 'am' ? 'ደንበኛው አገልግሎት አግኝቶ ተጠናቋል።' : 'Customer marked as completed.');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage(err.message || (lang === 'am' ? 'አገልግሎቱን ማጠናቀቅ አልተቻለም' : 'Failed to complete service'));
      setTimeout(() => setActionMessage(''), 3000);
    } finally {
      setActionInProgress(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">{t.my_queue}</h2>
        <p className="text-slate-600 text-sm">
          {lang === 'am' ? `የተራ ቲኬቶችን ያስተዳድሩ – ${getInstitutionName(user?.institution, lang)}` : `Manage queue tokens for ${user?.institution}.`}
        </p>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium border shadow-xs ${
          actionMessage.includes('successfully') || actionMessage.includes('completed') || actionMessage.includes('ተሳካ') || actionMessage.includes('ተጠናቋል')
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          {actionMessage}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{t.current_customer_at_counter}</h3>
            {currentServing && (
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                {lang === 'am' ? `መስኮት ${currentServing.windowNumber || currentServing.counterNumber || user?.counter_number || '1'}` : `Window #${currentServing.windowNumber || currentServing.counterNumber || user?.counter_number || '1'}`}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {currentServing ? (lang === 'am' ? '1 ደንበኛ' : '1 customer') : (lang === 'am' ? 'ምንም ደንበኛ የለም' : 'No customer')}
          </span>
        </div>
        
        {currentServing ? (
          <div className="p-6">
            <QueueTokenCard ticket={currentServing} isCurrent={true} />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleCompleteCurrent}
                disabled={actionInProgress || loading}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-sm font-medium shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {actionInProgress ? (lang === 'am' ? 'በማስተናገድ ላይ...' : 'Processing...') : t.complete_service}
              </button>
              <button
                onClick={handleCallNext}
                disabled={actionInProgress || loading}
                className="px-5 py-3 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] text-white hover:from-[#253d82] hover:to-[#172554] rounded-xl transition text-sm font-medium shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {actionInProgress ? (lang === 'am' ? 'በማስተናገድ ላይ...' : 'Processing...') : t.call_next_customer}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium text-slate-700">{t.no_citizen_called}</p>
            <p className="text-sm text-slate-500 mt-1">{lang === 'am' ? 'ቀጣዩን ደንበኛ ለማስተናገድ "ቀጣዩን ዜጋ ጥራ" የሚለውን ይጫኑ' : 'Click "Call Next Citizen" to serve the next waiting customer'}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-semibold text-slate-900">{lang === 'am' ? 'የሚጠባበቁ ደንበኞች ሰልፍ' : 'Waiting Queue'}</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{waitingCount} {lang === 'am' ? 'በመጠባበቅ ላይ' : 'waiting'}</span>
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
            <p className="font-medium text-slate-700">{lang === 'am' ? 'የሚጠባበቅ ደንበኛ የለም' : 'No waiting customers'}</p>
            <p className="text-sm text-slate-500 mt-1">{lang === 'am' ? 'ሰልፉ ባዶ ነው' : 'The queue is empty'}</p>
          </div>
        )}
      </div>

      {!currentServing && waitingCount > 0 && (
        <button
          onClick={handleCallNext}
          className="w-full px-6 py-4 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] text-white hover:from-[#253d82] hover:to-[#172554] rounded-xl transition text-sm font-semibold shadow-xs cursor-pointer"
        >
          {t.call_next_customer} ({waitingCount} {lang === 'am' ? 'በመጠባበቅ ላይ' : 'waiting'})
        </button>
      )}

      <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-sm text-[#1e3a8a] shadow-xs">
        <strong className="font-semibold">{lang === 'am' ? 'የተራ አሰራር መመሪያ:' : 'Queue Operations:'}</strong>{' '}
        {lang === 'am'
          ? 'ቀጣዩን ተራ ቁጥር በራስ-ሰር ለመምረጥ "ቀጣዩን ዜጋ ጥራ" የሚለውን ይጫኑ። ስርዓቱ የአሁኑን አገልግሎት አጠናቆ ቀጣዩን በቅደም ተከተል ይጠራል። ሰራተኞች በእጅ ቲኬት መፍጠር ወይም ለሌላ ተቋም ተራ ማስኬድ አይችሉም።'
          : 'Click "Call Next" to automatically select the next waiting token. The system will complete the current serving token and call the next one in order. You cannot manually create tokens or operate queues for other institutions.'}
      </div>
    </div>
  );
}