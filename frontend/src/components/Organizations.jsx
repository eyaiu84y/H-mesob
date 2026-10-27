import { useState } from 'react';
import { organizationsData } from '../data/organizations';
import { useApp } from '../context/AppContext';
import { formatServiceTime, formatServiceFee } from '../utils/formatters';

function orgName(org, lang) {
  return lang === 'am' ? org.name_am : org.name_en;
}
function svcTitle(svc, lang) {
  return lang === 'am' ? svc.title_am : svc.title_en;
}
function svcDesc(svc, lang) {
  return lang === 'am' ? (svc.description_am || '') : (svc.description_en || '');
}

function OrgModal({ org, onClose, t, lang }) {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
    
    // Auto-scroll to the opened service after a short delay
    if (openIndex !== index) {
      setTimeout(() => {
        const element = document.getElementById(`service-${index}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 120);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden z-10 animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="pr-4">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {orgName(org, lang)} {t.org_modal_suffix || (lang === 'am' ? '– አገልግሎቶች' : '– Services')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {org.services?.length || 0} {lang === 'am' ? 'አገልግሎቶች ተገኝተዋል' : 'services available'}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition flex-shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body - Accordion Services List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 divide-y-0">
          {org.services.map((svc, i) => {
            const isOpen = openIndex === i;
            const docs = Array.isArray(lang === 'am' ? svc.docs_am : svc.docs_en) 
              ? (lang === 'am' ? svc.docs_am : svc.docs_en) 
              : (Array.isArray(svc.docs_en) ? svc.docs_en : (Array.isArray(svc.docs_am) ? svc.docs_am : []));

            return (
              <div 
                key={i} 
                id={`service-${i}`} 
                className={`rounded-2xl transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'bg-slate-50 dark:bg-slate-800/90 border-2 border-blue-500 shadow-md ring-2 ring-blue-500/10' 
                    : 'bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-slate-600 hover:shadow-xs'
                }`}
              >
                {/* Service Item Header Toggle */}
                <button 
                  type="button" 
                  onClick={() => handleToggle(i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 font-semibold text-base text-slate-900 dark:text-white transition cursor-pointer"
                >
                  <span className="leading-snug flex-1">
                    {svcTitle(svc, lang)}
                  </span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isOpen 
                      ? 'bg-blue-600 text-white rotate-180' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                  }`}>
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Service Item Open Panel */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-200/80 dark:border-slate-700/80 space-y-4">
                    {/* Description */}
                    {svcDesc(svc, lang) && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
                        {svcDesc(svc, lang)}
                      </p>
                    )}

                    {/* Metadata Grid: Time & Fee */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-blue-50/70 dark:bg-slate-900/70 rounded-xl border border-blue-100 dark:border-slate-700/80 mt-2">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                          {t.org_time_label || (lang === 'am' ? 'የአገልግሎት ጊዜ' : 'Processing Time')}
                        </span>
                        <strong className="text-sm font-bold text-slate-900 dark:text-white block">
                          {formatServiceTime(svc.time, lang)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                          {t.org_fee_label || (lang === 'am' ? 'የአገልግሎት ክፍያ' : 'Service Fee')}
                        </span>
                        <strong className="text-sm font-bold text-slate-900 dark:text-white block">
                          {formatServiceFee(svc.fee, lang)}
                        </strong>
                      </div>
                    </div>

                    {/* Requirement Documents */}
                    {docs && docs.length > 0 && (
                      <div className="mt-3.5 p-4 bg-slate-100/70 dark:bg-slate-900/50 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2.5 flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {t.org_docs_label || (lang === 'am' ? 'አስፈላጊ ሰነዶች' : 'Required Documents')}
                        </h4>
                        <ul className="space-y-2">
                          {docs.map((doc, j) => (
                            <li key={j} className="text-sm text-slate-800 dark:text-slate-200 flex items-start gap-2 leading-relaxed">
                              <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5 text-base leading-none">•</span>
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Official Website Button */}
                    {svc.officialUrl && svc.officialUrl !== '#' && (
                      <div className="pt-1">
                        <a 
                          href={svc.officialUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {lang === 'am' ? 'ኦፊሴላዊ የአገልግሎት ድረ-ገጽን ይጎብኙ' : 'Visit Official Service Website'}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default function Organizations() {
  const { t, lang } = useApp();
  const [selectedOrg, setSelectedOrg] = useState(null);

  return (
    <>
      <section id="organizations" className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 dark:bg-purple-900/10 rounded-full blur-3xl opacity-30"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold uppercase tracking-wider">
                {lang === 'am' ? 'የመንግስት ተቋማት' : 'Government Organizations'}
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t.org_title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t.org_subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {organizationsData.map((org) => {
              const count = org.services.length;
              return (
                <div
                  key={org.id}
                  className={`org-card org-${org.id} flex flex-col justify-between`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="org-card-img-wrap">
                      <img
                        src={org.image}
                        alt={orgName(org, lang)}
                        className="org-card-img"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <h5 className="font-bold text-base leading-snug">
                      {orgName(org, lang)}
                    </h5>
                  </div>

                  <div className="mt-4 pt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      className="org-btn"
                      onClick={() => setSelectedOrg(org)}
                    >
                      {t.org_btn}
                    </button>
                    <span className="text-xs text-center text-gray-500 dark:text-gray-400">
                      {count} {lang === 'am' ? 'አገልግሎቶች' : 'services'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {selectedOrg && (
        <OrgModal
          org={selectedOrg}
          onClose={() => setSelectedOrg(null)}
          t={t}
          lang={lang}
        />
      )}
    </>
  );
}
