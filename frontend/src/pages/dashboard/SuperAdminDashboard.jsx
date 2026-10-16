import { useState, useEffect } from 'react';
import { useAuth, ROLE_LABELS, ROLE_BADGE } from '../../context/AuthContext';
import { useAnnouncements } from '../../context/AnnouncementContext';
import { useServices } from '../../context/ServiceContext';
import { useQueue } from '../../context/QueueContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import { organizationsData } from '../../data/organizations';
import { useApp } from '../../context/AppContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import NotificationBell from '../../components/dashboard/NotificationBell';
import ApprovalsManagement from '../../components/dashboard/ApprovalsManagement';
import api from '../../utils/api';

// ─── Navigation sections ──────────────────────────────────────────
// Using function to access translations dynamically
function getSections(t) {
  return [
    t.dashboard,
    t.user_management,
    t.institution_management,
    t.central_approvals || 'Central Approvals',
    t.roles_permissions,
    t.system_settings,
    t.reports,
    t.analytics,
    t.announcements,
    t.my_profile,
  ];
}

// ─── Role display helpers ─────────────────────────────────────────
const ROLE_COLORS = {
  super_admin:         'bg-slate-100 text-slate-800 border-slate-300',
  mesob_manager:       'bg-blue-50 text-[#1e3a8a] border-blue-200',
  institution_manager: 'bg-blue-50 text-[#1e3a8a] border-blue-200',
  employee:            'bg-blue-50 text-[#1e3a8a] border-blue-200',
  technician:          'bg-blue-50 text-[#1e3a8a] border-blue-200',
  customer:            'bg-blue-50 text-[#1e3a8a] border-blue-200',
};
Object.defineProperty(ROLE_COLORS, 'ict_staff', { value: 'bg-blue-50 text-[#1e3a8a] border-blue-200', enumerable: false, writable: true, configurable: true });
Object.defineProperty(ROLE_COLORS, 'citizen', { value: 'bg-blue-50 text-[#1e3a8a] border-blue-200', enumerable: false, writable: true, configurable: true });

// No mock data - all data comes from shared data system or real backend

// ─── Helpers ──────────────────────────────────────────────────────
function stripPassword(u) {
  // NEVER expose password — return only safe display fields
  return { 
    id: u.id, 
    name: u.name, 
    email: u.email, 
    phone: u.phone || null,
    role: u.role, 
    institution: u.institution || null,
    employeeId: u.employeeId || null,
    status: u.status || 'Active' 
  };
}

function RoleBadge({ role }) {
  const cls = ROLE_BADGE[role] || 'bg-slate-100 text-slate-700 border-slate-200';
  return <span className={`badge ${cls} font-semibold`}>{ROLE_LABELS[role] || role}</span>;
}

function StatusBadge({ status, approvalStatus }) {
  const effective = approvalStatus || status;
  let cls = 'badge bg-slate-100 text-slate-700 border border-slate-200 font-semibold';
  let label = effective || 'Unknown';

  if (effective === 'Active' || effective === 'ACTIVE' || effective === 'APPROVED') {
    cls = 'badge bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold';
    label = 'Active';
  } else if (effective === 'PENDING_APPROVAL' || effective === 'pending') {
    cls = 'badge bg-amber-50 text-amber-800 border border-amber-200 font-semibold';
    label = 'Pending Approval';
  } else if (effective === 'REJECTED' || effective === 'rejected') {
    cls = 'badge bg-rose-50 text-rose-800 border border-rose-200 font-semibold';
    label = 'Rejected';
  } else if (effective === 'INACTIVE' || effective === 'Inactive') {
    cls = 'badge bg-slate-100 text-slate-700 border border-slate-200 font-semibold';
    label = 'Inactive';
  } else if (effective === 'SUSPENDED' || effective === 'Suspended') {
    cls = 'badge bg-rose-50 text-rose-700 border border-rose-200 font-semibold';
    label = 'Suspended';
  }
  return <span className={cls}>{label}</span>;
}

