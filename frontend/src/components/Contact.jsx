import { useApp } from '../context/AppContext';

export default function Contact() {
  const { t } = useApp();

  function handleSubmit(e) {
    e.preventDefault();
    alert(t.contact_success);
    e.target.reset();
  }

  return (
    <section id="contact" className="py-20 bg-white dark:bg-gray-900">
      <div className="message" style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Left: Info */}
          <div className="contacts">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t.contact_title}
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300">{t.contact_desc}</p>

            <div className="space-y-6 mt-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-2xl">📧</div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t.contact_email_label}</p>
                  <p className="text-gray-700 dark:text-gray-300">info@mesobcenter.et</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-2xl">📞</div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t.contact_phone_label}</p>
                  <p className="text-gray-700 dark:text-gray-300">+251-XXX-XXXXXX</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="bg-mesob-gradient p-8 rounded-3xl">
            <form className="space-y-6" onSubmit={handleSubmit}>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">{t.contact_name}</label>
                  <input type="text" required placeholder={t.contact_name_ph}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:outline-none focus:border-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">{t.contact_tel}</label>
                  <input type="tel" required placeholder={t.contact_tel_ph}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:outline-none focus:border-blue-500 bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white">{t.contact_email}</label>
                <input type="email" required placeholder={t.contact_email_ph}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:outline-none focus:border-blue-500 bg-white" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white">{t.contact_subject}</label>
                <input type="text" required placeholder={t.contact_subject_ph}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:outline-none focus:border-blue-500 bg-white" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white">{t.contact_message}</label>
                <textarea rows="6" required placeholder={t.contact_message_ph}
                  className="w-full px-5 py-4 rounded-3xl border border-gray-300 focus:outline-none focus:border-blue-500 bg-white resize-y" />
              </div>

              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl transition text-lg">
                {t.contact_send}
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
