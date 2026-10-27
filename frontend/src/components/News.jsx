import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAnnouncements } from '../context/AnnouncementContext';
import { formatDisplayDate } from '../utils/formatters';

const ANNOUNCEMENT_AM_FALLBACKS = {
  'New Online Services Launched': {
    title: 'አዳዲስ የመስመር ላይ አገልግሎቶች ተጀምረዋል',
    content: 'የሃዋሳ መሶብ ዲጂታል አገልግሎት አሁን በይፋ ተጀምሯል። ዜጎች ከመኖሪያ ቤታቸው ሆነው የተለያዩ የመንግስት አገልግሎቶችን በቀላሉ ማግኘት ይችላሉ።',
  },
  'Service Hours Update': {
    title: 'የአገልግሎት ሰዓት ማሻሻያ',
    content: 'የሃዋሳ መሶብ ማዕከል የህዝብ አገልግሎት ሰዓት ከሰኞ እስከ አርብ ከጠዋቱ 2:30 እስከ 11:30፣ እንዲሁም ቅዳሜ ከጠዋቱ 2:30 እስከ 6:30 ክፍት መሆኑን እናሳውቃለን።',
  },
  'System Maintenance Notice': {
    title: 'የሲስተም ጥገና ማስታወቂያ',
    content: 'የአገልግሎት ጥራትን ለማሻሻል በሚደረገው የሲስተም ጥገና ምክንያት አገልግሎቱ በከፊል ሊቋረጥ ስለሚችል አስቀድመን ይቅርታ እንጠይቃለን።',
  },
  'MESOB Center Establishment 2025': {
    title: 'የመሶብ ማዕከል መመስረቻ 2025',
    content: 'ኢትዮጵያ የመሶብ ማዕከልን መመስረት ታከብራለች። የተቀናጀና ዘመናዊ አገልግሎት ለሁሉም ዜጎች ተደራሽ ለማድረግ በትኩረት እየተሰራ ነው።',
  },
  'Leadership Training Program 2026': {
    title: 'የአመራር ስልጠና ፕሮግራም 2026',
    content: 'የመሶብ አመራርና ሰራተኞች የአገልግሎት አሰጣጥ ጥራትን ለማሳደግ ያለመ አዲስ የአቅም ግንባታ ስልጠና ጀምረዋል።',
  },
  'FDRE MESOB Achieves 98.7% Citizen Satisfaction': {
    title: 'FDRE MESOB 98.7% የዜጎች እርካታ አሳካ',
    content: 'በተካሄደው የዜጎች እርካታ ዳሰሳ ጥናት መሠረት የሃዋሳ መሶብ ማዕከል 98.7% ከፍተኛ እርካታ አስመዝግቧል።',
  }
};

function getAnnouncementTitle(announcement, lang) {
  if (!announcement) return '';
  if (lang === 'am') {
    if (announcement.title_am && announcement.title_am.trim()) return announcement.title_am;
    if (announcement.title && ANNOUNCEMENT_AM_FALLBACKS[announcement.title.trim()]) {
      return ANNOUNCEMENT_AM_FALLBACKS[announcement.title.trim()].title;
    }
    return announcement.title_am || announcement.title || '';
  }
  return announcement.title_en || announcement.title || '';
}

function getAnnouncementContent(announcement, lang) {
  if (!announcement) return '';
  if (lang === 'am') {
    if (announcement.content_am && announcement.content_am.trim()) return announcement.content_am;
    if (announcement.title && ANNOUNCEMENT_AM_FALLBACKS[announcement.title.trim()]) {
      return ANNOUNCEMENT_AM_FALLBACKS[announcement.title.trim()].content;
    }
    return announcement.content_am || announcement.content || '';
  }
  return announcement.content_en || announcement.content || '';
}

