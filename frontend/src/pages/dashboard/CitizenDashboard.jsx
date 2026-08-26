import { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import QueueManagement from '../../components/dashboard/QueueManagement';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import { getAnnouncements } from '../../utils/sharedData';
import { organizationsData } from '../../data/organizations';
import { getApplications, createApplication } from '../../utils/sharedData';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const { getActiveTickets } = useQueue();
  const [activeSection, setActiveSection] = useState('dashboard');
  const firstName = user?.name?.split(' ')[0] || 'Citizen';
  const activeQueueCount = getActiveTickets().length;
  
  // Get citizen applications
  const applications = getApplications({ citizenEmail: user?.email });
  const activeApplications = applications.filter(app => app.status === 'Submitted' || app.status === 'Under Review').length;
  const completedApplications = applications.filter(app => app.status === 'Approved' || app.status === 'Completed').length;

  const navLinks = [
    { label: 'My Dashboard', section: 'dashboard' },
    { label: 'My Applications', section: 'applications' },
    { label: 'My Queue', section: 'queue' },
    { label: 'Apply for Service', section: 'apply' },
    { label: 'Announcements', section: 'announcements' },
    { label: 'Profile & Documents', section: 'profile' },
  ];

  return (
    <DashboardLayout
      title="My Account"
      navLinks={navLinks.map(link => ({
        label: link.label,
        href: '#',
        onClick: (e) => {
          e.preventDefault();
          setActiveSection(link.section);
        }
      }))}
      accentColor="green"
      letter="C"
      subtitle="Citizen Portal"
    >
      {/* My Dashboard Section */}
      {activeSection === 'dashboard' && (
        <>
          {/* Welcome banner */}
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] rounded-2xl p-6 text-white mb-8">
            <h2 className="text-xl font-semibold mb-1">Welcome back, {firstName}!</h2>
            <p className="text-blue-100 text-sm">Track your applications and apply for services at MESOB Center.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="stat-card">
              <p className="text-sm text-gray-500 mb-1">Active Applications</p>
              <p className="text-2xl font-bold">{activeApplications}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-gray-500 mb-1">Completed</p>
              <p className="text-2xl font-bold">{completedApplications}</p>
            </div>
            <button onClick={() => setActiveSection('queue')} className="stat-card hover:border-blue-400 transition text-left">
              <p className="text-sm text-gray-500 mb-1">Active Queues</p>
              <p className="text-2xl font-bold">{activeQueueCount}</p>
              <p className="text-xs text-blue-600 mt-1 font-medium">View →</p>
            </button>
            <div className="stat-card">
              <p className="text-sm text-gray-500 mb-1">Total Applications</p>
              <p className="text-2xl font-bold">{applications.length}</p>
            </div>
          </div>

          {/* Applications table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Applications</h2>
              <button
                onClick={() => setActiveSection('applications')}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                View All
              </button>
            </div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Service</th>
                    <th>Institution</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-8">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-medium text-gray-500">No applications yet</p>
                        <p className="text-sm text-gray-400 mt-1">Click "Apply for Service" to submit your first application</p>
                      </td>
                    </tr>
                  ) : (
                    applications.slice(0, 5).map(app => (
                      <tr key={app.id}>
                        <td className="font-medium">{app.id}</td>
                        <td>{app.service}</td>
                        <td>{app.institution}</td>
                        <td>
                          <span className={`badge ${
                            app.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                            app.status === 'Under Review' ? 'bg-amber-100 text-amber-800' :
                            app.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td>{app.submittedDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick action cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setActiveSection('apply')}
              className="stat-card hover:border-blue-400 transition flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1e3a8a] flex items-center justify-center text-xl font-bold">+</div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Apply for a Service</p>
                <p className="text-sm text-gray-500">Browse available services</p>
              </div>
            </button>
            <button
              onClick={() => setActiveSection('queue')}
              className="stat-card hover:border-blue-400 transition flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">My Queue</p>
                <p className="text-sm text-gray-500">{activeQueueCount > 0 ? `${activeQueueCount} active ticket${activeQueueCount > 1 ? 's' : ''}` : 'Join a service queue'}</p>
              </div>
            </button>
            <Link to="/" className="stat-card hover:border-blue-400 transition flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center text-xl">?</div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Find Service Info</p>
                <p className="text-sm text-gray-500">Documents, fees &amp; time</p>
              </div>
            </Link>
          </div>

          {/* Info box */}
          <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-sm text-green-800">
            <strong>Citizen:</strong> Submit applications, track application status, and view announcements. You cannot process other people&apos;s applications or access staff panels.
          </div>
        </>
      )}

      {/* My Applications Section */}
      {activeSection === 'applications' && (
        <MyApplicationsSection applications={applications} setActiveSection={setActiveSection} />
      )}

      {/* My Queue Section */}
      {activeSection === 'queue' && (
        <QueueManagement />
      )}

      {/* Apply for Service Section */}
      {activeSection === 'apply' && (
        <ApplyForServiceSection user={user} setActiveSection={setActiveSection} />
      )}

      {/* Announcements Section */}
      {activeSection === 'announcements' && (
        <CitizenAnnouncements />
      )}

      {/* Profile & Documents Section */}
      {activeSection === 'profile' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile & Documents</h2>
            <p className="text-gray-600">Manage your personal information and uploaded documents.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        defaultValue={user?.name || 'Citizen'}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+251 91 234 5678"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      rows="2"
                      placeholder="Your address"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                      Save Changes
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              {/* Change Password */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                    Update Password
                  </button>
                </div>
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                      PDF
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">National_ID.pdf</p>
                      <p className="text-xs text-gray-500">245 KB</p>
                    </div>
                    <button className="text-blue-600 hover:underline text-xs">View</button>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                      IMG
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">Photo.jpg</p>
                      <p className="text-xs text-gray-500">1.2 MB</p>
                    </div>
                    <button className="text-blue-600 hover:underline text-xs">View</button>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                      PDF
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">Birth_Certificate.pdf</p>
                      <p className="text-xs text-gray-500">189 KB</p>
                    </div>
                    <button className="text-blue-600 hover:underline text-xs">View</button>
                  </div>
                </div>
                <button className="w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition text-sm font-medium">
                  + Upload New Document
                </button>
              </div>

              {/* Account Stats */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Account Status</p>
                    <p className="text-xl font-bold">Active</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="opacity-90">Member Since:</span>
                    <span className="font-medium">May 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-90">Total Applications:</span>
                    <span className="font-medium">7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-90">Completed:</span>
                    <span className="font-medium">5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ─── My Applications Section Component ───────────────────────────
function MyApplicationsSection({ applications, setActiveSection }) {
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredApps = statusFilter === 'All' 
    ? applications 
    : applications.filter(app => app.status === statusFilter);

  // Application detail view
  if (selectedApp) {
    const app = applications.find(a => a.id === selectedApp);
    if (!app) {
      setSelectedApp(null);
      return null;
    }

    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelectedApp(null)}
            className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Applications
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{app.service}</h2>
                <p className="text-sm text-gray-600">{app.institution}</p>
              </div>
              <span className={`badge text-sm px-3 py-1 ${
                app.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                app.status === 'Under Review' ? 'bg-amber-100 text-amber-800' :
                app.status === 'Approved' ? 'bg-green-100 text-green-800' :
                app.status === 'Completed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {app.status}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Application ID</p>
                <p className="font-semibold text-gray-900">{app.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Reference Number</p>
                <p className="font-semibold text-gray-900">{app.referenceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Submitted Date</p>
                <p className="font-medium text-gray-900">{app.submittedDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                <p className="font-medium text-gray-900">{app.lastUpdated}</p>
              </div>
            </div>

            {app.applicantDetails && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Applicant Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Full Name</p>
                    <p className="font-medium text-gray-900">{app.applicantDetails.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="font-medium text-gray-900">{app.applicantDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">{app.applicantDetails.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Address</p>
                    <p className="font-medium text-gray-900">{app.applicantDetails.address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {app.additionalInfo && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Additional Information</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{app.additionalInfo}</p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Applications list view
  return (
    <>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">My Applications</h2>
          <p className="text-sm text-gray-500">Track and manage your service applications</p>
        </div>
        <button
          onClick={() => setActiveSection('apply')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Application
        </button>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex gap-2 flex-wrap">
        {['All', 'Submitted', 'Under Review', 'Approved', 'Completed', 'Rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status} {status === 'All' ? `(${applications.length})` : `(${applications.filter(a => a.status === status).length})`}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Service</th>
                <th>Institution</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-12">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-medium text-gray-500">No applications found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {statusFilter === 'All' 
                        ? 'Click "New Application" to submit your first application'
                        : `No applications with status "${statusFilter}"`
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredApps.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="font-medium">{app.id}</td>
                    <td>{app.service}</td>
                    <td>{app.institution}</td>
                    <td>
                      <span className={`badge ${
                        app.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'Under Review' ? 'bg-amber-100 text-amber-800' :
                        app.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        app.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td>{app.submittedDate}</td>
                    <td>{app.lastUpdated}</td>
                    <td>
                      <button
                        onClick={() => setSelectedApp(app.id)}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        View Details
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

// ─── Apply for Service Section Component ──────────────────────────
function ApplyForServiceSection({ user, setActiveSection }) {
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    additionalInfo: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  const filteredInstitutions = organizationsData.filter(org => {
    const q = searchQuery.toLowerCase();
    return (
      org.name_en.toLowerCase().includes(q) ||
      org.name_am.toLowerCase().includes(q) ||
      org.services.some(s => 
        s.title_en.toLowerCase().includes(q) || 
        s.title_am.toLowerCase().includes(q)
      )
    );
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitApplication = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const application = {
      service: selectedService.title_en,
      institution: selectedInstitution.name_en,
      citizenEmail: user?.email,
      applicantDetails: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      },
      additionalInfo: formData.additionalInfo,
      serviceDetails: {
        time: selectedService.time,
        fee: selectedService.fee,
        requiredDocs: selectedService.docs_en
      }
    };

    const result = createApplication(application);
    
    if (result.success) {
      setSubmissionSuccess(result.application);
      setShowApplicationForm(false);
      // Reset form
      setFormData({
        fullName: user?.name || '',
        email: user?.email || '',
        phone: '',
        address: '',
        additionalInfo: ''
      });
    }
  };

  // Success confirmation view
  if (submissionSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted Successfully!</h2>
          <p className="text-gray-600 mb-6">Your application has been received and is being processed.</p>
          
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Your Reference Number:</p>
            <p className="text-3xl font-bold text-blue-600">{submissionSuccess.referenceNumber}</p>
            <p className="text-xs text-gray-500 mt-2">Please save this reference number for tracking</p>
          </div>

          <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium text-gray-900">{submissionSuccess.service}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Institution:</span>
              <span className="font-medium text-gray-900">{submissionSuccess.institution}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Submitted:</span>
              <span className="font-medium text-gray-900">{submissionSuccess.submittedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="badge bg-blue-100 text-blue-800">{submissionSuccess.status}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setActiveSection('applications')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              View My Applications
            </button>
            <button
              onClick={() => {
                setSubmissionSuccess(null);
                setSelectedInstitution(null);
                setSelectedService(null);
              }}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Application form modal
  if (showApplicationForm && selectedService && selectedInstitution) {
    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setShowApplicationForm(false)}
            className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Service Details
          </button>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Application Form</h2>
              <p className="text-sm text-gray-600">{selectedService.title_en} - {selectedInstitution.name_en}</p>
            </div>

            <form onSubmit={handleSubmitApplication} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${formErrors.fullName ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none`}
                    placeholder="Enter your full name"
                  />
                  {formErrors.fullName && <p className="text-xs text-red-600 mt-1">{formErrors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${formErrors.email ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none`}
                    placeholder="your.email@example.com"
                  />
                  {formErrors.email && <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${formErrors.phone ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none`}
                    placeholder="+251 91 234 5678"
                  />
                  {formErrors.phone && <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                    placeholder="Your address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                  placeholder="Any additional information or special requirements..."
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 font-medium mb-2">Required Documents:</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  {selectedService.docs_en.map((doc, i) => (
                    <li key={i}>• {doc}</li>
                  ))}
                </ul>
                <p className="text-xs text-amber-600 mt-2">Please ensure you have these documents ready for submission.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Submit Application
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }

  // Service details view
  if (selectedService && selectedInstitution) {
    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelectedService(null)}
            className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Services
          </button>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedService.title_en}</h2>
              <p className="text-sm text-gray-600">{selectedInstitution.name_en}</p>
            </div>

            <div className="p-6 space-y-6">
              {selectedService.description_en && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedService.description_en}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Processing Time</p>
                  <p className="font-semibold text-gray-900">{selectedService.time}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Service Fee</p>
                  <p className="font-semibold text-gray-900">{selectedService.fee}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Required Documents</h3>
                <ul className="space-y-2">
                  {selectedService.docs_en.map((doc, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedService.officialUrl && selectedService.officialUrl !== '#' && (
                <div className="border-t border-gray-100 pt-6">
                  <a
                    href={selectedService.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visit Official Service Website
                  </a>
                </div>
              )}

              <div className="border-t border-gray-100 pt-6">
                <button
                  onClick={() => setShowApplicationForm(true)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Apply for this Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Services list view (after institution selected)
  if (selectedInstitution) {
    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelectedInstitution(null)}
            className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Institutions
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <img
              src={selectedInstitution.image}
              alt={selectedInstitution.name_en}
              className="w-16 h-16 object-contain rounded-xl bg-gray-50 p-2"
              onError={(e) => { e.target.src = '/image/icon.png'; }}
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedInstitution.name_en}</h2>
              <p className="text-sm text-gray-500">{selectedInstitution.services.length} services available</p>
            </div>
          </div>
          {selectedInstitution.officialUrl && selectedInstitution.officialUrl !== '#' && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a
                href={selectedInstitution.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Visit Official Website
              </a>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {selectedInstitution.services.map((service, index) => (
            <div
              key={index}
              onClick={() => setSelectedService(service)}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{service.title_en}</h3>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {service.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {service.fee}
                    </span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Institutions list view (default)
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Apply for a Service</h2>
        <p className="text-sm text-gray-500">Select an institution to view available services</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search institutions or services..."
            className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Institutions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInstitutions.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">
            <p className="font-medium">No institutions found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          filteredInstitutions.map(org => (
            <div
              key={org.id}
              onClick={() => setSelectedInstitution(org)}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-blue-200 transition cursor-pointer"
            >
              <img
                src={org.image}
                alt={org.name_en}
                className="w-full h-32 object-contain rounded-lg bg-gray-50 mb-4 p-2"
                onError={(e) => { e.target.src = '/image/icon.png'; }}
              />
              <h3 className="font-semibold text-gray-900 mb-2 text-center">{org.name_en}</h3>
              <p className="text-sm text-gray-500 text-center">{org.services.length} services</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ─── Citizen Announcements Component ──────────────────────────────
function CitizenAnnouncements() {
  const [announcements, setAnnouncements] = useState(() => {
    // Citizens see system and mesob announcements (public announcements)
    const systemAnnouncements = getAnnouncements({ scope: 'system' });
    const mesobAnnouncements = getAnnouncements({ scope: 'mesob' });
    return [...systemAnnouncements, ...mesobAnnouncements].sort((a, b) => b.id - a.id);
  });
  const [selected, setSelected] = useState(null);

  function markRead(id) {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }

  // Announcement detail view
  if (selected) {
    const ann = announcements.find(a => a.id === selected);
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
            {!ann.read && <span className="badge bg-blue-100 text-blue-800 flex-shrink-0">New</span>}
          </div>
          <p className="text-sm text-gray-500 mb-4">{ann.date} {ann.author && `• ${ann.author}`}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{ann.body}</p>
        </div>
      </>
    );
  }

  // Announcement list view
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Announcements</h2>
        <p className="text-sm text-gray-500">Latest updates and notices from MESOB Center.</p>
      </div>

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
              onClick={() => { setSelected(ann.id); markRead(ann.id); }}
              className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all duration-200 ${ann.read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!ann.read && <span className="inline-block w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />}
                    <h3 className="font-semibold text-sm text-gray-900 leading-snug">{ann.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500">{ann.date} {ann.author && `• ${ann.author}`}</p>
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