// ─── SECTION: Dashboard Overview ─────────────────────────────────
function SectionDashboard({ setActiveSection }) {
  const { getUsers } = useAuth();
  const { announcements } = useAnnouncements();
  const { institutions } = useServices();
  const { t } = useApp();
  const users = getUsers().map(stripPassword);
  const unread = announcements.filter(a => !a.is_read).length;

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.total_users}</p>
          <p className="text-2xl font-bold text-slate-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.institutions}</p>
          <p className="text-2xl font-bold text-slate-900">{institutions.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.active_users}</p>
          <p className="text-2xl font-bold text-emerald-700">{users.filter(u => u.status === 'Active').length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.announcements}</p>
          <p className="text-2xl font-bold text-slate-900">{unread}</p>
          <p className="text-xs text-slate-500 mt-1">{t.unread}</p>
        </div>
      </div>

      {/* User overview */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">{t.user_overview}</h2>
          <button onClick={() => setActiveSection(t.user_management)} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold transition">{t.view_all}</button>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead><tr><th>{t.name}</th><th>{t.email}</th><th>{t.role}</th><th>{t.status}</th></tr></thead>
            <tbody>
              {users.slice(0, 5).map(u => (
                <tr key={u.id}>
                  <td className="font-semibold text-slate-900">{u.name}</td>
                  <td className="text-slate-600">{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td><StatusBadge status={u.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Institution overview */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Institution Overview</h2>
          <button onClick={() => setActiveSection('Institution Management')} className="text-sm text-[#314ea1] hover:text-[#1e3a8a] font-semibold transition">View all</button>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead><tr><th>Institution</th><th>Services</th><th>Status</th></tr></thead>
            <tbody>
              {institutions.slice(0, 5).map(inst => (
                <tr key={inst.id}>
                  <td className="font-semibold text-slate-900">{inst.name_en || inst.name}</td>
                  <td className="text-slate-600">{inst.services?.length || 0}</td>
                  <td><span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">{inst.status || 'Active'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role overview cards */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6">
        <h2 className="font-bold text-slate-900 mb-4">Role Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {Object.entries(ROLE_LABELS).map(([key, label]) => {
            const count = users.filter(u => u.role === key || (key === 'technician' && u.role === 'ict_staff') || (key === 'customer' && u.role === 'citizen')).length;
            return (
              <div key={key} className={`p-3 rounded-xl border ${ROLE_COLORS[key] || 'bg-slate-50 text-slate-800 border-slate-200'}`}>
                <strong className="text-slate-900">{label}</strong>
                <p className="text-xs mt-0.5 opacity-75">
                  {count} user{count !== 1 ? 's' : ''}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800">
        <strong className="text-slate-900">System Admin:</strong> Full system access — user management, institution management, roles, settings, reports, and analytics.
      </div>
    </>
  );
}

// ─── SECTION: User Management ─────────────────────────────────────
// ─── SECTION: User Management ─────────────────────────────────────
function SectionUserManagement() {
  const { user: currentUser, getUsers, fetchUsers, createUser, updateUser, toggleUserStatus, usersLoading } = useAuth();
  const [rawUsers, setRawUsers] = useState(() => getUsers().map(stripPassword));
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterInstitution, setFilterInstitution] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editError, setEditError] = useState('');

  // Refresh users list when usersLoading completes (data has been fetched)
  useEffect(() => {
    if (!usersLoading) {
      const users = getUsers();
      const cleanedUsers = users.map(stripPassword);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRawUsers(cleanedUsers);
    }
    // Disable exhaustive-deps as we only want this to run when loading state changes
    // setState inside this effect is intentional to sync with context
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersLoading]);

  // Fetch users from backend on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Add User Form State
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    institution: '',
    employeeId: '',
    status: 'Active',
  });

  // Get list of institutions from ServiceContext
  const { institutions: institutionsList } = useServices();
  const institutions = institutionsList; // Use full institution objects

  const filtered = rawUsers.filter(u => {
    const q = query.toLowerCase();
    const matchQ = !q || 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(q));
    const matchR = !filterRole || 
      u.role === filterRole || 
      (filterRole === 'technician' && u.role === 'ict_staff') ||
      (filterRole === 'customer' && u.role === 'citizen') ||
      (filterRole === 'ict_staff' && u.role === 'technician') ||
      (filterRole === 'citizen' && u.role === 'customer');
    const matchI = !filterInstitution || u.institution === filterInstitution;
    const matchS = !filterStatus || u.status === filterStatus;
    return matchQ && matchR && matchI && matchS;
  });

  // Determine which fields are required based on role
  function getRequiredFields(role) {
    const institutionRequired = ['institution_manager', 'employee', 'technician', 'ict_staff'].includes(role);
    const employeeIdRequired = ['institution_manager', 'employee', 'technician', 'ict_staff'].includes(role);
    return { institutionRequired, employeeIdRequired };
  }

  function resetNewUserForm() {
    setNewUserForm({
      name: '',
      email: '',
      phone: '',
      role: '',
      institution: '',
      employeeId: '',
      status: 'Active',
    });
    setEditError('');
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setEditError('');

    const { institutionRequired, employeeIdRequired } = getRequiredFields(newUserForm.role);

    // Validation
    if (!newUserForm.name.trim()) {
      setEditError('Full name is required.');
      return;
    }

    if (!newUserForm.email.trim()) {
      setEditError('Email is required.');
      return;
    }

    if (!newUserForm.role) {
      setEditError('Role is required.');
      return;
    }

    if (institutionRequired && !newUserForm.institution) {
      setEditError(`Institution is required for ${ROLE_LABELS[newUserForm.role]}.`);
      return;
    }

    if (employeeIdRequired && !newUserForm.employeeId.trim()) {
      setEditError(`Employee/Staff ID is required for ${ROLE_LABELS[newUserForm.role]}.`);
      return;
    }

    // Create user via AuthContext (now async)
    const result = await createUser(
      {
        name: newUserForm.name,
        email: newUserForm.email,
        phone: newUserForm.phone,
        role: newUserForm.role,
        institution: newUserForm.institution || null,
        employeeId: newUserForm.employeeId || null,
        status: newUserForm.status,
      },
      currentUser.role,
      currentUser.institution
    );

    if (!result.success) {
      setEditError(result.message);
      return;
    }

    // Show success with temp password
    alert(
      `User created successfully!\n\n` +
      `Name: ${result.user.full_name || result.user.name}\n` +
      `Email: ${result.user.email}\n` +
      `Role: ${ROLE_LABELS[result.user.role?.toLowerCase()] || result.user.role}\n` +
      `Temporary Password: ${result.tempPassword}\n\n` +
      `Please share this temporary password with the user securely.`
    );

    // User list will auto-refresh via useEffect watching usersLoading
    resetNewUserForm();
    setShowAddUser(false);
  }

  async function handleEditUser(e) {
    e.preventDefault();
    setEditError('');

    if (!editUser.name.trim()) {
      setEditError('Name is required.');
      return;
    }

    const { institutionRequired, employeeIdRequired } = getRequiredFields(editUser.role);

    if (institutionRequired && !editUser.institution) {
      setEditError(`Institution is required for ${ROLE_LABELS[editUser.role]}.`);
      return;
    }

    if (employeeIdRequired && !editUser.employeeId?.trim()) {
      setEditError(`Employee/Staff ID is required for ${ROLE_LABELS[editUser.role]}.`);
      return;
    }

    const result = await updateUser(
      editUser.id,
      {
        name: editUser.name,
        phone: editUser.phone,
        role: editUser.role,
        institution: editUser.institution || null,
        employeeId: editUser.employeeId || null,
        status: editUser.status,
      }
    );

    if (!result.success) {
      setEditError(result.message);
      return;
    }

    // User list will auto-refresh via useEffect watching usersLoading
    setEditUser(null);
    setEditError('');
  }

  async function handleToggleStatus(userId) {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.metadata?.approval?.status === 'PENDING_APPROVAL') {
      alert('This user account is currently pending Mesob Manager approval and cannot be activated directly.');
      return;
    }
    if (targetUser?.metadata?.approval?.status === 'REJECTED') {
      alert('This user account was rejected. Please review and resubmit via Central Approvals.');
      return;
    }
    const result = await toggleUserStatus(userId);
    if (result.success) {
      // User list will auto-refresh via useEffect watching usersLoading
      alert(result.message);
    } else {
      alert(result.message);
    }
  }

  // Add User Modal
  const addUserModal = showAddUser && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900 text-lg">Add New User</h3>
          <button onClick={() => { setShowAddUser(false); resetNewUserForm(); }} className="text-slate-400 hover:text-slate-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleAddUser} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newUserForm.name}
              onChange={e => setNewUserForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Abebe Kebede"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={newUserForm.email}
              onChange={e => setNewUserForm(f => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
            <input
              type="tel"
              value={newUserForm.phone}
              onChange={e => setNewUserForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+251 91 234 5678"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Role <span className="text-rose-500">*</span>
            </label>
            <select
              value={newUserForm.role}
              onChange={e => setNewUserForm(f => ({ ...f, role: e.target.value, institution: '', employeeId: '' }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            >
              <option value="">Select Role...</option>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Institution (conditional) */}
          {['institution_manager', 'employee', 'technician', 'ict_staff'].includes(newUserForm.role) && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Institution <span className="text-rose-500">*</span>
              </label>
              <select
                value={newUserForm.institution}
                onChange={e => setNewUserForm(f => ({ ...f, institution: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
              >
                <option value="">Select Institution...</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name_en || inst.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Employee/Staff ID (conditional) */}
          {['institution_manager', 'employee', 'technician', 'ict_staff'].includes(newUserForm.role) && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {['technician', 'ict_staff'].includes(newUserForm.role) ? 'Technician ID' : 'Employee ID'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newUserForm.employeeId}
                onChange={e => setNewUserForm(f => ({ ...f, employeeId: e.target.value }))}
                placeholder={['technician', 'ict_staff'].includes(newUserForm.role) ? 'TECH-001' : 'EMP-001'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
              />
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
            <select
              value={newUserForm.status}
              onChange={e => setNewUserForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4">
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Note:</strong> A temporary password will be generated for this user. Please share it securely with them after creation.
            </p>
          </div>

          {editError && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 font-medium">
              {editError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white text-sm font-semibold rounded-xl transition shadow-xs">
              Create User
            </button>
            <button type="button" onClick={() => { setShowAddUser(false); resetNewUserForm(); }}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Edit User Modal
  const editUserModal = editUser && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-2xl p-6 my-8">
        <h3 className="font-bold text-slate-900 text-lg mb-5">Edit User</h3>
        <form onSubmit={handleEditUser} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={editUser.name}
              onChange={e => setEditUser(u => ({ ...u, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={editUser.email}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
            <input
              type="tel"
              value={editUser.phone || ''}
              onChange={e => setEditUser(u => ({ ...u, phone: e.target.value }))}
              placeholder="+251 91 234 5678"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Role <span className="text-rose-500">*</span>
            </label>
            <select
              value={editUser.role}
              onChange={e => setEditUser(u => ({ ...u, role: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            >
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Institution (conditional) */}
          {['institution_manager', 'employee', 'technician', 'ict_staff'].includes(editUser.role) && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Institution <span className="text-rose-500">*</span>
              </label>
              <select
                value={editUser.institution || ''}
                onChange={e => setEditUser(u => ({ ...u, institution: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
              >
                <option value="">Select Institution...</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name_en || inst.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Employee/Staff ID (conditional) */}
          {['institution_manager', 'employee', 'technician', 'ict_staff'].includes(editUser.role) && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {['technician', 'ict_staff'].includes(editUser.role) ? 'Technician ID' : 'Employee ID'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editUser.employeeId || ''}
                onChange={e => setEditUser(u => ({ ...u, employeeId: e.target.value }))}
                placeholder={['technician', 'ict_staff'].includes(editUser.role) ? 'TECH-001' : 'EMP-001'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
              />
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
            <select
              value={editUser.status}
              onChange={e => setEditUser(u => ({ ...u, status: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {editError && (
            <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 font-medium">{editError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white text-sm font-semibold rounded-xl transition shadow-xs">
              Save Changes
            </button>
            <button type="button" onClick={() => { setEditUser(null); setEditError(''); }}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">User Management</h2>
          <p className="text-sm text-slate-500">Manage system users. Passwords are never displayed.</p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white text-sm font-semibold rounded-xl transition shadow-xs flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {addUserModal}
      {editUserModal}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name, email, ID..."
            className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
        >
          <option value="">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filterInstitution}
          onChange={e => setFilterInstitution(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
        >
          <option value="">All Institutions</option>
          {institutions.map(inst => (
            <option key={inst.id} value={inst.id}>{inst.name_en || inst.name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">System Users</h3>
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-2.5 py-1">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Institution</th>
                <th>Employee ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-slate-400 py-8">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id}>
                    <td className="font-semibold text-slate-900">{u.name}</td>
                    <td className="text-slate-600">{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>{u.institution || <span className="text-slate-400">—</span>}</td>
                    <td className="text-xs font-mono text-slate-600">{u.employeeId || <span className="text-slate-400">—</span>}</td>
                    <td>
                      <StatusBadge 
                        status={u.status} 
                        approvalStatus={u.metadata?.approval?.status} 
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const fullUser = getUsers().find(user => user.id === u.id);
                            const userRole = fullUser.role === 'ict_staff' ? 'technician' : fullUser.role === 'citizen' ? 'customer' : fullUser.role;
                            setEditUser({
                              id: fullUser.id,
                              name: fullUser.name,
                              email: fullUser.email,
                              phone: fullUser.phone || '',
                              role: userRole,
                              institution: fullUser.institution || '',
                              employeeId: fullUser.employeeId || '',
                              status: fullUser.status,
                            });
                          }}
                          className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold transition"
                        >
                          Edit
                        </button>
                        {u.metadata?.approval?.status === 'PENDING_APPROVAL' ? (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-md font-medium border border-amber-200">
                            Pending Review
                          </span>
                        ) : u.metadata?.approval?.status === 'REJECTED' ? (
                          <span className="text-xs text-rose-700 bg-rose-50 px-2 py-1 rounded-md font-medium border border-rose-200">
                            Rejected
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            className={`text-sm font-semibold transition ${u.status === 'Active' ? 'text-amber-700 hover:text-amber-800' : 'text-emerald-700 hover:text-emerald-800'}`}
                          >
                            {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800">
        <strong className="text-slate-900">Security:</strong> Passwords are never displayed or accessible through this interface. Users are created with temporary passwords that should be changed after first login.
      </div>
    </>
  );
}

// ─── SECTION: Institution Management ─────────────────────────────
function SectionInstitutionManagement() {
  // RBAC: Only super_admin may create/modify institutions.
  const { user } = useAuth();
  const { institutions: backendInstitutions, refreshInstitutions } = useServices();
  // Role is already transformed to lowercase by roleMapper
  const canCreate = user?.role === 'super_admin';
  
  // Use backend institutions as single source of truth
  const institutions = backendInstitutions || [];
  const [view, setView] = useState('list'); // 'list' | 'new' | 'edit'
  const [editingInstitution, setEditingInstitution] = useState(null);
  const [form, setForm] = useState({
    name_en: '',
    name_am: '',
    code: '',
    image: '',
    imagePreview: '',
    description: '',
    details: '',
    officialUrl: '',
    phone: '',
    email: '',
    address: '',
    services: [],
  });
  const [formError, setFormError] = useState('');

  // API-based institution CRUD functions
  async function createInstitutionAPI(institutionData) {
    try {
      const result = await api.post('/institutions', institutionData);
      
      if (result.success) {
        // Refresh institutions from backend
        await refreshInstitutions();
        return { success: true, message: 'Institution created successfully' };
      } else {
        return { success: false, message: result.message || 'Failed to create institution' };
      }
    } catch (error) {
      console.error('Error creating institution:', error);
      return { success: false, message: 'Failed to create institution' };
    }
  }

  async function updateInstitutionAPI(id, institutionData) {
    try {
      const result = await api.patch(`/institutions/${id}`, institutionData);
      
      if (result.success) {
        // Refresh institutions from backend
        await refreshInstitutions();
        return { success: true, message: 'Institution updated successfully' };
      } else {
        return { success: false, message: result.message || 'Failed to update institution' };
      }
    } catch (error) {
      console.error('Error updating institution:', error);
      return { success: false, message: 'Failed to update institution' };
    }
  }

  async function deleteInstitutionAPI(id) {
    try {
      const result = await api.delete(`/institutions/${id}`);
      
      if (result.success) {
        // Refresh institutions from backend
        await refreshInstitutions();
        return { success: true, message: 'Institution deleted successfully' };
      } else {
        return { success: false, message: result.message || 'Failed to delete institution' };
      }
    } catch (error) {
      console.error('Error deleting institution:', error);
      return { success: false, message: 'Failed to delete institution' };
    }
  }

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    title_en: '',
    title_am: '',
    description_en: '',
    description_am: '',
    time: '',
    fee: '',
    officialUrl: '',
    docs_en: [],
    docs_am: [],
  });
  const [editingServiceIndex, setEditingServiceIndex] = useState(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [docInput, setDocInput] = useState({ en: '', am: '' });

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(f => ({
        ...f,
        image: `/image/${file.name}`,
        imagePreview: reader.result
      }));
      setFormError('');
    };
    reader.readAsDataURL(file);
  }

  function addDocument() {
    if (!docInput.en.trim()) {
      setFormError('English document name is required.');
      return;
    }
    setServiceForm(f => ({
      ...f,
      docs_en: [...f.docs_en, docInput.en.trim()],
      docs_am: [...f.docs_am, docInput.am.trim() || docInput.en.trim()],
    }));
    setDocInput({ en: '', am: '' });
    setFormError('');
  }

  function removeDocument(index) {
    setServiceForm(f => ({
      ...f,
      docs_en: f.docs_en.filter((_, i) => i !== index),
      docs_am: f.docs_am.filter((_, i) => i !== index),
    }));
  }

  function validateService() {
    if (!serviceForm.title_en.trim()) return 'Service name is required.';
    if (serviceForm.docs_en.length === 0) return 'At least one required document must be added.';
    if (!serviceForm.time.trim()) return 'Processing time is required.';
    if (!serviceForm.fee.trim()) return 'Service fee is required.';
    if (serviceForm.officialUrl && !/^https?:\/\/.+/.test(serviceForm.officialUrl)) {
      return 'Invalid service website URL.';
    }
    return null;
  }

  function saveService() {
    const error = validateService();
    if (error) {
      setFormError(error);
      return;
    }

    if (editingServiceIndex !== null) {
      // Update existing service
      setForm(f => ({
        ...f,
        services: f.services.map((s, i) => i === editingServiceIndex ? { ...serviceForm } : s)
      }));
    } else {
      // Add new service
      setForm(f => ({
        ...f,
        services: [...f.services, { ...serviceForm }]
      }));
    }

    // Reset service form
    setServiceForm({
      title_en: '',
      title_am: '',
      description_en: '',
      description_am: '',
      time: '',
      fee: '',
      officialUrl: '',
      docs_en: [],
      docs_am: [],
    });
    setEditingServiceIndex(null);
    setShowServiceForm(false);
    setFormError('');
  }

  function editService(index) {
    setServiceForm({ ...form.services[index] });
    setEditingServiceIndex(index);
    setShowServiceForm(true);
  }

  function removeService(index) {
    setForm(f => ({
      ...f,
      services: f.services.filter((_, i) => i !== index)
    }));
  }

  function validateInstitution() {
    if (!form.name_en.trim()) return 'Institution name is required.';
    if (!form.image) return 'Institution logo is required.';
    if (!form.description.trim()) return 'Institution description is required.';
    if (!form.details.trim()) return 'Institution details are required.';
    if (!form.officialUrl.trim()) return 'Official website is required.';
    if (!/^https?:\/\/.+/.test(form.officialUrl)) return 'Invalid official website URL.';
    if (form.services.length === 0) return 'At least one service must be added.';
    return null;
  }

  async function saveInstitution(e) {
    e.preventDefault();
    
    const error = validateInstitution();
    if (error) {
      setFormError(error);
      return;
    }

    // Map frontend fields to backend API fields
    const institutionData = {
      name: form.name_en.trim(),
      nameAm: form.name_am.trim() || form.name_en.trim(),
      code: form.code.trim() || form.name_en.trim().toLowerCase().replace(/\s+/g, '-'),
      logoUrl: form.image,
      description: form.description.trim(),
      details: form.details.trim(),
      websiteUrl: form.officialUrl.trim(),
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      address: form.address?.trim() || null,
      status: editingInstitution?.status || 'ACTIVE'
    };

    let result;
    if (editingInstitution) {
      // Update existing institution via API
      result = await updateInstitutionAPI(editingInstitution.id, institutionData);
    } else {
      // Create new institution via API
      result = await createInstitutionAPI(institutionData);
    }
    
    if (result.success) {
      // Reset form
      setForm({
        name_en: '',
        name_am: '',
        code: '',
        image: '',
        imagePreview: '',
        description: '',
        details: '',
        officialUrl: '',
        phone: '',
        email: '',
        address: '',
        services: [],
      });
      setFormError('');
      setView('list');
      setEditingInstitution(null);
      
      alert(editingInstitution ? 'Institution updated successfully!' : 'Institution created and submitted for Mesob Manager approval!');
    } else {
      setFormError(result.message || 'Failed to save institution');
    }
  }

  async function toggleStatus(id) {
    const institution = institutions.find(i => i.id === id);
    if (!institution) return;
    
    const approvalStatus = institution.metadata?.approval?.status;
    if (approvalStatus === 'PENDING_APPROVAL') {
      alert('This institution is currently pending Mesob Manager approval and cannot be activated directly.');
      return;
    }
    if (approvalStatus === 'REJECTED') {
      alert('This institution was rejected. Please review and resubmit via Central Approvals.');
      return;
    }

    const newStatus = institution.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    // Update via API
    const result = await updateInstitutionAPI(id, { status: newStatus });
    
    if (!result.success) {
      alert(result.message || 'Failed to update status');
    }
  }

  function editInstitution(institution) {
    setEditingInstitution(institution);
    setForm({
      name_en: institution.name_en || institution.name,
      name_am: institution.name_am || institution.nameAm || '',
      code: institution.code || '',
      image: institution.logo_url || institution.logoUrl || institution.image || '',
      imagePreview: institution.logo_url || institution.logoUrl || institution.image || '',
      description: institution.description || '',
      details: institution.details || '',
      officialUrl: institution.website_url || institution.websiteUrl || institution.officialUrl || '',
      phone: institution.phone || '',
      email: institution.email || '',
      address: institution.address || '',
      services: institution.services || [],
    });
    setView('new'); // Reuse the same form for editing
  }

  async function deleteInst(id) {
    const institution = institutions.find(i => i.id === id);
    if (!institution) return;
    
    if (!confirm(`Are you sure you want to delete "${institution.name_en || institution.name}"?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    const result = await deleteInstitutionAPI(id);
    if (result.success) {
      alert('Institution deleted successfully');
    } else {
      alert(result.message || 'Failed to delete institution');
    }
  }

  // New Institution Form View
  if (view === 'new' && canCreate) {
    return (
      <>
        <div className="mb-6">
          <button onClick={() => { setView('list'); setFormError(''); setShowServiceForm(false); }} 
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Institutions
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6 max-w-4xl">
          <h2 className="text-lg font-bold text-slate-900 mb-6">
            {editingInstitution ? 'Edit Institution' : 'Add New Institution'}
          </h2>
          
          <form onSubmit={saveInstitution} className="space-y-6">
            {/* Institution Information */}
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Institution Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Institution Name (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name_en}
                    onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                    placeholder="e.g. Immigration Service"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Institution Name (Amharic)
                  </label>
                  <input
                    type="text"
                    value={form.name_am}
                    onChange={e => setForm(f => ({ ...f, name_am: e.target.value }))}
                    placeholder="e.g. የኢሚግሬሽን አገልግሎት"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Institution Code
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. immigration (auto-generated if empty)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
                />
                <p className="text-xs text-slate-500 mt-1">Unique identifier for the institution. Auto-generated from name if left empty.</p>
              </div>

              <div className="mt-5">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Institution Logo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
                />
                {form.imagePreview && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-2">Logo Preview:</p>
                    <img src={form.imagePreview} alt="Logo preview" className="w-20 h-20 object-contain rounded-xl border border-slate-200 p-2 bg-slate-50" />
                  </div>
                )}
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Institution Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description explaining the institution and its role"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm resize-y"
                />
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Institution Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.details}
                  onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                  placeholder="Detailed institutional information used by the public institution listing"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm resize-y"
                />
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Official Institution Website <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={form.officialUrl}
                  onChange={e => setForm(f => ({ ...f, officialUrl: e.target.value }))}
                  placeholder="https://example.gov.et"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm"
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+251 11 234 5678"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="info@institution.gov.et"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Hawassa, Ethiopia"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Services Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Services</h3>
                <button
                  type="button"
                  onClick={() => { setShowServiceForm(true); setEditingServiceIndex(null); setServiceForm({ title_en: '', title_am: '', description_en: '', description_am: '', time: '', fee: '', officialUrl: '', docs_en: [], docs_am: [] }); }}
                  className="px-3 py-1.5 bg-[#314ea1] hover:bg-[#1e3a8a] text-white text-xs font-semibold rounded-lg transition"
                >
                  + Add Service
                </button>
              </div>

              {/* Services List */}
              {form.services.length > 0 && (
                <div className="space-y-3 mb-4">
                  {form.services.map((service, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{service.title_en}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {service.docs_en.length} document{service.docs_en.length !== 1 ? 's' : ''} • {service.time} • {service.fee}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            type="button"
                            onClick={() => editService(index)}
                            className="text-blue-600 hover:underline text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeService(index)}
                            className="text-red-600 hover:underline text-xs font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {form.services.length === 0 && !showServiceForm && (
                <p className="text-sm text-gray-400 py-4 text-center">No services added yet. Click "+ Add Service" to add one.</p>
              )}

              {/* Service Form */}
              {showServiceForm && (
                <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {editingServiceIndex !== null ? 'Edit Service' : 'New Service'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => { setShowServiceForm(false); setEditingServiceIndex(null); setFormError(''); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Service Name (English) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={serviceForm.title_en}
                        onChange={e => setServiceForm(f => ({ ...f, title_en: e.target.value }))}
                        placeholder="e.g. Business License"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Service Name (Amharic)
                      </label>
                      <input
                        type="text"
                        value={serviceForm.title_am}
                        onChange={e => setServiceForm(f => ({ ...f, title_am: e.target.value }))}
                        placeholder="e.g. የንግድ ፈቃድ"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description (English)
                      </label>
                      <textarea
                        rows={2}
                        value={serviceForm.description_en || ''}
                        onChange={e => setServiceForm(f => ({ ...f, description_en: e.target.value }))}
                        placeholder="Brief service description"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description (Amharic)
                      </label>
                      <textarea
                        rows={2}
                        value={serviceForm.description_am || ''}
                        onChange={e => setServiceForm(f => ({ ...f, description_am: e.target.value }))}
                        placeholder="የአገልግሎት መግለጫ"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm resize-y"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Processing Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={serviceForm.time}
                        onChange={e => setServiceForm(f => ({ ...f, time: e.target.value }))}
                        placeholder="e.g. 3-5 days"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Service Fee <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={serviceForm.fee}
                        onChange={e => setServiceForm(f => ({ ...f, fee: e.target.value }))}
                        placeholder="e.g. 500 ETB"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Official Service Website
                    </label>
                    <input
                      type="url"
                      value={serviceForm.officialUrl}
                      onChange={e => setServiceForm(f => ({ ...f, officialUrl: e.target.value }))}
                      placeholder="https://example.gov.et/service"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm"
                    />
                  </div>

                  {/* Required Documents */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Documents <span className="text-red-500">*</span>
                    </label>
                    
                    {serviceForm.docs_en.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {serviceForm.docs_en.map((doc, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                            <span className="text-sm text-gray-700">{doc}</span>
                            <button
                              type="button"
                              onClick={() => removeDocument(i)}
                              className="text-red-600 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={docInput.en}
                          onChange={e => setDocInput(d => ({ ...d, en: e.target.value }))}
                          placeholder="Document name (English)"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={docInput.am}
                          onChange={e => setDocInput(d => ({ ...d, am: e.target.value }))}
                          placeholder="Document name (Amharic)"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-[#314ea1] outline-none transition text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addDocument}
                      className="mt-2 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition"
                    >
                      + Add Document
                    </button>
                  </div>

                  <div className="pt-3 border-t border-blue-200">
                    <button
                      type="button"
                      onClick={saveService}
                      className="px-4 py-2 bg-[#314ea1] hover:bg-[#1e3a8a] text-white text-sm font-semibold rounded-lg transition"
                    >
                      {editingServiceIndex !== null ? 'Update Service' : 'Save Service'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form Error */}
            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {formError}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white font-semibold rounded-xl transition shadow-xs text-sm"
              >
                Save Institution
              </button>
            </div>
          </form>
        </div>
      </>
    );
  }

  // Institution List View
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Institution Management</h2>
          <p className="text-sm text-slate-500">Manage institutions registered in Hawassa MESOB.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setView('new')}
            className="px-4 py-2 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white text-sm font-semibold rounded-xl transition shadow-xs"
          >
            + Add Institution
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Registered Institutions</h3>
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-2.5 py-1">{institutions.length} total</span>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead><tr><th>Institution</th><th>Amharic Name</th><th>Code</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {institutions.map(org => (
                <tr key={org.id}>
                  <td className="font-semibold text-slate-900">{org.name_en || org.name}</td>
                  <td className="text-slate-700">{org.name_am || org.nameAm || ''}</td>
                  <td className="text-xs font-mono text-slate-600">{org.code || ''}</td>
                  <td>
                    <StatusBadge 
                      status={org.status} 
                      approvalStatus={org.metadata?.approval?.status} 
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      {canCreate && (
                        <>
                          <button onClick={() => editInstitution(org)}
                            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold transition">
                            Edit
                          </button>
                          {org.metadata?.approval?.status === 'PENDING_APPROVAL' ? (
                            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-md font-medium border border-amber-200">
                              Pending Review
                            </span>
                          ) : org.metadata?.approval?.status === 'REJECTED' ? (
                            <span className="text-xs text-rose-700 bg-rose-50 px-2 py-1 rounded-md font-medium border border-rose-200">
                              Rejected
                            </span>
                          ) : (
                            <button onClick={() => toggleStatus(org.id)}
                              className={`text-sm font-semibold transition ${(org.status === 'ACTIVE' || org.status === 'Active') ? 'text-amber-700 hover:text-amber-800' : 'text-emerald-700 hover:text-emerald-800'}`}>
                              {(org.status === 'ACTIVE' || org.status === 'Active') ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                          <button onClick={() => deleteInst(org.id)}
                            className="text-rose-600 hover:text-rose-700 text-sm font-semibold transition">
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── SECTION: Roles & Permissions ────────────────────────────────
function SectionRolesPermissions() {
  const { getUsers } = useAuth();
  const roleDefinitions = [
    { role: 'customer',            label: 'Customer',            color: ROLE_COLORS.customer,            perms: ['View service requirements', 'Track own applications', 'View announcements', 'Submit feedback & contact forms'] },
    { role: 'employee',            label: 'Employee',            color: ROLE_COLORS.employee,            perms: ['Process assigned queue items', 'Search applications', 'View service requirements', 'View announcements'] },
    { role: 'technician',          label: 'Technician',          color: ROLE_COLORS.technician,          perms: ['View assigned technical tasks', 'Update task status', 'Submit maintenance reports', 'View announcements'] },
    { role: 'institution_manager', label: 'Institution Manager', color: ROLE_COLORS.institution_manager, perms: ['Monitor institution queue', 'Monitor applications', 'Assign tasks to Technicians', 'View maintenance', 'View institution reports', 'View announcements'] },
    { role: 'mesob_manager',       label: 'MESOB Manager',       color: ROLE_COLORS.mesob_manager,       perms: ['Monitor all institutions', 'Monitor MESOB-wide queue', 'Monitor applications', 'Monitor maintenance', 'View analytics', 'View reports', 'View announcements'] },
    { role: 'super_admin',         label: 'Super Admin',         color: ROLE_COLORS.super_admin,         perms: ['User Management', 'Institution Management', 'Roles & Permissions', 'System Settings', 'System Reports', 'System Analytics', 'Manage Announcements'] },
  ];

  const users = getUsers().map(stripPassword);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Roles & Permissions</h2>
        <p className="text-sm text-slate-500">Approved role structure for Hawassa MESOB.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {roleDefinitions.map(({ role, label, color, perms }) => (
          <div key={role} className={`rounded-2xl border p-5 ${color}`}>
            <div className="flex items-center justify-between mb-3">
              <strong className="text-sm font-bold text-slate-900">{label}</strong>
              <span className="text-xs font-semibold bg-white/70 px-2 py-0.5 rounded-md border border-slate-200/50">{users.filter(u => u.role === role).length} user{users.filter(u => u.role === role).length !== 1 ? 's' : ''}</span>
            </div>
            <ul className="space-y-1.5">
              {perms.map((p, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5 font-medium">
                  <span className="mt-0.5 text-emerald-600 font-bold">✔</span><span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800">
        <strong className="text-slate-900">Note:</strong> Role permissions are enforced by the system RBAC layer. Changes to role permissions require backend configuration.
      </div>
    </>
  );
}

// ─── SECTION: System Settings ─────────────────────────────────────
function SectionSystemSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowSignup, setAllowSignup]         = useState(true);
  const [systemName, setSystemName]           = useState('Hawassa MESOB Public Service System');
  const [saved, setSaved]                     = useState(false);

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">System Settings</h2>
        <p className="text-sm text-slate-500">System-level configuration for Hawassa MESOB.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <h3 className="font-bold text-slate-900 mb-5">General Settings</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">System Name</label>
              <input type="text" value={systemName} onChange={e => setSystemName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white" />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Maintenance Mode</p>
                <p className="text-xs text-slate-500">When enabled, only Super Admin can access the system.</p>
              </div>
              <button type="button" onClick={() => setMaintenanceMode(m => !m)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${maintenanceMode ? 'bg-amber-500' : 'bg-slate-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Allow New Registrations</p>
                <p className="text-xs text-slate-500">Allow new users to register accounts.</p>
              </div>
              <button type="button" onClick={() => setAllowSignup(v => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${allowSignup ? 'bg-[#314ea1]' : 'bg-slate-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${allowSignup ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white font-semibold rounded-xl transition shadow-xs text-sm">
            Save Settings
          </button>
          {saved && <span className="text-sm text-emerald-700 font-semibold">✓ Settings saved</span>}
        </div>
      </form>

      <div className="mt-6 p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800">
        <strong className="text-slate-900">Security:</strong> Database credentials, API keys, and Telegram Bot tokens are never stored or displayed in the frontend.
      </div>
    </>
  );
}

// ─── Maintenance Report Tab Component ─────────────────────────────────────
function MaintenanceReportTab() {
  const { reports } = useMaintenance();
  const { institutions } = useServices();

  // Calculate maintenance statistics
  const stats = {
    total: reports.length,
    reported: reports.filter(r => r.status === 'REPORTED' || r.status === 'Submitted').length,
    assigned: reports.filter(r => r.status === 'ASSIGNED' || r.status === 'Assigned').length,
    inProgress: reports.filter(r => r.status === 'IN_PROGRESS' || r.status === 'In Progress').length,
    resolved: reports.filter(r => r.status === 'RESOLVED' || r.status === 'Completed').length,
  };

  // Group by institution
  const byInstitution = {};
  reports.forEach(r => {
    const instId = r.institutionId || r.institution_id;
    if (!byInstitution[instId]) {
      byInstitution[instId] = { reported: 0, assigned: 0, inProgress: 0, resolved: 0 };
    }
    const status = r.status.toLowerCase();
    if (status === 'reported' || status === 'submitted') byInstitution[instId].reported++;
    else if (status === 'assigned') byInstitution[instId].assigned++;
    else if (status === 'in_progress' || status === 'in progress') byInstitution[instId].inProgress++;
    else if (status === 'resolved' || status === 'completed') byInstitution[instId].resolved++;
  });

  // Group by priority
  const byPriority = {
    LOW: reports.filter(r => (r.priority || '').toUpperCase() === 'LOW').length,
    NORMAL: reports.filter(r => (r.priority || '').toUpperCase() === 'NORMAL').length,
    HIGH: reports.filter(r => (r.priority || '').toUpperCase() === 'HIGH').length,
    CRITICAL: reports.filter(r => (r.priority || '').toUpperCase() === 'CRITICAL').length,
  };

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Reports</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reported</p>
          <p className="text-2xl font-bold text-slate-600">{stats.reported}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Assigned</p>
          <p className="text-2xl font-bold text-[#1e3a8a]">{stats.assigned}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">In Progress</p>
          <p className="text-2xl font-bold text-amber-700">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Resolved</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.resolved}</p>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 border-l-4 border-slate-400">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Low Priority</p>
          <p className="text-xl font-bold text-slate-900">{byPriority.LOW}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 border-l-4 border-blue-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Normal Priority</p>
          <p className="text-xl font-bold text-slate-900">{byPriority.NORMAL}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 border-l-4 border-amber-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">High Priority</p>
          <p className="text-xl font-bold text-slate-900">{byPriority.HIGH}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 border-l-4 border-rose-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Critical Priority</p>
          <p className="text-xl font-bold text-slate-900">{byPriority.CRITICAL}</p>
        </div>
      </div>

      {/* Maintenance by Institution */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Maintenance by Institution</h3>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Reported</th>
                <th>Assigned</th>
                <th>In Progress</th>
                <th>Resolved</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(byInstitution).length > 0 ? (
                Object.entries(byInstitution).map(([instId, counts]) => {
                  const inst = institutions.find(i => i.id === instId);
                  const total = counts.reported + counts.assigned + counts.inProgress + counts.resolved;
                  return (
                    <tr key={instId}>
                      <td className="font-semibold text-slate-900">{inst?.name_en || 'Unknown Institution'}</td>
                      <td><span className="badge bg-slate-100 text-slate-700 border border-slate-200 font-semibold">{counts.reported}</span></td>
                      <td><span className="badge bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold">{counts.assigned}</span></td>
                      <td><span className="badge bg-amber-50 text-amber-800 border border-amber-200 font-semibold">{counts.inProgress}</span></td>
                      <td><span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">{counts.resolved}</span></td>
                      <td className="font-bold text-slate-900">{total}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-gray-400 py-8">
                    No maintenance data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Maintenance Reports */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Maintenance Reports</h3>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report Number</th>
                <th>Title</th>
                <th>Institution</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Reported</th>
              </tr>
            </thead>
            <tbody>
              {reports.slice(0, 10).map(r => {
                const inst = institutions.find(i => i.id === (r.institutionId || r.institution_id));
                return (
                  <tr key={r.id}>
                    <td className="font-medium">{r.reportNumber || 'N/A'}</td>
                    <td>{r.title || r.problem_description || r.problemDescription || r.description || 'Maintenance Issue'}</td>
                    <td>{inst?.name_en || 'Unknown'}</td>
                    <td>
                      <span className={`badge ${
                        (r.priority || '').toUpperCase() === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        (r.priority || '').toUpperCase() === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        (r.priority || '').toUpperCase() === 'NORMAL' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {r.priority || 'NORMAL'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        r.status === 'REPORTED' || r.status === 'Submitted' ? 'bg-gray-100 text-gray-800' :
                        r.status === 'ASSIGNED' || r.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                        r.status === 'IN_PROGRESS' || r.status === 'In Progress' ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td>{r.reportedAtTimestamp ? new Date(r.reportedAtTimestamp).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── Queue Report Tab Component ─────────────────────────────────────
function QueueReportTab() {
  const { myTickets } = useQueue();
  const { institutions } = useServices();

  // Calculate queue statistics
  const stats = {
    total: myTickets.length,
    pending: myTickets.filter(q => q.status === 'PENDING' || q.status === 'pending').length,
    inProgress: myTickets.filter(q => q.status === 'IN_PROGRESS' || q.status === 'called').length,
    completed: myTickets.filter(q => q.status === 'COMPLETED' || q.status === 'completed').length,
    cancelled: myTickets.filter(q => q.status === 'CANCELLED' || q.status === 'cancelled').length,
  };

  // Group by institution
  const byInstitution = {};
  myTickets.forEach(q => {
    const instId = q.institutionId || q.institution_id;
    if (!byInstitution[instId]) {
      byInstitution[instId] = { pending: 0, inProgress: 0, completed: 0, cancelled: 0 };
    }
    const status = q.status.toLowerCase();
    if (status === 'pending') byInstitution[instId].pending++;
    else if (status === 'in_progress' || status === 'called') byInstitution[instId].inProgress++;
    else if (status === 'completed') byInstitution[instId].completed++;
    else if (status === 'cancelled') byInstitution[instId].cancelled++;
  });

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Total Queue</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
        </div>
      </div>

      {/* Queue by Institution */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Queue by Institution</h3>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Pending</th>
                <th>In Progress</th>
                <th>Completed</th>
                <th>Cancelled</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(byInstitution).length > 0 ? (
                Object.entries(byInstitution).map(([instId, counts]) => {
                  const inst = institutions.find(i => i.id === instId);
                  const total = counts.pending + counts.inProgress + counts.completed + counts.cancelled;
                  return (
                    <tr key={instId}>
                      <td className="font-medium">{inst?.name_en || 'Unknown Institution'}</td>
                      <td><span className="badge bg-yellow-100 text-yellow-800">{counts.pending}</span></td>
                      <td><span className="badge bg-blue-100 text-blue-800">{counts.inProgress}</span></td>
                      <td><span className="badge bg-green-100 text-green-800">{counts.completed}</span></td>
                      <td><span className="badge bg-red-100 text-red-800">{counts.cancelled}</span></td>
                      <td className="font-bold">{total}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-gray-400 py-8">
                    No queue data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Queue Entries */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Queue Entries</h3>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Queue Number</th>
                <th>Customer</th>
                <th>Institution</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {myTickets.slice(0, 10).map(q => {
                const inst = institutions.find(i => i.id === (q.institutionId || q.institution_id));
                return (
                  <tr key={q.id}>
                    <td className="font-medium">{q.queueNumber || q.queue_number || 'N/A'}</td>
                    <td>{q.citizenName || 'Customer'}</td>
                    <td>{inst?.name_en || 'Unknown'}</td>
                    <td>
                      <span className={`badge ${
                        q.status === 'PENDING' || q.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        q.status === 'IN_PROGRESS' || q.status === 'called' ? 'bg-blue-100 text-blue-800' :
                        q.status === 'COMPLETED' || q.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td>{q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── SECTION: Reports ─────────────────────────────────────────────
function SectionReports() {
  const { getUsers } = useAuth();
  const { institutions } = useServices();
  const [activeTab, setActiveTab] = useState('users');
  const users = getUsers().map(stripPassword);
  const tabs = [
    { key: 'users',        label: 'User Report'        },
    { key: 'institutions', label: 'Institution Report'  },
    { key: 'queue',        label: 'Queue Report'        },
    { key: 'maintenance',  label: 'Maintenance Report'  },
  ];

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Reports</h2>
        <p className="text-sm text-slate-500">System-wide administrative and operational reports.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === t.key ? 'bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] text-white shadow-xs' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Users</p><p className="text-2xl font-bold text-slate-900">{users.length}</p></div>
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active</p><p className="text-2xl font-bold text-emerald-700">{users.filter(u => u.status === 'Active').length}</p></div>
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Roles in Use</p><p className="text-2xl font-bold text-slate-900">{new Set(users.map(u => u.role)).size}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-900">User Report</h3></div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}><td className="font-semibold text-slate-900">{u.name}</td><td className="text-slate-600">{u.email}</td><td><RoleBadge role={u.role} /></td><td><StatusBadge status={u.status} /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'institutions' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Institutions</p><p className="text-2xl font-bold text-slate-900">{institutions.length}</p></div>
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active</p><p className="text-2xl font-bold text-emerald-700">{institutions.filter(i => i.status === 'active' || i.is_active).length}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-900">Institution Report</h3></div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Institution</th><th>Amharic Name</th><th>Code</th><th>Status</th></tr></thead>
                <tbody>
                  {institutions.map(inst => (
                    <tr key={inst.id}><td className="font-semibold text-slate-900">{inst.name_en || inst.name}</td><td className="text-slate-700">{inst.name_am}</td><td className="text-xs font-mono text-slate-600">{inst.code || 'N/A'}</td><td><span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">Active</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'queue' && <QueueReportTab />}

      {activeTab === 'maintenance' && <MaintenanceReportTab />}

      <div className="mt-4 p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800">
        <strong className="text-slate-900">Reports:</strong> System-wide reporting. Payment, appointment, and grievance reports are not part of the approved system scope.
      </div>
    </>
  );
}

// ─── SECTION: Analytics ───────────────────────────────────────────
function SectionAnalytics() {
  const { getUsers } = useAuth();
  const users = getUsers().map(stripPassword);
  const byRole = Object.entries(ROLE_LABELS).map(([k, v]) => ({
    role: k,
    label: v,
    count: users.filter(u => u.role === k || (k === 'technician' && u.role === 'ict_staff') || (k === 'customer' && u.role === 'citizen')).length
  }));

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Analytics</h2>
        <p className="text-sm text-slate-500">System-wide overview using existing data.</p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Users</p><p className="text-2xl font-bold text-slate-900">{users.length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Institutions</p><p className="text-2xl font-bold text-slate-900">{organizationsData.length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Services</p><p className="text-2xl font-bold text-slate-900">{organizationsData.reduce((s, o) => s + o.services.length, 0)}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Users</p><p className="text-2xl font-bold text-emerald-700">{users.filter(u => u.status === 'Active').length}</p></div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6">
        <h3 className="font-bold text-slate-900 mb-4">Users by Role</h3>
        <div className="space-y-3">
          {byRole.map(({ role, label, count }) => (
            <div key={role} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-40 flex-shrink-0 font-medium">{label}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="h-2.5 rounded-full bg-[#314ea1] transition-all duration-300"
                  style={{ width: users.length ? `${(count / users.length) * 100}%` : '0%' }} />
              </div>
              <span className="text-sm font-semibold text-slate-900 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6">
        <h3 className="font-bold text-slate-900 mb-4">Services per Institution</h3>
        <div className="space-y-3">
          {organizationsData.map(org => (
            <div key={org.id} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-52 flex-shrink-0 truncate font-medium">{org.name_en}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="h-2.5 rounded-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${(org.services.length / 4) * 100}%` }} />
              </div>
              <span className="text-sm font-semibold text-slate-900 w-6 text-right">{org.services.length}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800">
        <strong className="text-slate-900">Analytics:</strong> System-level metrics. Financial, payment, and appointment analytics are not part of the approved system scope.
      </div>
    </>
  );
}

// ─── SECTION: Announcements ───────────────────────────────────────
function SectionAnnouncements() {
  const { user } = useAuth();
  const { announcements, createAnnouncement: createAnnouncementAPI, updateAnnouncement, deleteAnnouncement, loading, error } = useAnnouncements();
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'new' | 'edit'
  const [form, setForm] = useState({ title: '', body: '', scope: 'INTERNAL', targetRoles: [], institutionId: '' });
  const [formError, setFormError] = useState('');

  async function submitAnnouncement(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { 
      setFormError('Title and body are required.'); 
      return; 
    }
    
    // Validate ROLE scope requires target roles
    if (form.scope === 'ROLE' && (!form.targetRoles || form.targetRoles.length === 0)) {
      setFormError('Please select at least one role for ROLE scope.');
      return;
    }
    
    // Validate INSTITUTION scope requires institution
    if (form.scope === 'INSTITUTION' && !form.institutionId) {
      setFormError('Please select an institution for INSTITUTION scope.');
      return;
    }
    
    setFormError('');
    
    const announcementData = {
      title: form.title.trim(),
      content: form.body.trim(),
      scope: form.scope
    };
    
    // Add optional fields based on scope
    if (form.scope === 'ROLE' && form.targetRoles.length > 0) {
      announcementData.targetRoles = form.targetRoles;
    }
    
    if (form.scope === 'INSTITUTION' && form.institutionId) {
      announcementData.institutionId = form.institutionId;
    }
    
    let result;
    if (view === 'edit' && selected) {
      // Update existing announcement
      result = await updateAnnouncement(selected, announcementData);
    } else {
      // Create new announcement
      result = await createAnnouncementAPI(announcementData);
    }

    if (result.success) {
      setForm({ title: '', body: '', scope: 'INTERNAL', targetRoles: [], institutionId: '' });
      setView('list');
      setSelected(null);
      alert(view === 'edit' ? 'Announcement updated successfully!' : 'Announcement published successfully!');
    } else {
      setFormError(result.message || `Failed to ${view === 'edit' ? 'update' : 'create'} announcement.`);
    }
  }

  function handleEdit(ann) {
    setForm({
      title: ann.title,
      body: ann.content,
      scope: ann.scope,
      targetRoles: ann.target_roles || [],
      institutionId: ann.institution_id || ''
    });
    setSelected(ann.id);
    setView('edit');
  }

  async function handleDelete(annId, annTitle) {
    if (!confirm(`Are you sure you want to delete "${annTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    const result = await deleteAnnouncement(annId);
    if (result.success) {
      setSelected(null);
      setView('list');
      alert('Announcement deleted successfully!');
    } else {
      alert(result.message || 'Failed to delete announcement.');
    }
  }

  // Check if current user can edit/delete an announcement
  function canModify(ann) {
    if (!user) return false;
    
    // Normalize role to uppercase for comparison (backend returns lowercase)
    const userRole = user.role?.toUpperCase();
    
    // Super Admin can modify all announcements
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }
    
    // Others can only modify their own announcements
    const isOwner = ann.creator?.id === user?.id || ann.published_by === user?.id;
    return isOwner;
  }

  // Announcement detail view
  if (selected) {
    const ann = announcements.find(a => a.id === selected);
    if (!ann) return null;

    const canEdit = canModify(ann);
    
    return (
      <>
        <div className="mb-6">
          <button onClick={() => setSelected(null)} className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-medium flex items-center gap-1 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Back to Announcements
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900">{ann.title}</h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              {ann.is_active && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">Active</span>}
              {canEdit && (
                <>
                  <button 
                    onClick={() => handleEdit(ann)}
                    className="px-3 py-1.5 text-sm text-[#314ea1] hover:bg-blue-50/80 rounded-xl font-medium transition"
                    title="Edit announcement"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(ann.id, ann.title)}
                    className="px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50/80 rounded-xl font-medium transition"
                    title="Delete announcement"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-4">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} · {ann.creator?.full_name || 'System'}</p>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ann.content}</div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-700">Scope:</strong> {ann.scope} 
              {ann.target_roles && ann.target_roles.length > 0 && <span> ({ann.target_roles.join(', ')})</span>}
            </p>
          </div>
        </div>
      </>
    );
  }

  // New/Edit announcement form
  if (view === 'new' || view === 'edit') {
    return (
      <>
        <div className="mb-6">
          <button onClick={() => { setView('list'); setSelected(null); setFormError(''); }} className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-medium flex items-center gap-1 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Cancel
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 max-w-2xl">
          <h3 className="font-bold text-slate-900 mb-4 text-base">{view === 'edit' ? 'Edit Announcement' : 'Create Announcement'}</h3>
          <form onSubmit={submitAnnouncement} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title <span className="text-rose-500">*</span></label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Announcement title"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Content <span className="text-rose-500">*</span></label>
              <textarea rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Announcement content..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm resize-y bg-white" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Audience <span className="text-rose-500">*</span></label>
              <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value, targetRoles: [], institutionId: '' }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white">
                <option value="PUBLIC">Public - Visible to everyone including customers</option>
                <option value="INTERNAL">Internal - Staff only (employees, managers, admins)</option>
                <option value="SYSTEM">System - Admins and managers only</option>
                <option value="ROLE">Role - Specific role(s)</option>
                <option value="INSTITUTION">Institution - Specific institution</option>
              </select>
            </div>
            
            {form.scope === 'ROLE' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Roles <span className="text-rose-500">*</span></label>
                <div className="space-y-2">
                  {['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'CUSTOMER'].map(role => (
                    <label key={role} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" 
                        checked={form.targetRoles.includes(role)}
                        onChange={e => {
                          if (e.target.checked) {
                            setForm(f => ({ ...f, targetRoles: [...f.targetRoles, role] }));
                          } else {
                            setForm(f => ({ ...f, targetRoles: f.targetRoles.filter(r => r !== role) }));
                          }
                        }}
                        className="rounded border-slate-300 text-[#314ea1] focus:ring-[#314ea1]/20 focus:border-[#314ea1]" />
                      <span className="text-slate-700 font-medium">{role.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {form.scope === 'INSTITUTION' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Institution <span className="text-rose-500">*</span></label>
                <input type="text" value={form.institutionId} onChange={e => setForm(f => ({ ...f, institutionId: e.target.value }))}
                  placeholder="Enter institution ID"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white" />
                <p className="text-xs text-slate-500 mt-1">Enter the UUID of the target institution</p>
              </div>
            )}
            
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800">
              <strong className="text-slate-900">Scope: {form.scope}</strong>
              {form.scope === 'PUBLIC' && <p className="mt-1 text-slate-600">This announcement will be visible to all users including customers.</p>}
              {form.scope === 'INTERNAL' && <p className="mt-1 text-slate-600">This announcement will be visible only to staff (not customers).</p>}
              {form.scope === 'SYSTEM' && <p className="mt-1 text-slate-600">This announcement will be visible only to admins and managers.</p>}
              {form.scope === 'ROLE' && <p className="mt-1 text-slate-600">This announcement will be visible only to the selected role(s).</p>}
              {form.scope === 'INSTITUTION' && <p className="mt-1 text-slate-600">This announcement will be visible only to users in the selected institution.</p>}
            </div>
            
            {formError && <p className="text-sm text-rose-600">{formError}</p>}
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50">
              {loading ? (view === 'edit' ? 'Updating...' : 'Publishing...') : (view === 'edit' ? 'Update Announcement' : 'Publish Announcement')}
            </button>
          </form>
        </div>
      </>
    );
  }

  // Announcement list view
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Announcements</h2>
          <p className="text-sm text-slate-500">System-level announcements and notifications.</p>
        </div>
        <button onClick={() => { setView('new'); setSelected(null); setFormError(''); }}
          className="px-4 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white text-sm font-semibold rounded-xl shadow-xs transition">
          + New Announcement
        </button>
      </div>

      {loading && !announcements.length && (
        <div className="text-center py-8 text-slate-500">Loading announcements...</div>
      )}

      <div className="space-y-3">
        {announcements.map(ann => (
          <div key={ann.id} onClick={() => setSelected(ann.id)}
            className={`bg-white rounded-2xl border shadow-xs p-5 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all duration-200 ${ann.is_active ? 'border-slate-200/90' : 'border-slate-200 bg-slate-50/70'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {ann.is_active && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                  <h3 className="font-semibold text-sm text-slate-900 leading-snug">{ann.title}</h3>
                  {ann.scope === 'PUBLIC' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">Public</span>}
                  {ann.scope === 'INTERNAL' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#1e3a8a] border border-blue-200">Internal</span>}
                  {ann.scope === 'SYSTEM' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">System</span>}
                  {ann.scope === 'ROLE' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">Role</span>}
                  {ann.scope === 'INSTITUTION' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">Institution</span>}
                </div>
                <p className="text-xs text-slate-500">{new Date(ann.published_at || ann.created_at).toLocaleDateString()} · {ann.creator?.full_name || 'System'}</p>
              </div>
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── SECTION: My Profile ──────────────────────────────────────────
function SectionMyProfile({ user }) {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">My Profile</h2>
        <p className="text-sm text-slate-500">Your System Admin account information.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-base">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1e3a8a] border border-blue-200 mt-1">Super Admin</span>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Full Name</span><span className="font-medium text-slate-900">{user?.name}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium text-slate-900">{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Role</span><span className="font-medium text-slate-900">Super Admin</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Access Level</span><span className="font-medium text-slate-900">System-wide</span></div>
        </div>
      </div>
      <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-700">
        <strong className="text-slate-900">Security:</strong> Passwords and authentication secrets are never displayed. To change your password, use the authentication system.
      </div>
    </>
  );
}

// ─── Main SuperAdminDashboard ─────────────────────────────────────
export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const { t } = useApp();
  const [activeSection, setActiveSection] = useState(t.dashboard);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function navigate(section) {
    setActiveSection(section);
    setSidebarOpen(false);
  }

  function renderSection() {
    switch (activeSection) {
      case t.dashboard:                                return <SectionDashboard setActiveSection={navigate} />;
      case t.user_management:                          return <SectionUserManagement />;
      case t.institution_management:                   return <SectionInstitutionManagement />;
      case t.central_approvals || 'Central Approvals': return <ApprovalsManagement isManagerView={false} />;
      case 'Central Approvals':                        return <ApprovalsManagement isManagerView={false} />;
      case 'Approvals':                                return <ApprovalsManagement isManagerView={false} />;
      case t.roles_permissions:                        return <SectionRolesPermissions />;
      case t.system_settings:       return <SectionSystemSettings />;
      case t.reports:               return <SectionReports />;
      case t.analytics:             return <SectionAnalytics />;
      case t.announcements:         return <SectionAnnouncements />;
      case t.my_profile:            return <SectionMyProfile user={user} />;
      default:                      return <SectionDashboard setActiveSection={navigate} />;
    }
  }

  return (
    <div className="bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#edf4fc] min-h-screen text-slate-900">
      <div className="flex min-h-screen">

        {/* ── Sidebar ── */}
        <aside className={`db-sidebar fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-md border-r border-slate-200/90 flex flex-col transition-transform duration-200${sidebarOpen ? ' open' : ''}`}>
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] flex items-center justify-center font-bold text-lg shadow-sm">S</div>
              <div>
                <p className="font-bold text-slate-900 text-sm">MESOB Center</p>
                <p className="text-xs text-slate-500 font-medium">Super Admin</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {getSections(t).map((section, idx) => (
              <button key={idx} onClick={() => navigate(section)}
                className={`sidebar-link w-full text-left${activeSection === section ? ' active' : ''}`}>
                {section}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button onClick={logout}
              className="sidebar-link w-full text-left text-rose-600 hover:bg-rose-50/80 font-medium">
              {t.logout}
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/90 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              </button>
              <h1 className="text-lg font-bold text-slate-900">
                {activeSection === t.dashboard ? t.system_admin_dashboard : activeSection}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <NotificationBell onNavigate={(section) => navigate(section)} />
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1e3a8a] border border-blue-200">Super Admin</span>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8">
            {renderSection()}
          </main>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
