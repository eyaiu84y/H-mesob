import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function About() {
  const { t } = useApp();

  return (
    <section id="about" className="about-section" style={{ padding: '5rem 0', position: 'relative' }}>

      {/* Decorative orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid gap-10 xl:grid-cols-2 xl:gap-12 items-center">

          {/* Left Column: Text */}
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white mb-5 sm:mb-6 leading-tight">
              {t.about_heading1}
              <span className="text-blue-600 block">{t.about_heading2}</span>
              {t.about_heading3}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-7 sm:mb-8 leading-relaxed">
              {t.about_body}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10 sm:mb-12">
              {/* Explore Services → /service-catalogue */}
              <Link
                to="/service-catalogue"
                className="bg-blue-600 text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 shadow-lg hover:bg-blue-700 transition-all duration-300 group w-full sm:w-auto"
              >
                <span>{t.about_btn1}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="h-5 w-5 group-hover:animate-pulse">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
              {/* Learn More → /government-service */}
              <Link
                to="/government-service"
                className="border-2 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 px-7 sm:px-8 py-3.5 sm:py-4 rounded-lg font-semibold hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 w-full sm:w-auto flex items-center justify-center"
              >
                {t.about_btn2}
              </Link>
            </div>
          </div>

          {/* Right Column: Feature Cards */}
          <div className="relative">
            <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm border border-gray-200 dark:border-gray-700 w-full sm:w-[85%] md:w-[70%] xl:w-full mx-auto">
              <div className="space-y-4">

                {/* Digital Services */}
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-800/30 hover:border-blue-400 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md feature-card">
                  <div className="w-10 h-10 bg-white dark:bg-blue-900/50 rounded-lg flex items-center justify-center shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="h-6 w-6 text-blue-600 dark:text-blue-400">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" x2="8" y1="13" y2="13"></line>
                      <line x1="16" x2="8" y1="17" y2="17"></line>
                      <line x1="10" x2="8" y1="9" y2="9"></line>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300">{t.about_card1_title}</h3>
                    <p className="text-blue-700 dark:text-blue-400 text-sm">{t.about_card1_desc}</p>
                  </div>
                </div>

                {/* Citizen Support */}
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-800/30 hover:border-green-400 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md feature-card">
                  <div className="w-10 h-10 bg-white dark:bg-green-900/50 rounded-lg flex items-center justify-center shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="h-6 w-6 text-green-600 dark:text-green-400">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-300">{t.about_card2_title}</h3>
                    <p className="text-green-700 dark:text-green-400 text-sm">{t.about_card2_desc}</p>
                  </div>
                </div>

                {/* Quick Processing */}
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-800/30 hover:border-purple-400 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md feature-card">
                  <div className="w-10 h-10 bg-white dark:bg-purple-900/50 rounded-lg flex items-center justify-center shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="h-6 w-6 text-purple-600 dark:text-purple-400">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-800 dark:text-purple-300">{t.about_card3_title}</h3>
                    <p className="text-purple-700 dark:text-purple-400 text-sm">{t.about_card3_desc}</p>
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
