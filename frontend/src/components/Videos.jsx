import { useState } from 'react';
import { videosData } from '../data/services';
import { useApp } from '../context/AppContext';

export default function Videos() {
  const { t } = useApp();
  const [activeVideo, setActiveVideo] = useState(videosData[0]);

  return (
    <section className="video-section" id="videos" style={{ padding: '5rem 0' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{t.videos_title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-3">{t.videos_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: Video List */}
          <div className="lg:col-span-5 space-y-4">
            {videosData.map((video) => (
              <div
                key={video.id}
                onClick={() => setActiveVideo(video)}
                className={`video-card flex gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl cursor-pointer hover:shadow-md transition${
                  activeVideo.id === video.id ? ' active' : ''
                }`}
              >
                <img
                  src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                  className="w-32 h-20 object-cover rounded-xl flex-shrink-0"
                  alt={t[video.titleKey]}
                />
                <div className="flex-1">
                  <p className="font-semibold leading-tight dark:text-white">{t[video.titleKey]}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t[video.descKey]}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Main Video Player */}
          <div className="lg:col-span-7">
            <div className="bg-black rounded-3xl overflow-hidden shadow-2xl aspect-video">
              <iframe
                key={activeVideo.id}
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${activeVideo.id}`}
                title={t[activeVideo.titleKey]}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <div className="mt-5 text-center">
              <p className="text-xl font-semibold text-gray-800 dark:text-white">
                {t[activeVideo.titleKey]}
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
