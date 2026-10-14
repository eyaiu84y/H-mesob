import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const slides = [
  { src: '/image/sidasumuda.jpg', alt: 'Hawassa Background' },
  { src: '/image/HM.jpg',       alt: 'Banner 1' },
  { src: '/image/hm.mngr.jpg',  alt: 'Banner 2' },
  { src: '/image/hm.ab.jpg',    alt: 'Banner 3' },
  { src: '/image/hm.slf.jpg',   alt: 'Banner 4' },
];

export default function Hero() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      {/* Banner Slider - Enhanced with better opacity and quality */}
      <div className="absolute inset-0 w-full h-full">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`banner-slide absolute inset-0 w-full h-full transition-opacity duration-1000 ${
              i === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* High-quality image rendering with optimized settings */}
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
            {/* Lighter overlay for better image visibility */}
            <div className="absolute inset-0 bg-black/35"></div>
            {/* Enhanced gradient overlay with smoother transitions */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/70"></div>
          </div>
        ))}
      </div>

      {/* Hero Content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full flex flex-col items-center justify-center py-10 sm:py-12 md:py-14 min-h-full">

          {/* Logo with subtle animation */}
          <div className="mb-5 sm:mb-7 md:mb-8 animate-fade-in">
            <img
              src="/image/icon.png"
              alt="logo"
              className="h-20 sm:h-24 md:h-28 xl:h-36 w-auto mx-auto object-contain transition-all duration-300 drop-shadow-2xl"
            />
          </div>

          {/* Titles with staggered animation */}
          <div className="relative isolate w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white mb-3 sm:mb-4 md:mb-5 leading-tight px-2 break-words animate-slide-up drop-shadow-lg">
              {t.hero_title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl xl:text-2xl text-white/95 mb-5 sm:mb-6 md:mb-7 max-w-sm sm:max-w-xl md:max-w-2xl xl:max-w-4xl mx-auto font-medium px-3 sm:px-4 break-words animate-slide-up-delay-1 drop-shadow-md">
              {t.hero_subtitle}
            </p>
            <p className="text-sm sm:text-base md:text-lg xl:text-xl text-white/90 mb-7 sm:mb-8 md:mb-9 max-w-md md:max-w-2xl xl:max-w-3xl mx-auto px-3 sm:px-4 hidden sm:block break-words animate-slide-up-delay-2 drop-shadow-md">
              {t.hero_desc}
            </p>
            <p className="text-base text-white/90 mb-7 max-w-sm mx-auto px-2 sm:hidden break-words leading-relaxed drop-shadow-md">
              {t.hero_desc}
            </p>
          </div>

          {/* Enhanced Search Bar */}
          <div className="w-full max-w-sm sm:max-w-md md:max-w-xl xl:max-w-2xl mx-auto px-2 animate-slide-up-delay-3">
            <form className="relative group" onSubmit={handleSearch}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
              <input
                type="text"
                placeholder={t.hero_search}
                className="relative w-full px-4 sm:px-5 py-3 md:px-6 md:py-4 text-sm sm:text-base md:text-lg bg-white/90 hover:bg-white border-2 border-white/30 rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-300 shadow-2xl backdrop-blur-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2.5 sm:p-3 text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 rounded-full shadow-lg hover:shadow-xl hover:scale-110"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
