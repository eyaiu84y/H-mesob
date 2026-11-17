import { useApp } from '../context/AppContext';

export default function Address() {
  const { t, lang } = useApp();

  return (
    <section id="Address" className="Address py-16 sm:py-20 lg:py-24 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: Address & Contact */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                {t.addr_title}
              </h2>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-2xs">
                <div className="w-11 h-11 bg-blue-100/90 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-[#314ea1] dark:text-blue-300 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-base">{t.addr_place}</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-0.5">{t.addr_street}</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{t.addr_city}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-2xs">
                <div className="w-11 h-11 bg-blue-100/90 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-[#314ea1] dark:text-blue-300 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-base">{t.addr_phone_label}</p>
                  <a href="tel:+251928003080" className="text-[#314ea1] dark:text-blue-400 hover:underline font-semibold block text-sm mt-0.5">
                    +251 928 003 080
                  </a>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5">+251 46 220 0000 {lang === 'am' ? '(ፋክስ)' : '(Fax)'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-2xs">
                <div className="w-11 h-11 bg-blue-100/90 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-[#314ea1] dark:text-blue-300 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-base">{t.addr_hours_label}</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-0.5">{t.addr_hours1}</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{t.addr_hours2}</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=7.047339,38.482469"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-[#314ea1] hover:bg-[#1e3a8a] text-white px-8 py-3.5 sm:py-4 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <span>{t.addr_directions}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right: Map */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200/90 dark:border-gray-700" style={{ height: '460px' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d6516.966303899531!2d38.48246899999999!3d7.047339000000006!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2set!4v1785921797427!5m2!1sen!2set"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={lang === 'am' ? 'የሃዋሳ መሶብ አድራሻ ካርታ' : 'Hawassa MESOB Location'}
            />
          </div>

        </div>
      </div>
    </section>
  );
}
