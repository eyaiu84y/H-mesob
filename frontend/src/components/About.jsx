import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function About() {
  const { t, lang } = useApp();

  return (
    <section id="about" className="about-section bg-gradient-to-b from-slate-50/50 via-white to-slate-50/50 dark:from-gray-900 dark:via-gray-850 dark:to-gray-900 py-16 sm:py-20 lg:py-24 border-b border-gray-100 dark:border-gray-800 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#314ea1]/5 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f4b51a]/5 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid gap-10 xl:grid-cols-2 xl:gap-12 items-center">

          {/* Left Column: Text */}
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-extrabold text-gray-900 dark:text-white mb-5 sm:mb-6 leading-tight tracking-tight">
              {t.about_heading1}
              <span className="text-[#314ea1] dark:text-blue-400 block mt-1">{t.about_heading2}</span>
              {t.about_heading3}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              {t.about_body_home}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-6">
              <Link
                to="/service-catalogue"
                className="bg-[#314ea1] hover:bg-[#1e3a8a] text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-sm hover:shadow-md transition-all duration-200 group w-full sm:w-auto cursor-pointer"
              >
                <span>{t.about_btn1}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                  className="transition-transform group-hover:translate-x-1">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
              <Link
                to="/about-us"
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold transition-all duration-200 w-full sm:w-auto flex items-center justify-center shadow-2xs cursor-pointer"
              >
                {t.about_btn2}
              </Link>
            </div>
          </div>

          {/* Right Column: Clean Feature Cards */}
          <div className="relative">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-7 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700 w-full sm:w-[90%] xl:w-full mx-auto">
              <div className="space-y-4">
                <div className="flex items-center space-x-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-gray-700/40 border border-slate-200/80 dark:border-gray-600/60 hover:border-[#314ea1]/50 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs">
                  <div className="w-11 h-11 bg-blue-100/90 dark:bg-blue-900/50 rounded-xl flex items-center justify-center text-[#314ea1] dark:text-blue-300 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" x2="8" y1="13" y2="13"></line>
                      <line x1="16" x2="8" y1="17" y2="17"></line>
                      <line x1="10" x2="8" y1="9" y2="9"></line>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{t.about_card1_title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-0.5">{t.about_card1_desc}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-gray-700/40 border border-slate-200/80 dark:border-gray-600/60 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs">
                  <div className="w-11 h-11 bg-emerald-100/90 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-300 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{t.about_card2_title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-0.5">{t.about_card2_desc}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-gray-700/40 border border-slate-200/80 dark:border-gray-600/60 hover:border-amber-500/50 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs">
                  <div className="w-11 h-11 bg-amber-100/90 dark:bg-amber-900/50 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{t.about_card3_title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-0.5">{t.about_card3_desc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

