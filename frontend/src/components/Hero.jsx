import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const slides = [
  { src: '/image/sidasumuda.jpg', alt: 'Hawassa Background', duration: 5000 },
  { src: '/image/hm.mngr.jpg', alt: 'Banner 1', duration: 5000 },
  { src: '/image/hm.ab.jpg', alt: 'Banner 2 (Office)', duration: 5000 },
  { src: '/image/hm.slf.jpg', alt: 'Banner 3', duration: 5000 },
];

export default function Hero() {
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const duration = slides[current]?.duration || 5000;
    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, duration);
    return () => clearTimeout(timer);
  }, [current]);

  function handleSearch(e) {
    e.preventDefault();
    const input = e.target.querySelector('input');
    const query = input?.value?.trim();

    if (query) {
      // Navigate to service catalogue with search query as URL parameter
      navigate(`/service-catalogue?search=${encodeURIComponent(query)}`);
    }
  }

  return (
    <section
      id="Home"
      className="relative w-full min-h-screen overflow-hidden"
      style={{ backgroundColor: '#1e3a8a' }}
    >
      {/* Banner Slider - High quality Hawassa photography with clean cinematic overlay */}
      <div className="absolute inset-0 w-full h-full">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`banner-slide absolute inset-0 w-full h-full transition-opacity duration-1000 ${
              i === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="w-full h-full object-cover"
              style={{
                imageRendering: '-webkit-optimize-contrast',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
              }}
              loading="eager"
            />
            {/* Clean, professional overlay matching FDRE Mesob standard */}
            <div className="absolute inset-0 bg-black/45"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/80"></div>
          </div>
        ))}
      </div>

      {/* Hero Content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full flex flex-col items-center justify-center py-10 sm:py-12 md:py-14 min-h-full">

          {/* Titles with clean typography */}
          <div className="relative isolate w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-6 py-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-extrabold text-white mb-3 sm:mb-4 leading-tight tracking-tight px-2 break-words drop-shadow-sm">
              {t.hero_title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/95 mb-4 sm:mb-5 max-w-sm sm:max-w-xl md:max-w-2xl xl:max-w-3xl mx-auto font-medium px-3 break-words">
              {t.hero_subtitle}
            </p>
            <p className="text-sm sm:text-base md:text-lg text-white/85 mb-8 max-w-md md:max-w-2xl xl:max-w-3xl mx-auto px-3 hidden sm:block break-words leading-relaxed">
              {t.hero_desc}
            </p>
          </div>

          {/* Clean Search Bar */}
          <div className="w-full max-w-xl xl:max-w-2xl mx-auto px-2">
            <form className="relative" onSubmit={handleSearch}>
              <div className="relative w-full flex items-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-white/40 dark:border-gray-700 rounded-full shadow-2xl p-1.5 sm:p-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#314ea1]">
                <div className="pl-3 sm:pl-4 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t.hero_search}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 bg-transparent focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-[#314ea1] hover:bg-[#1e3a8a] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 shadow-md cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <span>{t['common.search'] || 'Search'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
