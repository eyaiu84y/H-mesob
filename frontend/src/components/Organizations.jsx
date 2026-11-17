import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { organizationsData } from '../data/organizations';
import { getInstitutionTheme } from '../data/institutionThemes';
import { useApp } from '../context/AppContext';
import { formatServiceTime, formatServiceFee } from '../utils/formatters';
import { getInstitutionName, getServiceTitle, getServiceDescription, getServiceRequirements } from '../utils/localizedContent';

function OrgModal({ org, onClose, t, currentLang }) {
  const [openIndex, setOpenIndex] = useState(null);
  const { t: i18nT } = useTranslation();
  const theme = getInstitutionTheme(org.id);

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
        {/* Top institution brand accent bar */}
        <div className={`h-1.5 w-full ${theme.topBarGradient}`} />

        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3.5 pr-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-slate-200/90 dark:border-white/20 p-2 flex items-center justify-center shrink-0">
              <img
                src={org.image}
                alt=""
                className="max-w-full max-h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug truncate">
                {getInstitutionName(org, currentLang)} {currentLang === 'am' ? '– አገልግሎቶች' : (t.org_modal_suffix || i18nT('organizations.servicesSuffix', '– Services'))}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {org.services?.length || 0}{' '}
                {org.services?.length === 1
                  ? (currentLang === 'am' ? 'አገልግሎት ይገኛል' : i18nT('organizations.serviceAvailable', 'service available'))
                  : (currentLang === 'am' ? 'አገልግሎቶች ይገኛሉ' : i18nT('organizations.servicesAvailable', 'services available'))}
              </p>
            </div>
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
            const docs = getServiceRequirements(svc, currentLang);

            return (
              <div 
                key={i} 
                id={`service-${i}`} 
                style={{ borderColor: isOpen ? theme.brandColor : undefined }}
                className={`rounded-2xl transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'bg-slate-50 dark:bg-slate-800/90 border-2 shadow-md ring-2 ring-black/5 dark:ring-white/5' 
                    : 'bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs'
                }`}
              >
                {/* Service Item Header Toggle */}
                <button 
                  type="button" 
                  onClick={() => handleToggle(i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 font-semibold text-base text-slate-900 dark:text-white transition cursor-pointer"
                >
                  <span className="leading-snug flex-1">
                    {getServiceTitle(svc, currentLang)}
                  </span>
                  <div 
                    style={{ background: isOpen ? theme.brandColor : undefined }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isOpen 
                        ? 'text-white rotate-180' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                    }`}
                  >
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Service Item Open Panel */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-200/80 dark:border-slate-700/80 space-y-4">
                    {/* Description */}
                    {getServiceDescription(svc, currentLang) && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
                        {getServiceDescription(svc, currentLang)}
                      </p>
                    )}

                    {/* Metadata Grid: Time & Fee */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-100/70 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-700/80 mt-2">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                          {currentLang === 'am' ? 'የሂደት ጊዜ' : (t.org_time_label || i18nT('common.processingTime', 'Processing Time'))}
                        </span>
                        <strong className="text-sm font-bold text-slate-900 dark:text-white block">
                          {formatServiceTime(svc.time, currentLang)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                          {currentLang === 'am' ? 'የአገልግሎት ክፍያ' : (t.org_fee_label || i18nT('common.serviceFee', 'Service Fee'))}
                        </span>
                        <strong className="text-sm font-bold text-slate-900 dark:text-white block">
                          {formatServiceFee(svc.fee, currentLang)}
                        </strong>
                      </div>
                    </div>

                    {/* Requirement Documents */}
                    {docs && docs.length > 0 && (
                      <div className="mt-3.5 p-4 bg-slate-100/70 dark:bg-slate-900/50 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                        <h4 
                          style={{ color: theme.brandColor }}
                          className="text-xs font-extrabold uppercase tracking-wider mb-2.5 flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {currentLang === 'am' ? 'የሚያስፈልጉ ሰነዶች' : (t.org_docs_label || i18nT('common.requiredDocuments', 'Required Documents'))}
                        </h4>
                        <ul className="space-y-2">
                          {docs.map((doc, j) => (
                            <li key={j} className="text-sm text-slate-800 dark:text-slate-200 flex items-start gap-2 leading-relaxed">
                              <span style={{ color: theme.brandColor }} className="font-bold mt-0.5 text-base leading-none">•</span>
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
                          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl shadow-xs transition ${theme.light.btnBg} ${theme.light.btnText} ${theme.dark.btnBg} ${theme.dark.btnText}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {currentLang === 'am' ? 'ይፋዊውን የአገልግሎት ድረ-ገጽ ይጎብኙ' : i18nT('organizations.visitOfficialWebsite', 'Visit Official Service Website')}
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
  const { t } = useApp();
  const { i18n, t: i18nT } = useTranslation();
  const [selectedOrg, setSelectedOrg] = useState(null);
  const currentLang = i18n.language || 'en';

  return (
    <>
      <section id="organizations" className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#314ea1]/5 dark:bg-blue-600/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f4b51a]/5 dark:bg-amber-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight leading-tight">
              {t.org_title}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-normal">
              {t.org_subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {organizationsData.map((org) => {
              const count = org.services.length;
              const orgTitle = getInstitutionName(org, currentLang);
              const theme = getInstitutionTheme(org.id);

              return (
                <div
                  key={org.id}
                  onClick={() => setSelectedOrg(org)}
                  className={`group relative flex flex-col justify-between rounded-2xl p-4 sm:p-4.5 transition-all duration-300 cursor-pointer overflow-hidden border
                    ${theme.light.cardBg} ${theme.light.border} ${theme.light.hoverBorder} ${theme.light.shadow}
                    ${theme.dark.cardBg} ${theme.dark.border} ${theme.dark.hoverBorder} ${theme.dark.shadow}
                    hover:-translate-y-1`}
                >
                  {/* Top institution brand accent bar */}
                  <div className={`absolute top-0 inset-x-0 h-1 ${theme.topBarGradient} transition-all duration-300 group-hover:h-1.5`} />

                  {/* Subtle radial ambient glow on card hover */}
                  <div 
                    className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: theme.glowColor }}
                  />

                  {/* Card Content Top: Logo & Title */}
                  <div className="flex flex-col items-center text-center relative z-10 pt-0.5">
                    {/* Elevated Curated Logo Container (clean white tile with soft border & shadow) */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white shadow-xs border border-slate-200/90 dark:border-white/20 p-2 sm:p-2.5 flex items-center justify-center mb-2.5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-sm">
                      <img
                        src={org.image}
                        alt={orgTitle}
                        className="max-w-full max-h-full object-contain drop-shadow-xs"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Institution Title */}
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 min-h-[2.35rem] flex items-center justify-center mb-2 px-1">
                      {orgTitle}
                    </h3>

                    {/* Services count pill badge */}
                    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors
                      ${theme.light.badgeBg} ${theme.light.badgeText} ${theme.light.badgeBorder}
                      ${theme.dark.badgeBg} ${theme.dark.badgeText} ${theme.dark.badgeBorder}`}
                    >
                      <svg className="w-3 h-3 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>
                        {count} {currentLang === 'am' ? (count > 1 ? 'አገልግሎቶች' : 'አገልግሎት') : (count > 1 ? 'Services' : 'Service')}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Interactive View Services Button */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 relative z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrg(org);
                      }}
                      className={`w-full py-2 px-3 rounded-lg sm:rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all duration-200 cursor-pointer
                        ${theme.light.btnBg} ${theme.light.btnText} ${theme.light.btnShadow}
                        ${theme.dark.btnBg} ${theme.dark.btnText} ${theme.dark.btnShadow}
                        group-hover:shadow-sm`}
                    >
                      <span>{currentLang === 'am' ? 'አገልግሎቶችን ይመልከቱ' : 'View Services'}</span>
                      <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
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
          currentLang={currentLang}
        />
      )}
    </>
  );
}
