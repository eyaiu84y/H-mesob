import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { videosData } from '../data/services';
import { useApp } from '../context/AppContext';
import { useAnnouncements } from '../context/AnnouncementContext';
import { getYouTubeVideoId } from '../utils/formatters';
import { getAnnouncementTitle, getAnnouncementContent, getInstitutionName } from '../utils/localizedContent';

export default function Videos() {
  const { t, lang } = useApp();
  const { i18n } = useTranslation();
  const { announcements } = useAnnouncements();

  // Combine dynamic manager news videos with default MESOB videos
  const videoList = useMemo(() => {
    const currentLang = i18n.language || 'en';
    const dynamicVideos = (announcements || [])
      .filter(a => a.scope === 'PUBLIC' && (a.metadata?.video_url || a.video_url))
      .map(a => {
        const url = a.metadata?.video_url || a.video_url;
        const ytId = getYouTubeVideoId(url);
        if (!ytId) return null;
        return {
          id: ytId,
          title: getAnnouncementTitle(a, currentLang),
          desc: getAnnouncementContent(a, currentLang),
          org: a.institutions ? getInstitutionName(a.institutions, currentLang) : (currentLang === 'am' ? 'ሀዋሳ ሜሶብ ማዕከል' : 'Hawassa MESOB Center'),
          isDynamic: true
        };
      })
      .filter(Boolean);

    const defaultList = videosData.map(v => ({
      id: v.id,
      title: t[v.titleKey],
      desc: t[v.descKey],
      org: lang === 'am' ? 'የሜሶብ አገልግሎቶች' : 'MESOB Services',
      isDynamic: false
    }));

    if (dynamicVideos.length === 0) return defaultList;
    // Dynamic news videos come first!
    const existingIds = new Set(dynamicVideos.map(v => v.id));
    return [...dynamicVideos, ...defaultList.filter(d => !existingIds.has(d.id))];
  }, [announcements, i18n.language, t]);

  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const activeVideo = videoList.find(v => v.id === selectedVideoId) || videoList[0];

  if (!activeVideo) {
    return null;
  }

  return (
    <section className="video-section bg-white dark:bg-gray-900 py-16 sm:py-20 lg:py-24 border-b border-gray-100 dark:border-gray-800" id="videos">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight leading-tight">{t.videos_title}</h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-normal">{t.videos_subtitle}</p>
        </div>

        {/* Main Featured Video Player */}
        <div className="mb-8">
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ paddingTop: '56.25%' }}>
            <iframe
              key={activeVideo.id}
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${activeVideo.id}`}
              title={activeVideo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          
          {/* Video Title Bar - Clean FDRE style */}
          <div className="mt-4 bg-[#314ea1] text-white px-6 py-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg sm:text-xl font-bold">{activeVideo.title}</h3>
              <p className="text-blue-100 text-sm mt-0.5">{activeVideo.desc}</p>
            </div>
            <span className="self-start sm:self-center px-3 py-1 bg-white/15 border border-white/20 rounded-full text-xs font-medium shrink-0">
              {activeVideo.org}
            </span>
          </div>
        </div>

        {/* Video Playlist Thumbnails - Horizontal Scroll */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {videoList.map((video) => (
              <div
                key={video.id}
                onClick={() => setSelectedVideoId(video.id)}
                className={`flex-shrink-0 w-64 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  activeVideo.id === video.id ? 'ring-4 ring-[#314ea1] rounded-xl' : ''
                }`}
              >
                <div className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                  {/* Thumbnail */}
                  <div className="relative">
                    <img
                      src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                      className="w-full h-36 object-cover"
                      alt={video.title}
                    />
                    {/* Play Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition">
                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                    {/* Active Indicator */}
                    {activeVideo.id === video.id && (
                      <div className="absolute top-2 right-2 bg-[#314ea1] text-white text-xs px-2.5 py-1 rounded-full font-bold">
                        {lang === 'am' ? 'አሁን እየታየ' : 'NOW PLAYING'}
                      </div>
                    )}
                  </div>
                  
                  {/* Video Info */}
                  <div className="p-3">
                    <p className="font-semibold text-sm leading-tight dark:text-white line-clamp-2">
                      {video.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                      {video.org}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
