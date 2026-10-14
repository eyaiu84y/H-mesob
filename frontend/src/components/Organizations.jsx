import { useState } from 'react';
import { organizationsData } from '../data/organizations';
import { useApp } from '../context/AppContext';

function orgName(org, lang) {
  return lang === 'am' ? org.name_am : org.name_en;
}
function svcTitle(svc, lang) {
  return lang === 'am' ? svc.title_am : svc.title_en;
}
function svcDesc(svc, lang) {
  return lang === 'am' ? (svc.description_am || '') : (svc.description_en || '');
}
function svcDocs(svc, lang) {
  return lang === 'am' ? svc.docs_am : svc.docs_en;
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
      }, 100);
    }
  };

  return (
    <div className="org-modal">
      <div className="org-modal-backdrop" onClick={onClose}></div>
      <div className="org-modal-panel">
        <div className="org-modal-header">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {orgName(org, lang)} {t.org_modal_suffix}
          </h3>
          <button type="button" onClick={onClose} className="org-modal-close" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="org-modal-body">
          {org.services.map((svc, i) => (
            <div key={i} id={`service-${i}`} className={`svc-item${openIndex === i ? ' open' : ''}`}>
              <button type="button" className="svc-toggle"
                onClick={() => handleToggle(i)}>
                <span>{svcTitle(svc, lang)}</span>
                <svg className="svc-chevron" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="svc-panel">
                {svcDesc(svc, lang) && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {svcDesc(svc, lang)}
                  </p>
                )}
                <div className="svc-meta">
                  <div><span>{t.org_time_label}</span><br /><strong>{svc.time}</strong></div>
                  <div><span>{t.org_fee_label}</span><br /><strong>{svc.fee}</strong></div>
                </div>
                <div className="svc-docs-title">{t.org_docs_label}</div>
                <ul className="svc-docs">
                  {svcDocs(svc, lang).map((doc, j) => <li key={j}>{doc}</li>)}
                </ul>
                {svc.officialUrl && svc.officialUrl !== '#' && (
                  <a className="svc-link" href={svc.officialUrl} target="_blank" rel="noopener noreferrer">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {lang === 'am' ? 'ኦፊሴላዊ የአገልግሎት ድረ-ገጽን ይጎብኙ' : 'Visit Official Service Website'}
                  </a>
                )}
              </div>
            </div>
          ))}
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
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t.org_subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {organizationsData.map((org, index) => (
              <div 
                key={org.id} 
                className={`org-card org-color-${org.id} transform hover:scale-105 transition-all duration-300`}
                onClick={() => setSelectedOrg(org)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <img src={org.image} alt={orgName(org, lang)}
                  onError={(e) => { e.target.src = '/image/icon.png'; }} />
                <h5>{orgName(org, lang)}</h5>
                <button type="button" className="org-btn"
                  onClick={(e) => { e.stopPropagation(); setSelectedOrg(org); }}>
                  {t.org_btn}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedOrg && (
        <OrgModal org={selectedOrg} onClose={() => setSelectedOrg(null)} t={t} lang={lang} />
      )}
    </>
  );
}
