import { useApp } from '../context/AppContext';

export default function Contact() {
  const { t, lang } = useApp();

  function handleSubmit(e) {
    e.preventDefault();
    alert(t.contact_success);
    e.target.reset();
  }

  return (
    <section id="contact" className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-gray-900">
      <div className="message max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Left: Info */}
          <div className="contacts">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight leading-tight">
              {t.contact_title}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8">{t.contact_desc}</p>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700 shadow-2xs">
                <div className="w-11 h-11 bg-blue-100/90 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-[#314ea1] dark:text-blue-300 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{t.contact_email_label}</p>
                  <a href="mailto:hawassamesob2018@gmail.com" className="text-[#314ea1] dark:text-blue-400 hover:underline font-semibold text-sm">hawassamesob2018@gmail.com</a>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700 shadow-2xs">
                <div className="w-11 h-11 bg-blue-100/90 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-[#314ea1] dark:text-blue-300 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{t.contact_phone_label}</p>
                  <a href="tel:+251928003080" className="text-[#314ea1] dark:text-blue-400 hover:underline font-semibold text-sm">
                    +251 928 003 080
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact Form - Clean Executive Card */}
          <div className="bg-[#314ea1] dark:bg-gray-800 p-7 sm:p-9 rounded-2xl shadow-xl border border-blue-900/40 dark:border-gray-700 text-white">
            <form className="space-y-4" onSubmit={handleSubmit}>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-blue-100">{t.contact_name}</label>
                  <input type="text" required placeholder={t.contact_name_ph}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 dark:bg-gray-900/50 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-blue-100">{t.contact_tel}</label>
                  <input type="tel" required placeholder={t.contact_tel_ph}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 dark:bg-gray-900/50 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-blue-100">{t.contact_email}</label>
                <input type="email" required placeholder={t.contact_email_ph}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 dark:bg-gray-900/50 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-blue-100">{t.contact_subject}</label>
                <input type="text" required placeholder={t.contact_subject_ph}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 dark:bg-gray-900/50 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-blue-100">{t.contact_message}</label>
                <textarea rows="4" required placeholder={t.contact_message_ph}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 dark:bg-gray-900/50 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all text-sm resize-y" />
              </div>

              <button type="submit"
                className="w-full bg-white hover:bg-blue-50 text-[#314ea1] font-bold py-3.5 rounded-xl shadow-md transition-all text-base cursor-pointer hover:shadow-lg">
                {t.contact_send}
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
