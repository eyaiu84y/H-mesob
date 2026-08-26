import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { organizationsData } from '../data/organizations';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

function ServiceItem({ svc }) {
  const [open, setOpen] = useState(false);
  const { t, lang } = useApp();
  
  // Ensure we have valid service data
  if (!svc) return null;
  
  const title = lang === 'am' ? (svc.title_am || svc.title_en || '') : (svc.title_en || svc.title_am || '');
  const description = lang === 'am' ? (svc.description_am || '') : (svc.description_en || '');
  const docs  = lang === 'am' ? (svc.docs_am || []) : (svc.docs_en || []);
  
  // Don't render if no title
  if (!title) return null;

  return (
    <div className={`svc-item${open ? ' open' : ''}`}>
      <button type="button" className="svc-toggle" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <svg className="svc-chevron" xmlns="http://www.w3.org/2000/svg" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="svc-panel">
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            {description}
          </p>
        )}
        <div className="svc-meta">
          <div><span>{t.org_time_label}</span><br /><strong>{svc.time}</strong></div>
          <div><span>{t.org_fee_label}</span><br /><strong>{svc.fee}</strong></div>
        </div>
        <div className="svc-docs-title">{t.org_docs_label}</div>
        <ul className="svc-docs">
          {Array.isArray(docs) && docs.map((doc, i) => <li key={i}>{doc}</li>)}
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
  );
}

export default function ServiceCataloguePage() {
  const { t, lang } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const [expandedOrg, setExpandedOrg] = useState(null);

  // Update URL when search input changes
  const handleSearchChange = (value) => {
    if (value.trim()) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  const filtered = organizationsData.filter((org) => {
    const q = search.toLowerCase();
    return (
      org.name_en.toLowerCase().includes(q) ||
      org.name_am.toLowerCase().includes(q) ||
      org.services.some((s) => 
        s.title_en.toLowerCase().includes(q) || 
        s.title_am.toLowerCase().includes(q)
      )
    );
  });

  const displayName = (org) => lang === 'am' ? org.name_am : org.name_en;
  const svcCount = (n) => `${n} ${n === 1 ? (lang === 'am' ? 'አገልግሎት' : 'service') : (lang === 'am' ? 'አገልግሎቶች' : 'services')}`;

  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-gray-50 dark:bg-gray-900">

        {/* Page Hero */}
        <div className="bg-mesob-gradient text-white py-14 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">{t.cat_title || 'Service Catalogue'}</h1>
          <p className="text-white/80 text-lg mb-8">{t.cat_subtitle || 'Browse all available services from government institutions'}</p>
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t.cat_search_ph || 'Search services or institutions...'}
                className="w-full px-6 py-4 pl-12 rounded-full text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-base shadow-lg"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Org + Services List */}
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
          {filtered.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-16 text-lg">
              {t.cat_no_results || 'No results found for'} &ldquo;{search}&rdquo;
            </div>
          )}

          {filtered.map((org) => {
            const isExpanded = expandedOrg === org.id;
            return (
              <div key={org.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
                <button
                  className="w-full flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                  onClick={() => setExpandedOrg(isExpanded ? null : org.id)}
                >
                  <img
                    src={org.image}
                    alt={displayName(org)}
                    className="w-14 h-14 object-contain rounded-xl flex-shrink-0 bg-gray-50 dark:bg-gray-700 p-1"
                    onError={(e) => { e.target.src = '/image/icon.png'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-snug">
                      {displayName(org)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {svcCount(org.services.length)}
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                    {org.officialUrl && org.officialUrl !== '#' && (
                      <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <a 
                          href={org.officialUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {lang === 'am' ? 'ኦፊሴላዊ ድረ-ገጽን ይጎብኙ' : 'Visit Official Website'}
                        </a>
                      </div>
                    )}
                    {org.services.map((svc, i) => (
                      <ServiceItem key={i} svc={svc} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center pb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {t.cat_back || '← Back to Home'}
          </Link>
        </div>

      </main>
      <Footer />
    </>
  );
}
