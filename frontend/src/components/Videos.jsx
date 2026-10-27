import { useState, useMemo } from 'react';
import { videosData } from '../data/services';
import { useApp } from '../context/AppContext';
import { useAnnouncements } from '../context/AnnouncementContext';
import { getYouTubeVideoId } from '../utils/formatters';

export default function Videos() {
  const { t, lang } = useApp();
  const { announcements } = useAnnouncements();

  // Combine dynamic manager news videos with default MESOB videos
  const videoList = useMemo(() => {
    const dynamicVideos = (announcements || [])
      .filter(a => a.scope === 'PUBLIC' && (a.metadata?.video_url || a.video_url))
      .map(a => {
        const url = a.metadata?.video_url || a.video_url;
        const ytId = getYouTubeVideoId(url);
        if (!ytId) return null;
        return {
          id: ytId,
          title: lang === 'am' ? (a.title_am || a.title) : a.title,
          desc: lang === 'am' ? (a.content_am || a.content) : a.content,
          org: lang === 'am' ? (a.institutions?.name_am || 'መሶብ ማዕከል') : (a.institutions?.name_en || 'MESOB Center'),
          isDynamic: true
        };
      })
      .filter(Boolean);

    const defaultList = videosData.map(v => ({
      id: v.id,
      title: t[v.titleKey],
      desc: t[v.descKey],
      org: lang === 'am' ? 'የመሶብ አገልግሎቶች' : 'MESOB Services',
      isDynamic: false
    }));

    if (dynamicVideos.length === 0) return defaultList;
    // Dynamic news videos come first!
    const existingIds = new Set(dynamicVideos.map(v => v.id));
    return [...dynamicVideos, ...defaultList.filter(d => !existingIds.has(d.id))];
  }, [announcements, lang, t]);

  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const activeVideo = videoList.find(v => v.id === selectedVideoId) || videoList[0];

  return (
    <section className="video-section bg-gray-50 dark:bg-gray-900" id="videos" style={{ padding: '5rem 0' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{t.videos_title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-3">{t.videos_subtitle}</p>
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
          
          {/* Video Title Bar - FDRE style */}
          <div className="mt-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-4 rounded-xl">
            <h3 className="text-xl font-bold">{activeVideo.title}</h3>
            <p className="text-blue-100 text-sm mt-1">{activeVideo.desc}</p>
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
                  activeVideo.id === video.id ? 'ring-4 ring-blue-500 rounded-xl' : ''
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
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                        {lang === 'am' ? 'በመጫወት ላይ' : 'NOW PLAYING'}
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
