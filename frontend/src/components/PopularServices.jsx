import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesData } from '../data/services';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useServices } from '../context/ServiceContext';
import { useApplications } from '../context/ApplicationContext';

export default function PopularServices() {
  const { t } = useApp();
  const { user } = useAuth();
  const { services } = useServices();
  const { createApplication } = useApplications();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    additionalInfo: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Map popular services to backend services
  const mapServiceToBackend = (popularServiceId) => {
    // Map based on service codes and titles
    const mappings = {
      1: ['FAYDA_NEW', 'National ID'], // National ID Registration
      2: ['TRADE', 'Business'], // Business License
      3: ['REV_TIN', 'Tax', 'TIN'], // Tax Clearance
      4: ['TELECOM', 'SIM'], // SIM Card Registration
    };
    
    const searchTerms = mappings[popularServiceId] || [];
    
    // Find matching backend service
    return services.find(s => {
      const serviceCode = s.code || '';
      const serviceTitle = s.title_en || '';
      
      return searchTerms.some(term => 
        serviceCode.includes(term) || 
        serviceTitle.toLowerCase().includes(term.toLowerCase())
      );
    });
  };

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
    // Check if user is logged in
    if (!user) {
      alert('Please login to apply for services');
      navigate('/login');
      return;
    }

    // Check if user is a customer
    const roleUpper = user.role?.toUpperCase();
    if (roleUpper !== 'CUSTOMER' && roleUpper !== 'CITIZEN') {
      alert('Only customers can apply for online services');
      return;
    }

    // If service has external link, open it
    if (selectedService?.link && selectedService.link !== '#') {
      window.open(selectedService.link, '_blank', 'noopener,noreferrer');
      return;
    }

    // Otherwise show application form
    setApplicationData({
      fullName: user.full_name || user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: '',
      additionalInfo: '',
    });
    setShowApplicationForm(true);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!applicationData.fullName || !applicationData.email || !applicationData.phone) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    // Find the backend service
    const backendService = mapServiceToBackend(selectedService.id);
    
    if (!backendService) {
      setSubmitError('Service not found in the system. Please contact support.');
      return;
    }

    if (!backendService.institution_id) {
      setSubmitError('Service institution not configured. Please contact support.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const result = await createApplication(
        backendService.id,
        backendService.institution_id,
        {
          serviceName: t[selectedService.titleKey],
          institutionName: t[selectedService.orgKey],
          ...applicationData,
        },
        [] // documents - can be added later
      );

      if (result.success) {
        alert(`Application submitted successfully!\n\nApplication Number: ${result.application.applicationNumber}\n\nYou can track your application in your dashboard.`);
        
        // Close modal and reset form
        setShowApplicationForm(false);
        setSelectedService(null);
        setApplicationData({
          fullName: '',
          email: '',
          phone: '',
          address: '',
          additionalInfo: '',
        });
        
        // Redirect to citizen dashboard
        navigate('/dashboard');
      } else {
        setSubmitError(result.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Application submission error:', error);
      setSubmitError(error.message || 'An error occurred while submitting your application');
    } finally {
      setSubmitting(false);
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

        {/* View All Services Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/online-services')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <i className="fas fa-th-large"></i>
            {t.language === 'am' ? 'ሁሉንም አገልግሎቶች ይመልከቱ' : 'View All Services'}
            <i className="fas fa-arrow-right"></i>
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            {t.language === 'am' 
              ? 'ለሁሉም የመስመር ላይ አገልግሎቶች ይመልከቱ እና ማመልከቻዎችን ይከታተሉ' 
              : 'Browse all online services and track your applications'}
          </p>
        </div>
      </div>

      {/* Service Detail Modal */}
      {selectedService && !showApplicationForm && (
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
                <button
                  onClick={handleApplyService}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fas fa-paper-plane"></i>
                  {user ? 'Apply Now' : 'Login to Apply'}
                </button>
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

      {/* Application Form Modal */}
      {showApplicationForm && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowApplicationForm(false)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Form Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Apply for Service
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t[selectedService.titleKey]}
                </p>
              </div>
              <button
                onClick={() => setShowApplicationForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitApplication} className="p-6">
              {submitError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-300 text-sm">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    {submitError}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={applicationData.fullName}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={applicationData.email}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={applicationData.phone}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+251 XXX XXX XXX"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={applicationData.address}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City, Subcity, Woreda"
                  />
                </div>

                {/* Additional Information */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Additional Information
                  </label>
                  <textarea
                    rows={4}
                    value={applicationData.additionalInfo}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any additional details or special requests..."
                  />
                </div>
              </div>

              {/* Service Info Box */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-1"></i>
                  <div className="text-sm text-blue-900 dark:text-blue-300">
                    <p className="font-semibold mb-1">Application Details:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Service:</strong> {t[selectedService.titleKey]}</li>
                      <li><strong>Organization:</strong> {t[selectedService.orgKey]}</li>
                      <li><strong>Processing Time:</strong> {selectedService.time}</li>
                      <li><strong>Fee:</strong> {selectedService.fee}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      Submit Application
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  disabled={submitting}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
