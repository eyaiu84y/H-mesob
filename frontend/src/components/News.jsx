import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAnnouncements } from '../context/AnnouncementContext';

export default function News() {
  const { t, lang } = useApp();
  const { announcements, fetchAnnouncements, loading } = useAnnouncements();
  const [selectedNews, setSelectedNews] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const INITIAL_LIMIT = 3;

  // Fetch public announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Filter only PUBLIC announcements
  const publicAnnouncements = announcements.filter(a => a.scope === 'PUBLIC');
  const displayedAnnouncements = showAll ? publicAnnouncements : publicAnnouncements.slice(0, INITIAL_LIMIT);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <section id="news" className="news" style={{ padding: '5rem 0' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{t.news_title}</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mt-3 font-medium">{t.news_subtitle}</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading news...</p>
          </div>
        ) : publicAnnouncements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No news available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left: News List */}
            <div className="lg:col-span-5 space-y-6">
              {displayedAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  onClick={() => setSelectedNews(announcement)}
                  className={`news-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow hover:shadow-xl cursor-pointer transition border ${
                    selectedNews?.id === announcement.id 
                      ? 'border-blue-500' 
                      : 'border-transparent hover:border-blue-200'
                  }`}
                >
                  <span className="text-xs font-medium text-blue-600">
                    {lang === 'am' 
                      ? (announcement.institutions?.name_am || 'መሶብ ማዕከል')
                      : (announcement.institutions?.name_en || 'MESOB Center')
                    }
                  </span>
                  <h3 className="font-semibold text-xl mt-2 leading-tight text-gray-900 dark:text-white">
                    {lang === 'am' ? (announcement.title_am || announcement.title) : announcement.title}
                  </h3>
                  <p className="text-base text-gray-700 dark:text-gray-300 mt-3 line-clamp-2">
                    {lang === 'am' ? (announcement.content_am || announcement.content) : announcement.content}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                    <span>{formatDate(announcement.published_at)}</span>
                  </div>
                </div>
              ))}

              {/* Show More / Show Less Button if announcements count > INITIAL_LIMIT */}
              {publicAnnouncements.length > INITIAL_LIMIT && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (showAll) {
                        setShowAll(false);
                        const el = document.getElementById('news');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        setShowAll(true);
                      }
                    }}
                    className="w-full py-3 px-5 rounded-2xl border border-blue-200/90 dark:border-blue-800/60 bg-blue-50/70 hover:bg-blue-100/90 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-[#1e3a8a] dark:text-blue-300 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs cursor-pointer group"
                  >
                    <span>
                      {showAll
                        ? (lang === 'am' ? 'ያነሰ አሳይ' : 'Show Less')
                        : (lang === 'am'
                            ? `ተጨማሪ አሳይ (${publicAnnouncements.length - INITIAL_LIMIT})`
                            : `Show More (${publicAnnouncements.length - INITIAL_LIMIT})`
                          )
                      }
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${showAll ? 'rotate-180' : 'group-hover:translate-y-0.5'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Article Content */}
            <div className="lg:col-span-7">
              {selectedNews ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 lg:p-12 shadow-xl min-h-[500px]">
                  <div className="mb-6">
                    <span className="text-sm font-medium text-blue-600">
                      {lang === 'am' 
                        ? (selectedNews.institutions?.name_am || 'መሶብ ማዕከል')
                        : (selectedNews.institutions?.name_en || 'MESOB Center')
                      }
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2 mb-4">
                      {lang === 'am' ? (selectedNews.title_am || selectedNews.title) : selectedNews.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatDate(selectedNews.published_at)}</span>
                    </div>
                  </div>
                  
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="text-lg leading-8 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {lang === 'am' ? (selectedNews.content_am || selectedNews.content) : selectedNews.content}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedNews(null)}
                    className="mt-8 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                  >
                    {t.news_back}
                  </button>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center h-full flex items-center justify-center min-h-[500px]">
                  <p className="text-gray-400 text-xl">{t.news_placeholder}</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </section>
  );
}
