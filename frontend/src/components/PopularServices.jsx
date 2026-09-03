import { useState } from 'react';
import { servicesData } from '../data/services';
import { useApp } from '../context/AppContext';

export default function PopularServices() {
  const { t } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  const filtered = servicesData.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      t[s.titleKey].toLowerCase().includes(q) ||
      t[s.orgKey].toLowerCase().includes(q)
    );
  });

  const handleServiceClick = (service) => {
    setSelectedService(service);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
  };

  const handleApplyService = () => {
    if (selectedService?.link && selectedService.link !== '#') {
      window.open(selectedService.link, '_blank', 'noopener,noreferrer');
    }
  };

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

              <button
                onClick={() => handleServiceClick(service)}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-medium py-3 rounded-xl transition-colors"
              >
                {t.pop_apply}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={handleCloseModal}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t[selectedService.titleKey]}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Service Image */}
              <div className="mb-6 flex justify-center">
                <div className="w-48 h-48 rounded-lg overflow-hidden shadow-lg">
                  <img 
                    src={selectedService.image} 
                    alt={t[selectedService.titleKey]}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Service Organization */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  {t.org_modal_suffix.replace('–', '').trim()}
                </h3>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {t[selectedService.orgKey]}
                </p>
              </div>

              {/* Service Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                    {t.pop_time}
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedService.time}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                    {t.pop_fee}
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedService.fee}
                  </span>
                </div>
              </div>

              {/* Service Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  About This Service
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedService.id === 1 && (
                    <>
                      National ID Registration is a crucial service for all Ethiopian citizens. 
                      This service allows you to register for your official National Identity Card (Fayda ID), 
                      which is required for accessing various government services, banking, and official documentation.
                    </>
                  )}
                  {selectedService.id === 2 && (
                    <>
                      Business License service enables entrepreneurs and businesses to obtain official 
                      permits to operate legally in Ethiopia. This service is essential for starting 
                      or expanding your business operations.
                    </>
                  )}
                  {selectedService.id === 3 && (
                    <>
                      Tax Clearance certificate confirms that your tax obligations are up to date. 
                      This document is often required for business transactions, loan applications, 
                      and government contracts.
                    </>
                  )}
                  {selectedService.id === 4 && (
                    <>
                      SIM Card Registration service allows you to register your mobile number with 
                      Ethio Telecom. This is a mandatory requirement for all mobile users in Ethiopia 
                      to ensure security and accountability.
                    </>
                  )}
                </p>
              </div>

              {/* Required Documents */}
              {selectedService.id === 1 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Required Documents
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Birth Certificate or Hospital Birth Record</li>
                    <li>Two recent passport-size photos</li>
                    <li>Proof of residence (Kebele ID or utility bill)</li>
                    <li>Parent's ID (for minors)</li>
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {selectedService.link && selectedService.link !== '#' ? (
                  <button
                    onClick={handleApplyService}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-external-link-alt"></i>
                    Apply Service
                  </button>
                ) : (
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-semibold py-3 px-6 rounded-xl text-center">
                    <i className="fas fa-info-circle mr-2"></i>
                    Visit MESOB Center to Apply
                  </div>
                )}
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
