import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import { useAnnouncements } from '../../context/AnnouncementContext';
import { useApplications } from '../../context/ApplicationContext';
import { useQueue } from '../../context/QueueContext';
import { useServices } from '../../context/ServiceContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import EmployeeQueueManagement from '../../components/dashboard/EmployeeQueueManagement';
import NotificationBell from '../../components/dashboard/NotificationBell';

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
    Submitted:     'badge bg-blue-50 text-[#1e3a8a] border border-blue-200',
    Assigned:      'badge bg-blue-50 text-[#1e3a8a] border border-blue-200',
    'In Progress': 'badge bg-blue-50 text-[#1e3a8a] border border-blue-200',
    Completed:     'badge bg-emerald-50 text-emerald-800 border border-emerald-200',
    Pending:       'badge bg-amber-50 text-amber-800 border border-amber-200',
    'In Review':   'badge bg-blue-50 text-[#1e3a8a] border border-blue-200',
    Waiting:       'badge bg-amber-50 text-amber-800 border border-amber-200',
    Processing:    'badge bg-blue-50 text-[#1e3a8a] border border-blue-200',
    Approved:      'badge bg-emerald-50 text-emerald-800 border border-emerald-200',
    Rejected:      'badge bg-rose-50 text-rose-800 border border-rose-200',
  }[status] || 'badge bg-slate-100 text-slate-700 border border-slate-200';
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
          <p className="text-sm text-slate-500 mb-1">In My Queue</p>
          <p className="text-2xl font-bold text-slate-900">{myQueueCount}</p>
          <p className="text-xs text-slate-400 mt-1">Assigned to you</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-500 mb-1">Processed Today</p>
          <p className="text-2xl font-bold text-slate-900">{processedToday}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-500 mb-1">Announcements</p>
          <p className="text-2xl font-bold text-slate-900">{unreadCount}</p>
          <p className="text-xs text-slate-400 mt-1">Unread</p>
        </div>
      </div>

      {/* Queue preview */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">My Processing Queue</h2>
          <button
            onClick={() => setActiveSection('My Queue')}
            className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold transition"
          >
            View all
          </button>
        </div>
        <div className="p-6 text-center text-slate-400 py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium text-slate-700 mb-1">No Queue Items Assigned</p>
          <p className="text-xs text-slate-400">Queue items assigned to you will appear here.</p>
        </div>
      </div>

      <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-sm text-[#1e3a8a] shadow-xs">
        <strong className="font-semibold">Employee:</strong> Process assigned applications and manage the assigned service queue. You cannot manage users, institutions, or system settings.
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
  const { applications, updateApplicationStatus } = useApplications();
  const [query, setQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [updating, setUpdating] = useState(false);

  const filtered = applications.filter(app => {
    const q = query.toLowerCase();
    return (
      (app.applicationNumber && app.applicationNumber.toLowerCase().includes(q)) ||
      (app.citizenName && app.citizenName.toLowerCase().includes(q)) ||
      (app.citizenEmail && app.citizenEmail.toLowerCase().includes(q)) ||
      (app.service && app.service.toLowerCase().includes(q)) ||
      (app.status && app.status.toLowerCase().includes(q))
    );
  });

  // Status update handler
  const handleStatusUpdate = async (newStatus) => {
    if (!selectedApp || updating) return;
    
    setUpdating(true);
    try {
      const result = await updateApplicationStatus(selectedApp.id, newStatus);
      if (result.success) {
        // Update local state
        setSelectedApp({ ...selectedApp, status: newStatus });
        alert(`Application status updated to: ${newStatus}`);
      } else {
        alert(result.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Status update error:', err);
      alert('An error occurred while updating status');
    } finally {
      setUpdating(false);
    }
  };

  // Application detail view
  if (selectedApp) {
    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelectedApp(null)}
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Search
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-5 mb-6">
            <h2 className="text-xl font-bold text-slate-900">Application Details</h2>
            <p className="text-sm text-slate-500 mt-1">Application #{selectedApp.applicationNumber || selectedApp.id}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</label>
              <div className="mt-1.5">
                <StatusBadge status={selectedApp.status} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Submitted</label>
              <p className="mt-1 font-medium text-slate-900">{selectedApp.submittedDate}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Service</label>
              <p className="mt-1 font-medium text-slate-900">{selectedApp.service}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Institution</label>
              <p className="mt-1 font-medium text-slate-900">{selectedApp.institution}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 mb-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <label className="text-xs text-slate-500">Name</label>
                <p className="mt-0.5 font-semibold text-slate-900">{selectedApp.citizenName || 'N/A'}</p>
              </div>
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <label className="text-xs text-slate-500">Email</label>
                <p className="mt-0.5 font-semibold text-slate-900">{selectedApp.citizenEmail || 'N/A'}</p>
              </div>
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <label className="text-xs text-slate-500">Phone</label>
                <p className="mt-0.5 font-semibold text-slate-900">{selectedApp.citizenPhone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {selectedApp.applicationData && (
            <div className="border-t border-slate-100 pt-6 mb-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Application Data</h3>
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                <div className="space-y-3">
                  {selectedApp.applicationData.fullName && (
                    <div>
                      <label className="text-xs text-slate-500">Full Name</label>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">{selectedApp.applicationData.fullName}</p>
                    </div>
                  )}
                  {selectedApp.applicationData.address && (
                    <div>
                      <label className="text-xs text-slate-500">Address</label>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">{selectedApp.applicationData.address}</p>
                    </div>
                  )}
                  {selectedApp.applicationData.additionalInfo && (
                    <div>
                      <label className="text-xs text-slate-500">Additional Information</label>
                      <p className="mt-0.5 text-sm text-slate-800 whitespace-pre-wrap">{selectedApp.applicationData.additionalInfo}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedApp.assignedEmployee && (
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-base font-bold text-slate-900 mb-3">Assignment</h3>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-[#1e3a8a] text-sm font-medium border border-blue-200/80">
                <span>Assigned to:</span>
                <strong>{selectedApp.assignedEmployee}</strong>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-slate-100 pt-6 mt-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Actions</h3>
            <div className="flex gap-3 flex-wrap">
              {selectedApp.status === 'Submitted' && (
                <button
                  onClick={() => handleStatusUpdate('Under Review')}
                  disabled={updating}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] text-white rounded-xl hover:from-[#253d82] hover:to-[#172554] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition shadow-xs"
                >
                  {updating ? 'Updating...' : 'Start Review'}
                </button>
              )}
              
              {selectedApp.status === 'Under Review' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('Approved')}
                    disabled={updating}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition shadow-xs"
                  >
                    {updating ? 'Updating...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('Rejected')}
                    disabled={updating}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition shadow-xs"
                  >
                    {updating ? 'Updating...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('Pending Documents')}
                    disabled={updating}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition shadow-xs"
                  >
                    {updating ? 'Updating...' : 'Request Documents'}
                  </button>
                </>
              )}
              
              {selectedApp.status === 'Approved' && (
                <button
                  onClick={() => handleStatusUpdate('Completed')}
                  disabled={updating}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition shadow-xs"
                >
                  {updating ? 'Updating...' : 'Mark as Completed'}
                </button>
              )}
              
              {(selectedApp.status === 'Completed' || selectedApp.status === 'Rejected' || selectedApp.status === 'Cancelled') && (
                <p className="text-sm text-slate-500 italic">This application has been finalized.</p>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Search Applications</h2>
        <p className="text-sm text-slate-500">Search by Application ID, customer name, service, or status.</p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search applications..."
            className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Status</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-8">
                    <p className="font-medium text-slate-600">No applications found</p>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting your search criteria</p>
                  </td>
                </tr>
              ) : (
                filtered.map(app => (
                  <tr key={app.id}>
                    <td className="font-semibold text-slate-900">{app.applicationNumber || app.id}</td>
                    <td>{app.citizenName || app.citizenEmail}</td>
                    <td>{app.service}</td>
                    <td><StatusBadge status={app.status} /></td>
                    <td className="text-slate-500">{app.submittedDate}</td>
                    <td className="text-right">
                      <button 
                        onClick={() => setSelectedApp(app)}
                        className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold transition"
                      >
                        View
                      </button>
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
  const { institutions, getServicesByInstitution } = useServices();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Find institution by user's institution_id
  const institution = institutions.find(inst => inst.id === user?.institution_id);
  
  // Get services for this institution from ServiceContext
  const services = institution ? getServicesByInstitution(institution.id) : [];

  // Filter services by search query
  const filteredServices = services.filter(service => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      service.title_en?.toLowerCase().includes(q) ||
      service.title_am?.toLowerCase().includes(q) ||
      service.description_en?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Service Requirements</h2>
        <p className="text-sm text-slate-500">Document requirements and processing information for your institution's services.</p>
      </div>

      {/* Search bar */}
      {services.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search services or documents..."
              className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 text-center">
            {services.length === 0 ? (
              <>
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-medium text-slate-700">No services found</p>
                <p className="text-sm text-slate-500 mt-1">
                  {institution ? 
                    `No services are configured for ${institution.name_en}.` : 
                    `Your institution is not configured yet.`
                  }
                </p>
                {user?.institution_id && !institution && (
                  <p className="text-xs text-slate-400 mt-2">
                    Institution ID: {user.institution_id}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="font-medium text-slate-700">No matching services</p>
                <p className="text-sm text-slate-400 mt-1">Try adjusting your search criteria</p>
              </>
            )}
          </div>
        ) : (
          filteredServices.map((service, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 hover:border-slate-300 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-base">{service.title_en}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{service.title_am}</p>
                </div>
                <div className="flex gap-3 text-sm ml-4">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Time</p>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5">{service.processing_time || 'N/A'}</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Fee</p>
                    <p className="font-semibold text-amber-900 text-xs mt-0.5">{service.service_fee || 'Free'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Required Documents:</p>
                <ul className="text-sm text-slate-700 space-y-1.5">
                  {service.required_documents_en?.map((doc, docIdx) => (
                    <li key={docIdx} className="flex items-start gap-2">
                      <span className="text-[#314ea1] font-bold mt-0.5">•</span>
                      <span>{doc}</span>
                    </li>
                  ))}
                  {(!service.required_documents_en || service.required_documents_en.length === 0) && (
                    <li className="text-slate-400 italic">No specific documents required</li>
                  )}
                </ul>
              </div>
              
              {service.required_documents_am && service.required_documents_am.length > 0 && (
                <details className="mt-4 pt-3 border-t border-slate-100">
                  <summary className="text-xs font-semibold text-[#314ea1] cursor-pointer hover:text-[#1e3a8a] transition">
                    የሚፈለጉ ሰነዶች (Amharic)
                  </summary>
                  <ul className="text-sm text-slate-700 space-y-1.5 mt-2">
                    {service.required_documents_am.map((doc, docIdx) => (
                      <li key={docIdx} className="flex items-start gap-2">
                        <span className="text-[#314ea1] font-bold mt-0.5">•</span>
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))
        )}
      </div>

      {institution && services.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-sm text-[#1e3a8a] shadow-xs">
          <strong className="font-semibold">Institution:</strong> {institution.name_en}
          <span className="mx-2">•</span>
          <strong className="font-semibold">Services:</strong> {filteredServices.length} of {services.length} displayed
        </div>
      )}
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
            className="px-6 py-3 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] text-white rounded-xl hover:from-[#253d82] hover:to-[#172554] transition text-sm font-semibold flex items-center gap-2 shadow-xs"
          >
            <svg className="w-5 h-5 text-[#f4b51a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Report Maintenance Problem
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 mb-6">
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

            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="px-6 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] text-white rounded-xl hover:from-[#253d82] hover:to-[#172554] transition text-sm font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Maintenance Report'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormErrors({});
                }}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report History */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-900">My Maintenance Reports</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#314ea1] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 mt-3">Loading reports...</p>
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
  const { user } = useAuth();
  const { applications } = useApplications();
  const { reports } = useMaintenance();
  const { myTickets, getInstitutionQueue } = useQueue();
  const [dateRange, setDateRange] = useState('this_month');
  const [reportType, setReportType] = useState('overview');

  // Safety checks
  const safeApplications = Array.isArray(applications) ? applications : [];
  const safeReports = Array.isArray(reports) ? reports : [];
  const safeTickets = Array.isArray(myTickets) ? myTickets : [];

  // Filter data by employee's institution
  const myInstitutionApps = safeApplications.filter(
    app => app.institutionId === user?.institution_id
  );
  
  const myReports = safeReports.filter(
    report => report.reportedById === user?.id
  );

  // Queue data for employee's institution
  const myInstitutionQueues = user?.institution_id 
    ? getInstitutionQueue(user.institution_id)
    : safeTickets.filter(t => t.institutionId === user?.institution_id);

  // Calculate date ranges
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  // Filter by date range
  const filterByDateRange = (items, dateField = 'created_at') => {
    if (!items || items.length === 0) return [];
    
    if (dateRange === 'today') {
      return items.filter(item => {
        if (!item[dateField]) return false;
        const itemDate = new Date(item[dateField]);
        return itemDate.toDateString() === today.toDateString();
      });
    } else if (dateRange === 'this_week') {
      return items.filter(item => {
        if (!item[dateField]) return false;
        const itemDate = new Date(item[dateField]);
        return itemDate >= startOfWeek;
      });
    } else if (dateRange === 'this_month') {
      return items.filter(item => {
        if (!item[dateField]) return false;
        const itemDate = new Date(item[dateField]);
        return itemDate >= startOfMonth;
      });
    }
    return items; // all_time
  };

  // Calculate statistics for applications
  const filteredApps = filterByDateRange(myInstitutionApps);
  const appStats = {
    total: filteredApps.length,
    pending: filteredApps.filter(a => a.status === 'PENDING' || a.status === 'Pending').length,
    inProgress: filteredApps.filter(a => a.status === 'IN_PROGRESS' || a.status === 'In Progress' || a.status === 'Processing').length,
    completed: filteredApps.filter(a => a.status === 'COMPLETED' || a.status === 'Completed').length,
    rejected: filteredApps.filter(a => a.status === 'REJECTED' || a.status === 'Rejected').length,
  };

  // Calculate statistics for maintenance reports
  const filteredReports = filterByDateRange(myReports, 'reportedAtTimestamp');
  const reportStats = {
    total: filteredReports.length,
    pending: filteredReports.filter(r => r.status === 'PENDING' || r.status === 'Pending' || r.status === 'Submitted').length,
    assigned: filteredReports.filter(r => r.status === 'ASSIGNED' || r.status === 'Assigned').length,
    inProgress: filteredReports.filter(r => r.status === 'IN_PROGRESS' || r.status === 'In Progress').length,
    completed: filteredReports.filter(r => r.status === 'COMPLETED' || r.status === 'Completed').length,
  };

  // Calculate statistics for queue
  const filteredQueues = filterByDateRange(myInstitutionQueues, 'createdAt');
  const queueStats = {
    total: filteredQueues.length,
    waiting: filteredQueues.filter(q => q.status === 'waiting').length,
    called: filteredQueues.filter(q => q.status === 'called').length,
    completed: filteredQueues.filter(q => q.status === 'completed').length,
    cancelled: filteredQueues.filter(q => q.status === 'cancelled').length,
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Reports</h2>
        <p className="text-sm text-gray-500">View your performance metrics and statistics.</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none text-sm bg-white"
        >
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="all_time">All Time</option>
        </select>

        <select
          value={reportType}
          onChange={e => setReportType(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none text-sm bg-white"
        >
          <option value="overview">Overview</option>
          <option value="queue">Queue Management</option>
          <option value="applications">Applications</option>
          <option value="maintenance">Maintenance Reports</option>
        </select>
      </div>

      {/* Overview Report */}
      {reportType === 'overview' && (
        <>
          {/* Applications Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Applications Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{appStats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Total</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{appStats.pending}</p>
                <p className="text-xs text-amber-600 mt-1">Pending</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{appStats.inProgress}</p>
                <p className="text-xs text-blue-600 mt-1">In Progress</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{appStats.completed}</p>
                <p className="text-xs text-green-600 mt-1">Completed</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{appStats.rejected}</p>
                <p className="text-xs text-red-600 mt-1">Rejected</p>
              </div>
            </div>
          </div>

          {/* Queue Management Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Queue Management
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{queueStats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Total</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{queueStats.waiting}</p>
                <p className="text-xs text-yellow-600 mt-1">Waiting</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{queueStats.called}</p>
                <p className="text-xs text-blue-600 mt-1">Being Served</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{queueStats.completed}</p>
                <p className="text-xs text-green-600 mt-1">Completed</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{queueStats.cancelled}</p>
                <p className="text-xs text-red-600 mt-1">Cancelled</p>
              </div>
            </div>
          </div>

          {/* Maintenance Reports Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#314ea1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              My Maintenance Reports
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{reportStats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Total</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{reportStats.pending}</p>
                <p className="text-xs text-amber-600 mt-1">Pending</p>
              </div>
              <div className="text-center p-3 bg-slate-100 rounded-lg">
                <p className="text-2xl font-bold text-slate-700">{reportStats.assigned}</p>
                <p className="text-xs text-slate-600 mt-1">Assigned</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-[#1e3a8a]">{reportStats.inProgress}</p>
                <p className="text-xs text-[#1e3a8a] mt-1">In Progress</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-700">{reportStats.completed}</p>
                <p className="text-xs text-emerald-700 mt-1">Completed</p>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#314ea1]" />
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Applications Performance</h4>
              <p className="text-3xl font-bold text-[#1e3a8a] mb-2">
                {appStats.total > 0 
                  ? Math.round((appStats.completed / appStats.total) * 100) 
                  : 0}%
              </p>
              <p className="text-xs font-medium text-emerald-700">Completion Rate</p>
              <p className="text-xs text-gray-500 mt-2">
                {appStats.completed} completed out of {appStats.total} total applications
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Maintenance Activity</h4>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {reportStats.total > 0 
                  ? Math.round((reportStats.completed / reportStats.total) * 100) 
                  : 0}%
              </p>
              <p className="text-xs font-medium text-amber-700">Resolution Rate</p>
              <p className="text-xs text-gray-500 mt-2">
                {reportStats.completed} resolved out of {reportStats.total} total reports
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#f4b51a]" />
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Queue Performance</h4>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {queueStats.total > 0 
                  ? Math.round((queueStats.completed / queueStats.total) * 100) 
                  : 0}%
              </p>
              <p className="text-xs font-medium text-[#1e3a8a]">Service Rate</p>
              <p className="text-xs text-gray-500 mt-2">
                {queueStats.completed} served out of {queueStats.total} total
              </p>
            </div>
          </div>
        </>
      )}

      {/* Applications Detailed Report */}
      {reportType === 'applications' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Applications Report</h3>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredApps.length} applications for {dateRange.replace('_', ' ')}
            </p>
          </div>
          <div className="table-container border-0 rounded-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application Number</th>
                  <th>Service</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-8">
                      No applications found for this period
                    </td>
                  </tr>
                ) : (
                  filteredApps.slice(0, 50).map(app => (
                    <tr key={app.id}>
                      <td className="font-medium">{app.application_number || app.id.slice(0, 8)}</td>
                      <td>{app.services?.title_en || 'N/A'}</td>
                      <td>{app.users?.full_name || 'Unknown'}</td>
                      <td><StatusBadge status={app.status} /></td>
                      <td>{new Date(app.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Maintenance Detailed Report */}
      {reportType === 'maintenance' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Maintenance Reports</h3>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredReports.length} reports for {dateRange.replace('_', ' ')}
            </p>
          </div>
          <div className="table-container border-0 rounded-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Report Number</th>
                  <th>Problem Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-8">
                      No maintenance reports found for this period
                    </td>
                  </tr>
                ) : (
                  filteredReports.slice(0, 50).map(report => (
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
                      <td><StatusBadge status={report.status} /></td>
                      <td>{report.assignedTo || <span className="text-gray-400">—</span>}</td>
                      <td>{report.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Queue Detailed Report */}
      {reportType === 'queue' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-900">Queue Management Report</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredQueues.length} queue entries for {dateRange.replace('_', ' ')}
            </p>
          </div>
          <div className="table-container border-0 rounded-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token Number</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Registered At</th>
                  <th>Called At</th>
                  <th>Completed At</th>
                  <th>Wait Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-400 py-8">
                      No queue entries found for this period
                    </td>
                  </tr>
                ) : (
                  filteredQueues.slice(0, 50).map(queue => {
                    const waitTime = queue.calledAt 
                      ? Math.round((new Date(queue.calledAt) - new Date(queue.createdAt)) / 1000 / 60)
                      : null;
                    
                    return (
                      <tr key={queue.id}>
                        <td className="font-semibold text-slate-900">{queue.token}</td>
                        <td>{queue.serviceName}</td>
                        <td>
                          <span className={`badge ${
                            queue.status === 'waiting' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            queue.status === 'called' ? 'bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold' :
                            queue.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {queue.status === 'waiting' ? 'Waiting' :
                             queue.status === 'called' ? 'Being Served' :
                             queue.status === 'completed' ? 'Completed' : 'Cancelled'}
                          </span>
                        </td>
                        <td className="text-slate-600">{new Date(queue.createdAt).toLocaleString('en-US', { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}</td>
                        <td>{queue.calledAt 
                          ? new Date(queue.calledAt).toLocaleString('en-US', { 
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })
                          : <span className="text-slate-400">—</span>
                        }</td>
                        <td>{queue.completedAt 
                          ? new Date(queue.completedAt).toLocaleString('en-US', { 
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })
                          : <span className="text-slate-400">—</span>
                        }</td>
                        <td className="font-medium text-slate-700">{waitTime !== null 
                          ? `${waitTime} min${waitTime !== 1 ? 's' : ''}` 
                          : <span className="text-slate-400">—</span>
                        }</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-sm text-[#1e3a8a] shadow-xs">
        <strong className="font-semibold">About Reports:</strong> View statistics and detailed reports of applications and maintenance requests. Use filters to customize the data view by date range and report type.
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
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Announcements
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900">{ann.title}</h2>
            {ann.is_active && <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium flex-shrink-0">Active</span>}
          </div>
          <p className="text-xs text-slate-500 mb-4">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
          <p className="text-sm text-slate-700 leading-relaxed">{ann.content}</p>
        </div>
      </>
    );
  }

  // Announcement list view
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Announcements</h2>
        <p className="text-sm text-slate-500">Latest updates and notices from your institution.</p>
      </div>

      {loading && !announcements.length && (
        <div className="text-center py-8 text-slate-500">Loading announcements...</div>
      )}

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <p className="font-medium text-slate-700">No announcements</p>
            <p className="text-sm text-slate-400 mt-1">Check back later for updates.</p>
          </div>
        ) : (
          announcements.map(ann => (
            <div
              key={ann.id}
              onClick={() => setSelected(ann.id)}
              className={`bg-white rounded-2xl border shadow-xs p-5 cursor-pointer hover:border-[#314ea1]/50 hover:shadow-sm transition-all duration-200 ${ann.is_active ? 'border-slate-200/90' : 'border-slate-200 bg-slate-50/60'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ann.is_active && <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />}
                    <h3 className="font-semibold text-sm text-slate-900 leading-snug">{ann.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
                </div>
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <h2 className="text-lg font-bold text-slate-900 mb-1">My Profile</h2>
        <p className="text-sm text-slate-500">Manage your profile and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-5 pb-3 border-b border-slate-100">Personal Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name || ''}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-sm bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Employee ID</label>
                  <input
                    type="text"
                    defaultValue={user?.employeeId || ''}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Institution</label>
                  <input
                    type="text"
                    defaultValue={user?.institution || ''}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm"
                    disabled
                  />
                </div>
              </div>
            </div>
            <button className="mt-6 px-6 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] text-white rounded-xl hover:from-[#253d82] hover:to-[#172554] transition text-sm font-semibold shadow-xs">
              Save Changes
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-xs bg-gradient-to-br from-[#172554] via-[#1e3a8a] to-[#314ea1] border border-[#314ea1]/30 flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f4b51a] via-amber-300 to-[#f4b51a]" />
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#f4b51a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-200/90 font-medium">Account Status</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <p className="text-lg font-bold text-white">Active</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 text-sm border-t border-white/15 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-blue-200/80 text-xs uppercase tracking-wider">Role</span>
                <span className="font-semibold text-white">Employee</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-200/80 text-xs uppercase tracking-wider">Institution</span>
                <span className="font-medium text-white">{user?.institution || 'Not assigned'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Employee Dashboard component ───────────────────────────
export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('Dashboard');

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#edf4fc] text-slate-900">
      <aside className="w-64 bg-white border-r border-slate-200/90 p-4 hidden lg:flex flex-col shadow-xs">
        <div className="p-2 mb-6 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] flex items-center justify-center font-bold text-base shadow-xs border border-[#314ea1]/20">
              E
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">MESOB Center</p>
              <p className="text-xs text-slate-500">Employee Portal</p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-1 flex-1">
          {SECTIONS.map(section => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`sidebar-link w-full text-left px-4 py-2.5 rounded-xl text-sm transition ${
                activeSection === section 
                  ? 'bg-blue-50 text-[#1e3a8a] border-l-4 border-[#314ea1] font-semibold' 
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-[#1e3a8a]'
              }`}
            >
              {section}
            </button>
          ))}
        </nav>

        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] flex items-center justify-center font-bold text-xs shadow-xs">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 text-xs truncate">{user.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.institution || 'Not assigned'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="sidebar-link w-full text-left text-rose-600 hover:bg-rose-50"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 min-w-0">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Employee Dashboard</h1>
              <p className="text-slate-600 text-sm">Welcome back, {user.name.split(' ')[0]}</p>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <NotificationBell onNavigate={(section) => setActiveSection(section)} />
              <span className="badge bg-blue-50 text-[#1e3a8a] border border-blue-200 font-medium">Employee</span>
            </div>
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