import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import QueueManagement from '../../components/dashboard/QueueManagement';
import FeedbackRating from '../../components/dashboard/FeedbackRating';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import { useApplications } from '../../context/ApplicationContext';
import { useAnnouncements } from '../../context/AnnouncementContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useServices } from '../../context/ServiceContext';
import { useApp } from '../../context/AppContext';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const { t } = useApp();
  const { getActiveTickets } = useQueue();
  const { applications, getActiveApplications, getCompletedApplications } = useApplications();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [applyKey, setApplyKey] = useState(0);
  const firstName = user?.name?.split(' ')[0] || t.citizen;
  const activeQueueCount = getActiveTickets().length;
  
  // Get application counts
  const activeApplications = getActiveApplications().length;
  const completedApplications = getCompletedApplications().length;

  const handleNavClick = (section) => {
    if (section === 'apply') {
      setApplyKey(k => k + 1);
    }
    setActiveSection(section);
  };

  const navLinks = [
    { label: t.my_dashboard, section: 'dashboard' },
    { label: t.my_applications, section: 'applications' },
    { label: t.my_feedback, section: 'feedback' },
    { label: t.my_queue, section: 'queue' },
    { label: t.apply_for_service, section: 'apply' },
    { label: t.announcements, section: 'announcements' },
    { label: t.profile_documents, section: 'profile' },
  ];

  return (
    <DashboardLayout
      title={t.my_account}
      navLinks={navLinks.map(link => ({
        label: link.label,
        href: '#',
        active: activeSection === link.section,
        onClick: (e) => {
          e.preventDefault();
          handleNavClick(link.section);
        }
      }))}
      letter="C"
      subtitle={t.citizen_portal}
    >
      {/* My Dashboard Section */}
      {activeSection === 'dashboard' && (
        <>
          {/* Welcome banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#314ea1] rounded-2xl p-6 sm:p-7 text-white mb-8 shadow-sm border border-[#1e3a8a]/40">
            {/* Top gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f4b51a] via-[#f59e0b] to-[#f4b51a]" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-[#f4b51a] border border-[#f4b51a]/30 text-xs font-semibold mb-3 backdrop-blur-xs">
                  <span>FDRE Hawassa MESOB Portal</span>
                  <span>•</span>
                  <span className="text-blue-100 font-normal">Public Services</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {t.welcome_back}, {firstName}!
                </h2>
                <p className="text-blue-100/90 text-sm sm:text-base mt-1 max-w-xl">
                  {t.track_applications || 'Track your service applications and access government services online.'}
                </p>
              </div>

              <div className="flex flex-col sm:items-end justify-center gap-1.5 sm:self-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-blue-100 backdrop-blur-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-white">Verified Account</span>
                  <span>•</span>
                  <span>Hawassa, Sidama</span>
                </div>
                <p className="text-xs text-blue-200/80 hidden sm:block">
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Active Applications */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t.active_applications || 'Active Applications'}
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#314ea1] border border-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-extrabold text-[#1e3a8a]">{activeApplications}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>In progress &amp; review</span>
              </p>
            </div>

            {/* Completed */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t.completed_apps || 'Completed'}
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-extrabold text-emerald-700">{completedApplications}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Successfully processed</span>
              </p>
            </div>

            {/* Active Queues */}
            <button
              onClick={() => setActiveSection('queue')}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide group-hover:text-amber-800 transition-colors">
                  {t.active_queues || 'Active Queue'}
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-extrabold text-amber-700">{activeQueueCount}</p>
              <p className="text-xs text-amber-800 font-medium mt-1 flex items-center justify-between">
                <span>{activeQueueCount > 0 ? `${activeQueueCount} ticket waiting` : 'No active ticket'}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </p>
            </button>

            {/* Total Applications */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t.total_applications || 'Total Submissions'}
                </span>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{applications.length}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>All-time requests</span>
              </p>
            </div>
          </div>

          {/* Applications table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-8">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#314ea1]" />
                <h2 className="font-bold text-slate-900 text-base">{t.recent_applications || 'Recent Applications'}</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#1e3a8a] border border-blue-200/60">
                  {applications.length}
                </span>
              </div>
              <button
                onClick={() => setActiveSection('applications')}
                className="text-xs sm:text-sm font-semibold text-[#314ea1] hover:text-[#1e3a8a] flex items-center gap-1 group cursor-pointer"
              >
                <span>{t.view_all || 'View all'}</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
            
            <div className="table-container border-0 rounded-none overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200/80">
                    <th className="px-5 py-3 text-left">{t.application_id || 'Application ID'}</th>
                    <th className="px-5 py-3 text-left">{t.service || 'Service'}</th>
                    <th className="px-5 py-3 text-left">{t.institution || 'Institution'}</th>
                    <th className="px-5 py-3 text-left">{t.status || 'Status'}</th>
                    <th className="px-5 py-3 text-left">{t.submitted || 'Submitted'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-400 py-12 px-4">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 text-[#314ea1] border border-blue-100 flex items-center justify-center">
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="font-semibold text-slate-700 text-sm">No applications submitted yet</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Submit applications for government services online and track each step in real time.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    applications.slice(0, 5).map(app => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-900 text-sm font-mono">{app.id}</td>
                        <td className="px-5 py-3.5 text-slate-800 text-sm font-medium">{app.service}</td>
                        <td className="px-5 py-3.5 text-slate-600 text-sm">{app.institution}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${
                            app.status === 'Submitted' ? 'bg-blue-50 text-[#1e3a8a] border-blue-200' :
                            app.status === 'Under Review' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            app.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            app.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs font-medium">{app.submittedDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick action cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setActiveSection('feedback')}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all text-left flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-amber-800 transition-colors text-sm sm:text-base">
                    Service Feedback
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Rate completed services and submit feedback</p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-amber-700 group-hover:translate-x-1 transition-all text-sm font-semibold">
                →
              </span>
            </button>

            <Link
              to="/service-catalogue"
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all text-left flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center group-hover:bg-[#1e3a8a] group-hover:text-white transition-all shadow-xs">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-[#1e3a8a] transition-colors text-sm sm:text-base">
                    Requirements &amp; Fees
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Documents, steps &amp; processing time</p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-[#1e3a8a] group-hover:translate-x-1 transition-all text-sm font-semibold">
                →
              </span>
            </Link>
          </div>

          {/* Info box */}
          <div className="p-4.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start sm:items-center gap-3.5 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[#314ea1] text-[#f4b51a] flex items-center justify-center flex-shrink-0 shadow-xs font-bold text-sm">
              ℹ️
            </div>
            <div className="text-xs sm:text-sm text-blue-950 leading-relaxed">
              <strong className="font-semibold text-[#1e3a8a]">Citizen Services Portal:</strong> Submit applications, join service queues remotely, and track approvals. All official status updates and notices are linked directly to your account.
            </div>
          </div>
        </>
      )}

      {/* My Applications Section */}
      {activeSection === 'applications' && (
        <MyApplicationsSection applications={applications} setActiveSection={setActiveSection} />
      )}

      {/* My Feedback Section */}
      {activeSection === 'feedback' && (
        <MyFeedbackSection />
      )}

      {/* My Queue Section */}
      {activeSection === 'queue' && (
        <QueueManagement />
      )}

      {/* Apply for Service Section */}
      {activeSection === 'apply' && (
        <ApplyForServiceSection key={applyKey} user={user} setActiveSection={setActiveSection} />
      )}

      {/* Announcements Section */}
      {activeSection === 'announcements' && (
        <CitizenAnnouncements />
      )}

      {/* Profile & Documents Section */}
      {activeSection === 'profile' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Profile &amp; Documents</h2>
            <p className="text-sm text-slate-500">Manage your personal information and uploaded documents.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 mb-4 text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#314ea1]" />
                  <span>Personal Information</span>
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Full Name</label>
                      <input
                        type="text"
                        defaultValue={user?.name || 'Citizen'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Email</label>
                      <input
                        type="email"
                        defaultValue={user?.email || ''}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+251 91 234 5678"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Date of Birth</label>
                      <input
                        type="date"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Address</label>
                    <textarea
                      rows="2"
                      placeholder="Your address"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 text-sm"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button className="px-5 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl shadow-xs transition text-sm font-semibold cursor-pointer">
                      Save Changes
                    </button>
                    <button className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition text-sm font-medium cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              {/* Change Password */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 mb-4 text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f4b51a]" />
                  <span>Change Password</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">New Password</label>
                    <input
                      type="password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 text-sm"
                    />
                  </div>
                  <div className="pt-2">
                    <button className="px-5 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl shadow-xs transition text-sm font-semibold cursor-pointer">
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 mb-4 text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#314ea1]" />
                  <span>Uploaded Documents</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50/80 border border-slate-100 rounded-xl">
                    <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center text-xs font-bold">
                      PDF
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">National_ID.pdf</p>
                      <p className="text-xs text-slate-500">245 KB</p>
                    </div>
                    <button className="text-[#314ea1] hover:text-[#1e3a8a] text-xs font-semibold cursor-pointer">View</button>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50/80 border border-slate-100 rounded-xl">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#314ea1] border border-blue-100 flex items-center justify-center text-xs font-bold">
                      IMG
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">Photo.jpg</p>
                      <p className="text-xs text-slate-500">1.2 MB</p>
                    </div>
                    <button className="text-[#314ea1] hover:text-[#1e3a8a] text-xs font-semibold cursor-pointer">View</button>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50/80 border border-slate-100 rounded-xl">
                    <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center text-xs font-bold">
                      PDF
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">Birth_Certificate.pdf</p>
                      <p className="text-xs text-slate-500">189 KB</p>
                    </div>
                    <button className="text-[#314ea1] hover:text-[#1e3a8a] text-xs font-semibold cursor-pointer">View</button>
                  </div>
                </div>
                <button className="w-full mt-4 px-4 py-2.5 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl hover:border-[#314ea1] hover:text-[#314ea1] hover:bg-blue-50/40 transition text-sm font-semibold cursor-pointer">
                  + Upload New Document
                </button>
              </div>

              {/* Account Stats */}
              <div className="bg-gradient-to-br from-[#172554] via-[#1e3a8a] to-[#314ea1] rounded-2xl p-6 text-white shadow-xs relative overflow-hidden border border-[#1e3a8a]/40">
                {/* Signature gold accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f4b51a] via-[#f59e0b] to-[#f4b51a]" />
                
                <div className="flex items-center gap-3.5 mb-4 pt-1">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#f4b51a] shadow-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-blue-200 uppercase tracking-wide">Account Status</p>
                    <p className="text-lg font-bold">Active Citizen Account</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-sm pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100/90 text-xs">Registration:</span>
                    <span className="font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md text-xs border border-emerald-400/30">Verified</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100/90 text-xs">Total Applications:</span>
                    <span className="font-bold text-white text-xs">{applications.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100/90 text-xs">Completed:</span>
                    <span className="font-bold text-emerald-300 text-xs">{completedApplications}</span>
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
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Applications
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/80">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{app.service}</h2>
                <p className="text-sm text-slate-600">{app.institution}</p>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                app.status === 'Submitted' ? 'bg-blue-50 text-[#1e3a8a] border-blue-200' :
                app.status === 'Under Review' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                app.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                app.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {app.status}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Application ID</p>
                <p className="font-semibold text-slate-900 font-mono text-sm">{app.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Reference Number</p>
                <p className="font-semibold text-[#1e3a8a] font-mono text-sm">{app.referenceNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Submitted Date</p>
                <p className="font-medium text-slate-800 text-sm">{app.submittedDate}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Last Updated</p>
                <p className="font-medium text-slate-800 text-sm">{app.lastUpdated}</p>
              </div>
            </div>

            {app.applicantDetails && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-4 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#314ea1]" />
                  <span>Applicant Details</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Full Name</p>
                    <p className="font-medium text-slate-900 text-sm">{app.applicantDetails.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <p className="font-medium text-slate-900 text-sm">{app.applicantDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Phone</p>
                    <p className="font-medium text-slate-900 text-sm">{app.applicantDetails.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Address</p>
                    <p className="font-medium text-slate-900 text-sm">{app.applicantDetails.address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {app.additionalInfo && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-2 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f4b51a]" />
                  <span>Additional Information</span>
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">{app.additionalInfo}</p>
              </div>
            )}

            {/* Feedback Rating Section - Only show for completed applications with valid IDs */}
            {app.status === 'Completed' && app.institutionId && app.serviceId && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-4 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Rate This Service</span>
                </h3>
                <FeedbackRating
                  applicationId={app.id}
                  institutionId={app.institutionId}
                  serviceId={app.serviceId}
                  institutionName={app.institution}
                  serviceName={app.service}
                />
              </div>
            )}
            
            {/* Show info message for completed applications without valid IDs */}
            {app.status === 'Completed' && (!app.institutionId || !app.serviceId) && (
              <div className="border-t border-slate-100 pt-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
                  <p className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Feedback is not available for this application as it is missing service information.</span>
                  </p>
                </div>
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
          <h2 className="text-xl font-bold text-slate-900 mb-1">My Applications</h2>
          <p className="text-sm text-slate-500">Track and manage your service applications</p>
        </div>
        <button
          onClick={() => setActiveSection('apply')}
          className="px-5 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl shadow-xs transition text-sm font-semibold flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Application
        </button>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 mb-6 flex gap-2 flex-wrap shadow-xs">
        {['All', 'Submitted', 'Under Review', 'Approved', 'Completed', 'Rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              statusFilter === status
                ? 'bg-[#314ea1] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 font-medium'
            }`}
          >
            {status} {status === 'All' ? `(${applications.length})` : `(${applications.filter(a => a.status === status).length})`}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="table-container border-0 rounded-none overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200/80">
                <th className="px-5 py-3 text-left">Application ID</th>
                <th className="px-5 py-3 text-left">Service</th>
                <th className="px-5 py-3 text-left">Institution</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Submitted</th>
                <th className="px-5 py-3 text-left">Last Updated</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-400 py-12 px-4">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 text-[#314ea1] border border-blue-100 flex items-center justify-center">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">No applications found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {statusFilter === 'All' 
                        ? 'Click "New Application" to submit your first application'
                        : `No applications with status "${statusFilter}"`
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredApps.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900 text-sm font-mono">{app.id}</td>
                    <td className="px-5 py-3.5 text-slate-800 text-sm font-medium">{app.service}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-sm">{app.institution}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        app.status === 'Submitted' ? 'bg-blue-50 text-[#1e3a8a] border-blue-200' :
                        app.status === 'Under Review' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        app.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        app.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs font-medium">{app.submittedDate}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs font-medium">{app.lastUpdated}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setSelectedApp(app.id)}
                        className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold cursor-pointer"
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
  const { createApplication } = useApplications();
  const { institutions, getServicesByInstitution, loading: servicesLoading } = useServices();
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deduplicate institutions to avoid repeated items
  const uniqueInstitutions = useMemo(() => {
    const seen = new Set();
    return institutions.filter(inst => {
      if (!inst?.id || seen.has(inst.id)) return false;
      seen.add(inst.id);
      return true;
    });
  }, [institutions]);

  // Filter institutions based on search query
  const filteredInstitutions = useMemo(() => {
    if (!searchQuery.trim()) return uniqueInstitutions;
    
    const q = searchQuery.toLowerCase();
    return uniqueInstitutions.filter(inst => {
      const instServices = getServicesByInstitution(inst.id);
      return (
        inst.name_en?.toLowerCase().includes(q) ||
        inst.name_am?.toLowerCase().includes(q) ||
        instServices.some(s => 
          s.name?.toLowerCase().includes(q) || 
          s.name_am?.toLowerCase().includes(q)
        )
      );
    });
  }, [uniqueInstitutions, searchQuery, getServicesByInstitution]);

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

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Prepare application data in the format expected by backend
      const applicationData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        additionalInfo: formData.additionalInfo,
        serviceName: selectedService.name,
        institutionName: selectedInstitution.name_en,
        serviceDetails: {
          time: selectedService.processing_time,
          fee: selectedService.fee_amount,
          requiredDocs: [] // Requirements will be fetched separately if needed
        }
      };

      // Use real institution and service IDs from backend data
      const result = await createApplication(
        selectedService.id,
        selectedInstitution.id, 
        applicationData, 
        []
      );
      
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
      } else {
        // Show error message to user
        alert(result.message || 'Failed to submit application. Please try again.');
      }
    } catch (err) {
      console.error('Failed to submit application:', err);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Service Details
          </button>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/80">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Application Form</h2>
              <p className="text-sm text-slate-600">{selectedService.name} — {selectedInstitution.name_en}</p>
            </div>

            <form onSubmit={handleSubmitApplication} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${formErrors.fullName ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-300'} focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 text-sm`}
                    placeholder="Enter your full name"
                  />
                  {formErrors.fullName && <p className="text-xs text-rose-600 mt-1">{formErrors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${formErrors.email ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-300'} focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 text-sm`}
                    placeholder="your.email@example.com"
                  />
                  {formErrors.email && <p className="text-xs text-rose-600 mt-1">{formErrors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${formErrors.phone ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-300'} focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 text-sm`}
                    placeholder="+251 91 234 5678"
                  />
                  {formErrors.phone && <p className="text-xs text-rose-600 mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 text-sm"
                    placeholder="Your address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Additional Information
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 text-sm"
                  placeholder="Any additional information or special requirements..."
                />
              </div>

              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-1">Application Information:</p>
                <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                  Please ensure you have all necessary documents ready for submission. You may be contacted by the institution for additional requirements.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl shadow-xs transition font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium text-sm cursor-pointer"
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
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Services
          </button>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/80">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedService.name}</h2>
              <p className="text-sm text-slate-600">{selectedInstitution.name_en}</p>
            </div>

            <div className="p-6 space-y-6">
              {selectedService.description && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-2 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#314ea1]" />
                    <span>Description</span>
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedService.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Processing Time</p>
                  <p className="font-bold text-[#1e3a8a] text-base">{selectedService.processing_time || 'N/A'}</p>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Service Fee</p>
                  <p className="font-bold text-emerald-800 text-base">
                    {selectedService.fee_amount ? `${selectedService.fee_amount} ETB` : 'Free'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f4b51a]" />
                  <span>Service Information</span>
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Please prepare all necessary documents before applying. You can check with the institution for specific requirements.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <button
                  onClick={() => setShowApplicationForm(true)}
                  className="w-full px-6 py-3.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl shadow-xs transition font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
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
  // Deduplicate services to prevent repeated service cards
  const institutionServices = useMemo(() => {
    if (!selectedInstitution?.id) return [];
    const rawServices = getServicesByInstitution(selectedInstitution.id);
    const seen = new Set();
    return rawServices.filter(svc => {
      if (!svc?.id || seen.has(svc.id)) return false;
      seen.add(svc.id);
      return true;
    });
  }, [selectedInstitution, getServicesByInstitution]);

  if (selectedInstitution) {
    
    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelectedInstitution(null)}
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Institutions
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] shadow-xs">
              <span className="text-2xl font-bold">
                {selectedInstitution.name_en?.charAt(0) || 'I'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{selectedInstitution.name_en}</h2>
              <p className="text-xs sm:text-sm text-slate-500">{institutionServices.length} services available</p>
            </div>
          </div>
          {selectedInstitution.website_url && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <a
                href={selectedInstitution.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
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
          {institutionServices.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-white rounded-2xl border border-slate-200/90 p-8">
              No services available for this institution
            </div>
          ) : (
            institutionServices.map((service) => (
              <div
                key={service.id}
                onClick={() => setSelectedService(service)}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:shadow-md hover:border-[#314ea1] transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-[#314ea1] transition-colors mb-2 text-base">{service.name}</h3>
                    <div className="flex gap-4 text-xs sm:text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {service.processing_time || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-[#1e3a8a]">
                        <svg className="w-4 h-4 text-[#314ea1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {service.fee_amount ? `${service.fee_amount} ETB` : 'Free'}
                      </span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-[#314ea1] group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  // Institutions list view (default)
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Apply for a Service</h2>
        <p className="text-sm text-slate-500">Select an institution to view available services</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search institutions or services..."
            className="w-full px-4 py-3 pl-11 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none shadow-2xs text-sm"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Institutions Grid */}
      {servicesLoading ? (
        <div className="col-span-full text-center text-slate-500 py-12">
          <div className="animate-pulse">Loading institutions...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInstitutions.length === 0 ? (
            <div className="col-span-full text-center text-slate-400 py-12 bg-white rounded-2xl border border-slate-200/90 p-8">
              <p className="font-semibold text-slate-600">No institutions found</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
            </div>
          ) : (
            filteredInstitutions.map(inst => {
              const instServices = getServicesByInstitution(inst.id);
              return (
                <div
                  key={inst.id}
                  onClick={() => setSelectedInstitution(inst)}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:shadow-md hover:border-[#314ea1] transition-all cursor-pointer group"
                >
                  <div className="w-full h-32 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#edf4fc] border border-slate-100 mb-4 p-3">
                    {inst.logo_url ? (
                      <img
                        src={inst.logo_url}
                        alt={inst.name_en}
                        className="max-w-full max-h-full object-contain p-2"
                        onError={(e) => { 
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={inst.logo_url ? "hidden" : "flex"} style={{display: inst.logo_url ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                      <span className="text-4xl font-bold text-[#314ea1]">
                        {inst.name_en?.charAt(0) || 'I'}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-[#314ea1] transition-colors mb-2 text-center text-base">{inst.name_en}</h3>
                  <div className="text-center">
                    <span className="text-xs font-semibold text-[#1e3a8a] bg-blue-50/80 border border-blue-200/70 px-3 py-1 rounded-full text-center inline-block">
                      {instServices.length} {instServices.length === 1 ? 'service' : 'services'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </>
  );
}

// ─── My Feedback Section Component ────────────────────────────────
function MyFeedbackSection() {
  const { myFeedback, loading, fetchMyFeedback } = useFeedback();
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Fetch feedback on mount
  useEffect(() => {
    fetchMyFeedback();
  }, [fetchMyFeedback]);

  const getRatingStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  const getRatingMeaning = (rating) => {
    const meanings = {
      1: 'Poor',
      2: 'Good',
      3: 'Very Good',
      4: 'Excellent',
      5: 'Fantastic'
    };
    return meanings[rating] || '';
  };

  // Feedback detail view
  if (selectedFeedback) {
    const feedback = myFeedback.find(f => f.id === selectedFeedback);
    if (!feedback) {
      setSelectedFeedback(null);
      return null;
    }

    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelectedFeedback(null)}
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Feedback
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-amber-100/90 bg-gradient-to-r from-amber-50/80 via-yellow-50/50 to-amber-50/80">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{feedback.service_name}</h2>
                <p className="text-sm text-slate-600">{feedback.institution_name}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl mb-1">{getRatingStars(feedback.rating)}</div>
                <p className="text-xs sm:text-sm font-semibold text-amber-900">{feedback.rating}/5 — {getRatingMeaning(feedback.rating)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Rating</p>
                <p className="font-bold text-slate-900 text-sm">
                  {getRatingStars(feedback.rating)} {feedback.rating}/5 — {getRatingMeaning(feedback.rating)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Source</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  feedback.source === 'WEBSITE' ? 'bg-blue-50 text-[#1e3a8a] border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {feedback.source === 'WEBSITE' ? 'Website Portal' : 'Telegram Bot'}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Submitted</p>
                <p className="font-medium text-slate-800 text-sm">{new Date(feedback.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Time</p>
                <p className="font-medium text-slate-800 text-sm">{new Date(feedback.created_at).toLocaleTimeString()}</p>
              </div>
            </div>

            {feedback.comment && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-2 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f4b51a]" />
                  <span>Your Feedback Comment</span>
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">{feedback.comment}</p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Feedback list view
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1">My Feedback</h2>
        <p className="text-sm text-slate-500">View your service ratings and feedback history</p>
      </div>

      {loading && myFeedback.length === 0 && (
        <div className="text-center py-8 text-slate-500">Loading your feedback...</div>
      )}

      {!loading && myFeedback.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-700 text-sm">No feedback submitted yet</p>
          <p className="text-xs text-slate-500 mt-1">After completing a service, you can rate your experience here.</p>
        </div>
      )}

      {myFeedback.length > 0 && (
        <div className="space-y-3">
          {myFeedback.map(feedback => (
            <div
              key={feedback.id}
              onClick={() => setSelectedFeedback(feedback.id)}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 cursor-pointer hover:border-amber-400 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-800 transition-colors">{feedback.service_name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      feedback.source === 'WEBSITE' ? 'bg-blue-50 text-[#1e3a8a] border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {feedback.source === 'WEBSITE' ? 'Website' : 'Telegram'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{feedback.institution_name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getRatingStars(feedback.rating)}</span>
                    <span className="text-xs font-semibold text-amber-900">{feedback.rating}/5 — {getRatingMeaning(feedback.rating)}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{new Date(feedback.created_at).toLocaleDateString()}</p>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Citizen Announcements Component ──────────────────────────────
function CitizenAnnouncements() {
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
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Announcements
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900">{ann.title}</h2>
            {ann.is_active && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex-shrink-0">
                Active
              </span>
            )}
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
        <h2 className="text-xl font-bold text-slate-900 mb-1">Announcements</h2>
        <p className="text-sm text-slate-500">Latest updates and notices from MESOB Center.</p>
      </div>

      {loading && !announcements.length && (
        <div className="text-center py-8 text-slate-500">Loading announcements...</div>
      )}

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#314ea1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <p className="font-semibold text-slate-700 text-sm">No announcements at this time</p>
            <p className="text-xs text-slate-500 mt-1">Official updates and notices from MESOB Center will appear here.</p>
          </div>
        ) : (
          announcements.map(ann => (
            <div
              key={ann.id}
              onClick={() => setSelected(ann.id)}
              className={`bg-white rounded-2xl border shadow-xs p-5 cursor-pointer hover:shadow-sm hover:border-blue-300 transition-all duration-200 group ${ann.is_active ? 'border-slate-200/90' : 'border-slate-200 bg-slate-50/60'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {ann.is_active && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#314ea1] transition-colors leading-snug">{ann.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-[#314ea1] group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

