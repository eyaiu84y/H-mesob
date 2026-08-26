import { useApp } from '../context/AppContext';

export default function Address() {
  const { t } = useApp();

  return (
    <section id="Address" className="Address" style={{ padding: '5rem 0' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: Address & Contact */}
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {t.addr_title}
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="text-2xl">📍</div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t.addr_place}</p>
                  <p className="text-gray-700 dark:text-gray-300">{t.addr_street}</p>
                  <p className="text-gray-700 dark:text-gray-300">{t.addr_city}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-2xl">📞</div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t.addr_phone_label}</p>
                  <p className="text-gray-700 dark:text-gray-300">+251-xx-xxxxxx</p>
                  <p className="text-gray-700 dark:text-gray-300">+251-xx-xxx-xxxx (Fax)</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-2xl">🕒</div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t.addr_hours_label}</p>
                  <p className="text-gray-700 dark:text-gray-300">{t.addr_hours1}</p>
                  <p className="text-gray-700 dark:text-gray-300">{t.addr_hours2}</p>
                </div>
              </div>
            </div>

            <a
              href="#"
              className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold transition"
            >
              {t.addr_directions}
            </a>
          </div>

          {/* Right: Map */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ height: '460px' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d6516.966303899531!2d38.48246899999999!3d7.047339000000006!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2set!4v1785921797427!5m2!1sen!2set"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Hawassa MESOB Location"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
