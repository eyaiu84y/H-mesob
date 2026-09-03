import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import { useAnnouncements } from '../../context/AnnouncementContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { organizationsData } from '../../data/organizations';
import EmployeeQueueManagement from '../../components/dashboard/EmployeeQueueManagement';

// ─── Navigation sections ────────────────────────────────────────
const SECTIONS = [
  'Dashboard',
  'My Queue',
  'Search Applications',
  'Service Requirements',
  'Maintenance Report',
  'Reports',
  'Announcements',
  'My Profile',
];

// ─── Status badge helper ─────────────────────────────────────────
function StatusBadge({ status }) {
  const cls = {
    Submitted:     'badge bg-amber-100 text-amber-800',
    Assigned:      'badge bg-blue-100 text-blue-800',
    'In Progress': 'badge bg-blue-100 text-blue-800',
    Completed:     'badge bg-green-100 text-green-800',
    Pending:       'badge bg-amber-100 text-amber-800',
    'In Review':   'badge bg-blue-100 text-blue-800',
    Waiting:       'badge bg-amber-100 text-amber-800',
    Processing:    'badge bg-blue-100 text-blue-800',
  }[status] || 'badge bg-gray-100 text-gray-700';
  return <span className={cls}>{status}</span>;
}

// ─── SECTION: Dashboard Overview ────────────────────────────────
function SectionDashboard({ setActiveSection }) {
  const { announcements } = useAnnouncements();
  const unreadCount = announcements.filter(a => !a.is_read).length;
  
  // TODO: Replace with real data from API
  const myQueueCount = 0; // Will come from queue management system
  const processedToday = 0; // Will come from queue management system
  
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">In My Queue</p>
          <p className="text-2xl font-bold">{myQueueCount}</p>
          <p className="text-xs text-gray-500 mt-1">Assigned to you</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Processed Today</p>
          <p className="text-2xl font-bold">{processedToday}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Announcements</p>
          <p className="text-2xl font-bold">{unreadCount}</p>
          <p className="text-xs text-gray-500 mt-1">Unread</p>
        </div>
      </div>

      {/* Queue preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">My Processing Queue</h2>
          <button
            onClick={() => setActiveSection('My Queue')}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            View all
          </button>
        </div>
        <div className="p-6 text-center text-gray-400 py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium mb-2">No Queue Items Assigned</p>
          <p className="text-xs">Queue items assigned to you will appear here.</p>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
        <strong>Employee:</strong> Process assigned applications and manage the assigned service queue. You cannot manage users, institutions, or system settings.
      </div>
    </>
  );
}

// ─── SECTION: My Queue ───────────────────────────────────────────
function SectionMyQueue() {
  return <EmployeeQueueManagement />;
}

// ─── SECTION: Search Applications ───────────────────────────────
function SectionSearchApplications() {
  const [query, setQuery] = useState('');
  const applications = [];

  const filtered = applications.filter(app => {
    const q = query.toLowerCase();
    return (
      app.id.toLowerCase().includes(q) ||
      app.citizen.toLowerCase().includes(q) ||
      app.service.toLowerCase().includes(q) ||
      app.status.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Search Applications</h2>
        <p className="text-sm text-gray-500">Search by Application ID, citizen name, service, or status.</p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search applications..."
            className="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition text-sm"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Citizen</th>
                <th>Service</th>
                <th>Status</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8">
                    <p className="font-medium text-gray-500">No applications found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
                  </td>
                </tr>
              ) : (
                filtered.map(app => (
                  <tr key={app.id}>
                    <td className="font-medium">{app.id}</td>
                    <td>{app.citizen}</td>
                    <td>{app.service}</td>
                    <td><StatusBadge status={app.status} /></td>
                    <td>{app.submitted}</td>
                    <td className="text-right">
                      <button className="text-blue-600 hover:underline text-sm font-medium">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── SECTION: Service Requirements ───────────────────────────────
function SectionServiceRequirements() {
  const { user } = useAuth();
  const institution = organizationsData.find(org => org.name_en === user?.institution);
  const services = institution?.services || [];

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Service Requirements</h2>
        <p className="text-sm text-gray-500">Document requirements and processing information for your institution's services.</p>
      </div>

      <div className="space-y-4">
        {services.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="font-medium text-gray-500">No services found</p>
            <p className="text-sm text-gray-400 mt-1">No services are configured for your institution.</p>
          </div>
        ) : (
          services.map((service, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{service.title_en}</h3>
                  <p className="text-sm text-gray-500">{service.title_am}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-medium text-gray-700">{service.time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fee</p>
                    <p className="font-medium text-gray-700">{service.fee}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Required Documents:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {service.docs_en?.map((doc, docIdx) => (
                    <li key={docIdx} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ─── SECTION: Maintenance Report ───────────────────────────────
function SectionMaintenanceReport() {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const { reports, loading, createReport, refreshReports, getMyReports } = useMaintenance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [newReport, setNewReport] = useState({
    problemType: '',
    description: '',
    location: '',
    officeNumber: '',
    priority: 'NORMAL',
    category: 'General',
  });
  const [formErrors, setFormErrors] = useState({});

  // Load reports on mount
  useEffect(() => {
    refreshReports();
  }, [refreshReports]);

  // Get only my reports (employee's own reports)
  const myReports = user?.id ? getMyReports(user.id) : reports;

  // Problem type options - matching backend categories
  const problemTypes = [
    'Computer / Hardware',
    'Network / Internet',
    'Software',
    'Printer / Scanner',
    'Electrical / Power',
    'Other'
  ];

  // Priority options - matching backend enum
  const priorities = [
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' },
  ];

  // Handle file selection
  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only JPG, PNG, PDF, and DOCX files are allowed.`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`File too large: ${file.name}. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    // Add to attachments list
    setAttachments(prev => [...prev, ...validFiles]);
  }

  // Remove attachment
  function handleRemoveAttachment(index) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  // Validate form
  function validateForm() {
    const errors = {};

    if (!newReport.problemType) errors.problemType = 'Problem type is required';
    if (!newReport.description.trim()) errors.description = 'Problem description is required';
    if (!newReport.location.trim()) errors.location = 'Location is required';
    if (!newReport.officeNumber.trim()) errors.officeNumber = 'Office number is required';
    if (!newReport.priority) errors.priority = 'Priority is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Validate user has institution_id
    if (!user?.institution_id) {
      alert('Error: User institution not found. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // Convert files to base64
      const attachmentData = await Promise.all(
        attachments.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      const result = await createReport(
        user.institution_id,
        newReport.problemType,
        newReport.description,
        newReport.location,
        newReport.officeNumber,
        newReport.priority,
        newReport.category,
        attachmentData
      );

      if (result.success) {
        // Show success message with report number
        const reportNumber = result.report.reportNumber || result.report.id;
        setSuccessMessage(`Maintenance report submitted successfully! Report Number: ${reportNumber}`);
        
        // Create notification for Institution Manager (optional - backend may handle this)
        createNotification({
          type: 'maintenance_report',
          title: 'New Maintenance Report',
          message: `${user.name} submitted a maintenance report: ${newReport.problemType}`,
          priority: 'normal',
        });

        // Reset form
        setNewReport({
          problemType: '',
          description: '',
          location: '',
          officeNumber: '',
          priority: 'NORMAL',
          category: 'General',
        });
        setAttachments([]);
        setFormErrors({});
        setShowForm(false);
        
        // Refresh reports to show the new one
        await refreshReports();
      } else {
        alert(`Failed to submit maintenance report: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error submitting maintenance report:', err);
      alert(`Error submitting maintenance report: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Maintenance Report</h2>
        <p className="text-sm text-gray-500">Report technical issues or maintenance requirements.</p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 flex items-start gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-medium">{successMessage}</p>
            <p className="text-xs text-green-700 mt-1">Your institution manager has been notified.</p>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-green-600 hover:text-green-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {!showForm ? (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Report Maintenance Problem
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Submit New Maintenance Report</h3>
            <button
              onClick={() => {
                setShowForm(false);
                setFormErrors({});
                setSuccessMessage('');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Problem Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Problem Type <span className="text-red-500">*</span>
              </label>
              <select
                value={newReport.problemType}
                onChange={e => setNewReport({...newReport, problemType: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
              >
                <option value="">Select problem type...</option>
                {problemTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {formErrors.problemType && <p className="text-xs text-red-600 mt-1">{formErrors.problemType}</p>}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={newReport.priority}
                onChange={e => setNewReport({...newReport, priority: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              {formErrors.priority && <p className="text-xs text-red-600 mt-1">{formErrors.priority}</p>}
            </div>

            {/* Problem Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Problem Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newReport.description}
                onChange={e => setNewReport({...newReport, description: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none h-24"
                placeholder="Describe the problem clearly..."
              />
              {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newReport.location}
                onChange={e => setNewReport({...newReport, location: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                placeholder="e.g., 2nd Floor, Building A"
              />
              {formErrors.location && <p className="text-xs text-red-600 mt-1">{formErrors.location}</p>}
            </div>

            {/* Office Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Office Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newReport.officeNumber}
                onChange={e => setNewReport({...newReport, officeNumber: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                placeholder="e.g., Room 204"
              />
              {formErrors.officeNumber && <p className="text-xs text-red-600 mt-1">{formErrors.officeNumber}</p>}
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attach Files (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">JPG, PNG, PDF, DOCX (max 10MB each)</p>
              
              {/* File input */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.docx"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="attachment-upload"
                />
                <label htmlFor="attachment-upload" className="cursor-pointer">
                  <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600 font-medium">Click to upload files</p>
                  <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                </label>
              </div>

              {/* Attached files list */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* File icon */}
                        {file.type.startsWith('image/') ? (
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : file.type === 'application/pdf' ? (
                          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="ml-2 text-red-600 hover:text-red-700 flex-shrink-0"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category (optional, hidden with default) */}
            <input type="hidden" value={newReport.category} />

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Maintenance Report'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormErrors({});
                }}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report History */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">My Maintenance Reports</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 mt-3">Loading reports...</p>
          </div>
        ) : (
          <div className="table-container border-0 rounded-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Report Number</th>
                  <th>Problem Type</th>
                  <th>Priority</th>
                  <th>Location</th>
                  <th>Office</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Attachments</th>
                </tr>
              </thead>
              <tbody>
                {myReports.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-gray-400 py-8">
                      <p className="font-medium text-gray-500">No maintenance reports yet</p>
                      <p className="text-sm text-gray-400 mt-1">Click "Report Maintenance Problem" to submit your first report</p>
                    </td>
                  </tr>
                ) : (
                  myReports.map(report => (
                    <tr key={report.id}>
                      <td className="font-medium">{report.reportNumber}</td>
                      <td>{report.problemType}</td>
                      <td>
                        <span className={`badge ${
                          report.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          report.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {report.priority}
                        </span>
                      </td>
                      <td>{report.location || '—'}</td>
                      <td>{report.officeNumber || '—'}</td>
                      <td>{report.date}</td>
                      <td><StatusBadge status={report.status} /></td>
                      <td>{report.assignedTo || <span className="text-gray-400">—</span>}</td>
                      <td>
                        {report.attachments && report.attachments.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-blue-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {report.attachments.length}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
        <strong>How it works:</strong> Submit a maintenance report with complete problem details. Your institution manager will review it and assign a technician. You can track the progress of your report here.
      </div>
    </>
  );
}

// ─── SECTION: Reports ───────────────────────────────────────────
function SectionReports() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Reports</h2>
        <p className="text-sm text-gray-500">View and generate reports.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="font-medium text-gray-500">Reports Coming Soon</p>
        <p className="text-sm text-gray-400 mt-1">Report generation will be available soon.</p>
      </div>
    </>
  );
}

// ─── SECTION: Announcements ─────────────────────────────────────
function SectionAnnouncements() {
  const { announcements, loading } = useAnnouncements();
  const [selected, setSelected] = useState(null);

  // Announcement detail view
  if (selected) {
    const ann = announcements.find(a => a.id === selected);
    if (!ann) return null;

    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelected(null)}
            className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Announcements
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{ann.title}</h2>
            {ann.is_active && <span className="badge bg-green-100 text-green-800 flex-shrink-0">Active</span>}
          </div>
          <p className="text-sm text-gray-500 mb-4">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{ann.content}</p>
        </div>
      </>
    );
  }

  // Announcement list view
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Announcements</h2>
        <p className="text-sm text-gray-500">Latest updates and notices from your institution.</p>
      </div>

      {loading && !announcements.length && (
        <div className="text-center py-8 text-gray-500">Loading announcements...</div>
      )}

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <p className="font-medium text-gray-500">No announcements</p>
            <p className="text-sm text-gray-400 mt-1">Check back later for updates.</p>
          </div>
        ) : (
          announcements.map(ann => (
            <div
              key={ann.id}
              onClick={() => setSelected(ann.id)}
              className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all duration-200 ${ann.is_active ? 'border-gray-100' : 'border-gray-200 bg-gray-50'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ann.is_active && <span className="inline-block w-2 h-2 rounded-full bg-green-600 flex-shrink-0" />}
                    <h3 className="font-semibold text-sm text-gray-900 leading-snug">{ann.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ─── SECTION: My Profile ────────────────────────────────────────
function SectionMyProfile() {
  const { user } = useAuth();

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">My Profile</h2>
        <p className="text-sm text-gray-500">Manage your profile and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name || ''}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    defaultValue={user?.employeeId || ''}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                  <input
                    type="text"
                    defaultValue={user?.institution || ''}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50"
                    disabled
                  />
                </div>
              </div>
            </div>
            <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
              Save Changes
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm opacity-90">Account Status</p>
              <p className="text-xl font-bold">Active</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="opacity-90">Role:</span>
              <span className="font-medium">Employee</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-90">Institution:</span>
              <span className="font-medium">{user?.institution || 'Not assigned'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Employee Dashboard component ───────────────────────────
export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('Dashboard');

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 p-4 hidden lg:block">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">MESOB Center</h2>
          <p className="text-sm text-gray-500">Employee Portal</p>
        </div>
        
        <nav className="space-y-1">
          {SECTIONS.map(section => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`sidebar-link w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeSection === section 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {section}
            </button>
          ))}
        </nav>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">{user.institution || 'Not assigned'}</p>
            </div>
          </div>
          <button
            onClick={() => { localStorage.removeItem('mesob_auth'); window.location.href = '/'; }}
            className="sidebar-link w-full text-left text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.name.split(' ')[0]}</p>
            </div>
            <LanguageSwitcher />
          </div>

          {activeSection === 'Dashboard' && <SectionDashboard setActiveSection={setActiveSection} />}
          {activeSection === 'My Queue' && <SectionMyQueue />}
          {activeSection === 'Search Applications' && <SectionSearchApplications />}
          {activeSection === 'Service Requirements' && <SectionServiceRequirements />}
          {activeSection === 'Maintenance Report' && <SectionMaintenanceReport />}
          {activeSection === 'Reports' && <SectionReports />}
          {activeSection === 'Announcements' && <SectionAnnouncements />}
          {activeSection === 'My Profile' && <SectionMyProfile />}
        </div>
      </main>
    </div>
  );
}