export default function News() {
  const { t, lang } = useApp();
  const { announcements, fetchAnnouncements, loading } = useAnnouncements();
  const [selectedId, setSelectedId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const INITIAL_LIMIT = 3;

  // Fetch public announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Filter only PUBLIC announcements
  const publicAnnouncements = announcements.filter(a => a.scope === 'PUBLIC');
  const displayedAnnouncements = showAll ? publicAnnouncements : publicAnnouncements.slice(0, INITIAL_LIMIT);

  // Active news item: the selected one, or default to the latest (first) announcement!
  const activeNews = publicAnnouncements.find(a => a.id === selectedId) || publicAnnouncements[0] || null;

  // Format date helper with proper Amharic month names
  const formatDate = (dateString) => formatDisplayDate(dateString, lang);

  return (
    <section id="news" className="news" style={{ padding: '5rem 0' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{t.news_title}</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mt-3 font-medium">{t.news_subtitle}</p>
        </div>

        {loading && publicAnnouncements.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{lang === 'am' ? 'ዜናዎችን በመጫን ላይ...' : 'Loading news...'}</p>
          </div>
        ) : publicAnnouncements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">{lang === 'am' ? 'በአሁኑ ጊዜ ምንም ዜና የለም።' : 'No news available at this time.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left: News List (Pure text cards) */}
            <div className="lg:col-span-5 space-y-4">
              {displayedAnnouncements.map((announcement) => {
                const isActive = activeNews?.id === announcement.id;

                return (
                  <div
                    key={announcement.id}
                    onClick={() => {
                      setSelectedId(announcement.id);
                      if (window.innerWidth < 1024) {
                        document.getElementById('news-article-view')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={`news-card bg-white dark:bg-gray-800 p-5 rounded-2xl shadow transition-all duration-200 cursor-pointer border ${
                      isActive 
                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-blue-50/20 dark:bg-blue-900/10' 
                        : 'border-slate-200/90 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                    }`}
                  >
                    <div className="mb-1.5">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {lang === 'am' 
                          ? (announcement.institutions?.name_am || 'መሶብ ማዕከል')
                          : (announcement.institutions?.name_en || 'MESOB Center')
                        }
                      </span>
                    </div>

                    <h3 className="font-bold text-lg leading-snug text-gray-900 dark:text-white">
                      {getAnnouncementTitle(announcement, lang)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                      {getAnnouncementContent(announcement, lang)}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-3 pt-2 border-t border-slate-100 dark:border-gray-700/60">
                      <span>{formatDate(announcement.published_at)}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center gap-1">
                        {lang === 'am' ? 'ሙሉውን አንብብ' : 'Read more'} →
                      </span>
                    </div>
                  </div>
                );
              })}

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

            {/* Right: Article Content (Pure text display) */}
            <div id="news-article-view" className="lg:col-span-7 sticky top-24">
              {activeNews ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 lg:p-9 shadow-xl border border-slate-200/80 dark:border-gray-700">
                  <div className="mb-5">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {lang === 'am' 
                        ? (activeNews.institutions?.name_am || 'መሶብ ማዕከል')
                        : (activeNews.institutions?.name_en || 'MESOB Center')
                      }
                    </span>
                    
                    <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white mt-3 mb-2 leading-tight">
                      {getAnnouncementTitle(activeNews, lang)}
                    </h1>

                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <span>{formatDate(activeNews.published_at)}</span>
                      {activeNews.creator?.full_name && (
                        <span>• {activeNews.creator.full_name}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Article Text Content - Clear, prominent pure text display */}
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="text-base lg:text-lg leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-normal">
                      {getAnnouncementContent(activeNews, lang)}
                    </div>
                  </div>

                  {/* Mobile Back-to-Top Button */}
                  <div className="lg:hidden mt-8 pt-4 border-t border-slate-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('news');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      ↑ {lang === 'am' ? 'ወደ ዜናዎች ዝርዝር ተመለስ' : 'Back to News List'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center h-full flex items-center justify-center min-h-[400px]">
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
