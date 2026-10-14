import { useState } from 'react';
import { videosData } from '../data/services';
import { useApp } from '../context/AppContext';

export default function Videos() {
  const { t } = useApp();
  const [activeVideo, setActiveVideo] = useState(videosData[0]);

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
              title={t[activeVideo.titleKey]}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          
          {/* Video Title Bar - FDRE style */}
          <div className="mt-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-4 rounded-xl">
            <h3 className="text-xl font-bold">{t[activeVideo.titleKey]}</h3>
            <p className="text-blue-100 text-sm mt-1">{t[activeVideo.descKey]}</p>
          </div>
        </div>

        {/* Video Playlist Thumbnails - Horizontal Scroll */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {videosData.map((video) => (
              <div
                key={video.id}
                onClick={() => setActiveVideo(video)}
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
                      alt={t[video.titleKey]}
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
                        NOW PLAYING
                      </div>
                    )}
                  </div>
                  
                  {/* Video Info */}
                  <div className="p-3">
                    <p className="font-semibold text-sm leading-tight dark:text-white line-clamp-2">
                      {t[video.titleKey]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                      MESOB Services
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      
      <style jsx>{`
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
