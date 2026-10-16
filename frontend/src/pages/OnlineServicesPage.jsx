import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useServices } from '../context/ServiceContext';
import { useApplications } from '../context/ApplicationContext';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function OnlineServicesPage() {
  const { lang: language } = useApp();
  const { user } = useAuth();
  const { services, loading: servicesLoading } = useServices();
  const { createApplication, applications } = useApplications();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
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

  // Get unique categories from services
  const categories = useMemo(() => {
    const cats = new Set(['ALL']);
    
    // Only add institutions that have services
    services.forEach(service => {
      if (service.is_active && service.institutions?.name_en) {
        cats.add(service.institutions.name_en);
      }
    });
    
    console.log('Categories:', Array.from(cats));
    return Array.from(cats);
  }, [services]);

  // Filter services
  const filteredServices = useMemo(() => {
    console.log('=== FILTERING SERVICES DEBUG ===');
    console.log('Total services:', services.length);
    console.log('Selected category:', selectedCategory);
    console.log('Search term:', searchTerm);
    console.log('Sample service:', services[0]);
    
    return services.filter(service => {
      // Only show active services
      const isActive = service.is_active === true || service.status === 'ACTIVE';
      if (!isActive) {
        console.log(`Service ${service.title_en || service.name} is not active`);
        return false;
      }

      // Search filter - check both old and new field names
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (service.title_en?.toLowerCase().includes(searchLower)) ||
        (service.name?.toLowerCase().includes(searchLower)) ||
        (service.title_am?.toLowerCase().includes(searchLower)) ||
        (service.name_am?.toLowerCase().includes(searchLower)) ||
        (service.description_en?.toLowerCase().includes(searchLower)) ||
        (service.description?.toLowerCase().includes(searchLower)) ||
        (service.institutions?.name_en?.toLowerCase().includes(searchLower));

      // Category filter
      const matchesCategory = selectedCategory === 'ALL' || 
        service.institutions?.name_en === selectedCategory;

      console.log(`Service ${service.title_en || service.name}: active=${isActive}, matchesSearch=${matchesSearch}, matchesCategory=${matchesCategory}`);

      return matchesSearch && matchesCategory;
    });
  }, [services, searchTerm, selectedCategory]);

  // Get user's applications
  const myApplications = useMemo(() => {
    if (!user) return [];
    return applications.filter(app => (app.customerId === user.id || app.citizenId === user.id));
  }, [applications, user]);

  const handleServiceClick = (service) => {
    setSelectedService(service);
  };

  const handleApplyClick = () => {
    if (!user) {
      alert('Please login to apply for services');
      navigate('/login');
      return;
    }

    const roleUpper = user.role?.toUpperCase();
    if (roleUpper !== 'CUSTOMER') {
      alert('Only customers can apply for online services');
      return;
    }

    // Pre-fill form with user data
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

    if (!applicationData.fullName || !applicationData.email || !applicationData.phone) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    if (!selectedService.institution_id) {
      setSubmitError('Service institution not configured. Please contact support.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const result = await createApplication(
        selectedService.id,
        selectedService.institution_id,
        {
          serviceName: language === 'am' ? selectedService.title_am : selectedService.title_en,
          institutionName: language === 'am' ? selectedService.institutions?.name_am : selectedService.institutions?.name_en,
          ...applicationData,
        },
        []
      );

      if (result.success) {
        alert(`✅ Application submitted successfully!\n\nApplication Number: ${result.application.applicationNumber}\n\nYou can track your application below.`);
        
        setShowApplicationForm(false);
        setSelectedService(null);
        setApplicationData({
          fullName: '',
          email: '',
          phone: '',
          address: '',
          additionalInfo: '',
        });

        // Scroll to application tracking section
        setTimeout(() => {
          document.getElementById('application-tracking')?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
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
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4">
                {language === 'am' ? 'የመስመር ላይ አገልግሎቶች' : 'Online Services'}
              </h1>
              <p className="text-xl opacity-90 max-w-3xl mx-auto">
                {language === 'am' 
                  ? 'የመንግስት የመስመር ላይ አገልግሎቶችን በፍጥነት እና በቀላሉ ያግኙ'
                  : 'Access government online services quickly and easily'}
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={language === 'am' ? 'አገልግሎት ፈልግ (ለምሳሌ ብሔራዊ መታወቂያ, ፓስፖርት...)' : 'Search services (e.g. National ID, Passport...)'}
                  className="w-full px-6 py-4 pl-14 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                />
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></i>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {language === 'am' ? 'ሁሉም አገልግሎቶች' : 'All Services'}
              </h2>
              <span className="text-gray-600 dark:text-gray-400">
                {filteredServices.length} {language === 'am' ? 'አገልግሎቶች' : 'services'}
              </span>
            </div>

            {servicesLoading ? (
              <div className="text-center py-20">
                <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                <p className="text-gray-600 dark:text-gray-400">
                  {language === 'am' ? 'አገልግሎቶችን በመጫን ላይ...' : 'Loading services...'}
                </p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-20">
                <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  {language === 'am' ? 'ምንም አገልግሎት አልተገኘም' : 'No services found'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map(service => (
                  <div
                    key={service.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
                    onClick={() => handleServiceClick(service)}
                  >
                    <div className="p-6">
                      {/* Service Icon */}
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                        <i className="fas fa-file-alt text-white text-2xl"></i>
                      </div>

                      {/* Service Title */}
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {language === 'am' 
                          ? service.title_am || service.name_am || service.title_en || service.name
                          : service.title_en || service.name}
                      </h3>

                      {/* Institution */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <i className="fas fa-building mr-2"></i>
                        {language === 'am' 
                          ? service.institutions?.name_am || service.institutions?.name_en 
                          : service.institutions?.name_en}
                      </p>

                      {/* Service Details */}
                      <div className="flex justify-between items-center mb-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 block">
                            {language === 'am' ? 'የሂደት ጊዜ' : 'Processing Time'}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {service.processing_time || 'N/A'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500 dark:text-gray-400 block">
                            {language === 'am' ? 'ክፍያ' : 'Fee'}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {service.service_fee || service.fee_amount || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Apply Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServiceClick(service);
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all"
                      >
                        {language === 'am' ? 'አሁን ያመልክቱ' : 'Apply Now'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Application Tracking Section */}
          {user && user.role?.toUpperCase() === 'CUSTOMER' && (
            <div id="application-tracking" className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                <i className="fas fa-clipboard-list mr-3 text-blue-600"></i>
                {language === 'am' ? 'የእኔ ማመልከቻዎች' : 'My Applications'}
              </h2>

              {myApplications.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                  <p className="text-xl text-gray-600 dark:text-gray-400">
                    {language === 'am' ? 'እስካሁን ምንም ማመልከቻ አልተገለጸም' : 'No applications yet'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {language === 'am' ? 'ከላይ ካሉት አገልግሎቶች ውስጥ አንዱን ያመልክቱ' : 'Apply for a service above to get started'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          {language === 'am' ? 'ማመልከቻ ቁጥር' : 'Application #'}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          {language === 'am' ? 'አገልግሎት' : 'Service'}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          {language === 'am' ? 'ሁኔታ' : 'Status'}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          {language === 'am' ? 'ቀን' : 'Date'}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          {language === 'am' ? 'ተግባር' : 'Action'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {myApplications.map(app => (
                        <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            {app.applicationNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                            {language === 'am' ? app.serviceName_am || app.service : app.service}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              app.status === 'Completed' || app.status === 'Approved' 
                                ? 'bg-green-100 text-green-800' 
                                : app.status === 'Under Review' || app.status === 'Pending Documents'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                            {app.submittedDate}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => navigate('/dashboard')}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                            >
                              {language === 'am' ? 'ዝርዝር' : 'View Details'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
                >
                  <i className="fas fa-tachometer-alt"></i>
                  {language === 'am' ? 'ወደ ዳሽቦርድ ይሂዱ' : 'Go to Dashboard'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Service Detail Modal */}
        {selectedService && !showApplicationForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setSelectedService(null)}>
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {language === 'am' ? selectedService.title_am || selectedService.title_en : selectedService.title_en}
                </h2>
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    {language === 'am' ? 'ተቋም' : 'Institution'}
                  </h3>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {language === 'am' 
                      ? selectedService.institutions?.name_am || selectedService.institutions?.name_en 
                      : selectedService.institutions?.name_en}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                      {language === 'am' ? 'የሂደት ጊዜ' : 'Processing Time'}
                    </span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedService.processing_time || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                      {language === 'am' ? 'የአገልግሎት ክፍያ' : 'Service Fee'}
                    </span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedService.service_fee || 'N/A'}
                    </span>
                  </div>
                </div>

                {selectedService.description_en && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                      {language === 'am' ? 'ስለ አገልግሎቱ' : 'About This Service'}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {language === 'am' ? selectedService.description_am || selectedService.description_en : selectedService.description_en}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleApplyClick}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-paper-plane"></i>
                    {user ? (language === 'am' ? 'አሁን ያመልክቱ' : 'Apply Now') : (language === 'am' ? 'ለማመልከት ይግቡ' : 'Login to Apply')}
                  </button>
                  <button
                    onClick={() => setSelectedService(null)}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {language === 'am' ? 'ዝጋ' : 'Close'}
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
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'am' ? 'ማመልከቻ ቅጽ' : 'Application Form'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {language === 'am' ? selectedService.title_am || selectedService.title_en : selectedService.title_en}
                  </p>
                </div>
                <button
                  onClick={() => setShowApplicationForm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>

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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'am' ? 'ሙሉ ስም' : 'Full Name'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={applicationData.fullName}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'am' ? 'ኢሜይል' : 'Email'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={applicationData.email}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'am' ? 'ስልክ ቁጥር' : 'Phone'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={applicationData.phone}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'am' ? 'አድራሻ' : 'Address'}
                    </label>
                    <input
                      type="text"
                      value={applicationData.address}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'am' ? 'ተጨማሪ መረጃ' : 'Additional Information'}
                    </label>
                    <textarea
                      rows={4}
                      value={applicationData.additionalInfo}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        {language === 'am' ? 'በመላክ ላይ...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check"></i>
                        {language === 'am' ? 'ማመልከቻ ላክ' : 'Submit Application'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplicationForm(false)}
                    disabled={submitting}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {language === 'am' ? 'ሰርዝ' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
