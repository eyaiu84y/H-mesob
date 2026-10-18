import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

/**
 * ScrollEnhancements Component
 * Adds reading progress bar, floating Back-to-Top button, and IntersectionObserver scroll reveals
 * for an attractive, simple, and modern scrolling experience inspired by mesobcenter.et.
 */
export default function ScrollEnhancements() {
  const { lang } = useApp();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    let ticking = false;

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const currentScroll = window.scrollY;

          if (totalHeight > 0) {
            const progress = Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100));
            setScrollProgress(progress);
          }

          setShowBackToTop(currentScroll > 320);
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver to auto-reveal elements with .scroll-reveal class
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {/* ─── Top Scroll Progress Bar ─────────────────────────────── */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-[60] pointer-events-none transition-all duration-150"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          className="h-full transition-all duration-100 ease-out"
          style={{
            width: `${scrollProgress}%`,
            background: 'linear-gradient(90deg, #314ea1 0%, #1e3a8a 50%, #f4b51a 100%)',
            boxShadow: '0 0 10px rgba(244, 181, 26, 0.7)',
          }}
        />
      </div>

      {/* ─── Floating Back to Top Button ─────────────────────────── */}
      <div
        className={`fixed bottom-6 right-6 z-40 transition-all duration-500 ease-out ${
          showBackToTop
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={scrollToTop}
          title={lang === 'am' ? 'ወደ ላይ ተመለስ' : 'Back to top'}
          aria-label={lang === 'am' ? 'ወደ ላይ ተመለስ' : 'Back to top'}
          className="relative group w-12 h-12 rounded-full bg-white dark:bg-slate-800 text-[#1e3a8a] dark:text-[#f4b51a] shadow-xl hover:shadow-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        >
          {/* Subtle Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-slate-100 dark:text-slate-700"
            />
            <circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              stroke="#f4b51a"
              strokeWidth="2.5"
              strokeDasharray={132}
              strokeDashoffset={132 - (132 * scrollProgress) / 100}
              strokeLinecap="round"
              className="transition-all duration-150"
            />
          </svg>

          {/* Up Chevron Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </>
  );
}
