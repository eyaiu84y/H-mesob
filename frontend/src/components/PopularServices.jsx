import { useState } from 'react';
import { servicesData } from '../data/services';
import { useApp } from '../context/AppContext';

export default function PopularServices() {
  const { t } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = servicesData.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      t[s.titleKey].toLowerCase().includes(q) ||
      t[s.orgKey].toLowerCase().includes(q)
    );
  });

  return (
    <section id="popular-services" className="popular-services">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">{t.pop_title}</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t.pop_subtitle}</p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="relative">
            <input
              type="text"
              placeholder={t.pop_search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 pl-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-full focus:outline-none focus:border-blue-600 text-lg"
            />
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((service) => (
            <div key={service.id} className="service-card p-6">
              <div className="service-image-box mb-4">
                <img src={service.image} alt={t[service.titleKey]} />
              </div>
              <h3>{t[service.titleKey]}</h3>
              <p className="org">{t[service.orgKey]}</p>

              <div className="flex justify-between text-sm mb-6">
                <div>
                  <span className="text-gray-500 block">{t.pop_time}</span>
                  <span className="font-medium">{service.time}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block">{t.pop_fee}</span>
                  <span className="font-medium">{service.fee}</span>
                </div>
              </div>

              <a
                href={service.link}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-medium py-3 rounded-xl transition-colors"
              >
                {t.pop_apply}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
