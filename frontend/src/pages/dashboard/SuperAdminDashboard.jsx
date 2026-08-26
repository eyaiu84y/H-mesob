import { useState } from 'react';
import { useAuth, ROLE_LABELS, ROLE_BADGE } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { organizationsData } from '../../data/organizations';
import { 
  getAnnouncements, 
  createAnnouncement,
  createAnnouncementNotification,
  getInstitutions,
  createInstitution,
  updateInstitution,
  deleteInstitution 
} from '../../utils/sharedData';

// ─── Navigation sections ──────────────────────────────────────────
const SECTIONS = [
  'Dashboard',
  'User Management',
  'Institution Management',
  'Roles & Permissions',
  'System Settings',
  'Reports',
  'Analytics',
  'Announcements',
  'My Profile',
];

// ─── Role display helpers ─────────────────────────────────────────
const ROLE_COLORS = {
  super_admin:         'bg-purple-50 text-purple-800 border-purple-200',
  mesob_manager:       'bg-red-50 text-red-800 border-red-200',
  institution_manager: 'bg-orange-50 text-orange-800 border-orange-200',
  employee:            'bg-blue-50 text-blue-800 border-blue-200',
  technician:          'bg-cyan-50 text-cyan-800 border-cyan-200',
  citizen:             'bg-green-50 text-green-800 border-green-200',
};

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
  const cls = ROLE_BADGE[role] || 'bg-gray-100 text-gray-700';
  return <span className={`badge ${cls}`}>{ROLE_LABELS[role] || role}</span>;
}

function StatusBadge({ status }) {
  const cls = status === 'Active' ? 'badge bg-green-100 text-green-800' : 'badge bg-gray-100 text-gray-600';
  return <span className={cls}>{status}</span>;
}

// ─── SECTION: Dashboard Overview ─────────────────────────────────
function SectionDashboard({ setActiveSection }) {
  const { getUsers } = useAuth();
  const users = getUsers().map(stripPassword);
  const announcements = getAnnouncements({ scope: 'system' });
  const unread = announcements.filter(a => !a.read).length;

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Total Users</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Institutions</p>
          <p className="text-2xl font-bold">{organizationsData.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Active Users</p>
          <p className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'Active').length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">Announcements</p>
          <p className="text-2xl font-bold">{unread}</p>
          <p className="text-xs text-gray-500 mt-1">Unread</p>
        </div>
      </div>

      {/* User overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">User Overview</h2>
          <button onClick={() => setActiveSection('User Management')} className="text-sm text-blue-600 hover:underline font-medium">View all</button>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {users.slice(0, 5).map(u => (
                <tr key={u.id}>
                  <td className="font-medium">{u.name}</td>
                  <td>{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td><StatusBadge status={u.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Institution overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Institution Overview</h2>
          <button onClick={() => setActiveSection('Institution Management')} className="text-sm text-blue-600 hover:underline font-medium">View all</button>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead><tr><th>Institution</th><th>Services</th><th>Status</th></tr></thead>
            <tbody>
              {organizationsData.slice(0, 5).map(org => (
                <tr key={org.id}>
                  <td className="font-medium">{org.name_en}</td>
                  <td>{org.services.length}</td>
                  <td><span className="badge bg-green-100 text-green-800">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role overview cards */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Role Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <div key={key} className={`p-3 rounded-xl border ${ROLE_COLORS[key] || 'bg-gray-50 text-gray-800 border-gray-200'}`}>
              <strong>{label}</strong>
              <p className="text-xs mt-0.5 opacity-75">
                {users.filter(u => u.role === key).length} user{users.filter(u => u.role === key).length !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-900">
        <strong>System Admin:</strong> Full system access — user management, institution management, roles, settings, reports, and analytics.
      </div>
    </>
  );
}

// ─── SECTION: User Management ─────────────────────────────────────
// ─── SECTION: User Management ─────────────────────────────────────
function SectionUserManagement() {
  const { user: currentUser, getUsers, createUser, updateUser, toggleUserStatus } = useAuth();
  const [rawUsers, setRawUsers] = useState(() => getUsers().map(stripPassword));
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterInstitution, setFilterInstitution] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editError, setEditError] = useState('');

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

  // Get list of institutions from organizations.js
  const institutions = organizationsData.map(org => org.name_en);

  const filtered = rawUsers.filter(u => {
    const q = query.toLowerCase();
    const matchQ = !q || 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(q));
    const matchR = !filterRole || u.role === filterRole;
    const matchI = !filterInstitution || u.institution === filterInstitution;
    const matchS = !filterStatus || u.status === filterStatus;
    return matchQ && matchR && matchI && matchS;
  });

  // Determine which fields are required based on role
  function getRequiredFields(role) {
    const institutionRequired = ['institution_manager', 'employee', 'technician'].includes(role);
    const employeeIdRequired = ['institution_manager', 'employee', 'technician'].includes(role);
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

  function handleAddUser(e) {
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

    // Create user via AuthContext
    const result = createUser(
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
      `Name: ${result.user.name}\n` +
      `Email: ${result.user.email}\n` +
      `Role: ${ROLE_LABELS[result.user.role]}\n` +
      `Temporary Password: ${result.tempPassword}\n\n` +
      `Please share this temporary password with the user securely.`
    );

    // Refresh user list
    setRawUsers(getUsers().map(stripPassword));
    resetNewUserForm();
    setShowAddUser(false);
  }

  function handleEditUser(e) {
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

    const result = updateUser(
      editUser.id,
      {
        name: editUser.name,
        phone: editUser.phone,
        role: editUser.role,
        institution: editUser.institution || null,
        employeeId: editUser.employeeId || null,
        status: editUser.status,
      },
      currentUser.role,
      currentUser.institution
    );

    if (!result.success) {
      setEditError(result.message);
      return;
    }

    // Refresh user list
    setRawUsers(getUsers().map(stripPassword));
    setEditUser(null);
    setEditError('');
  }

  function handleToggleStatus(userId) {
    const result = toggleUserStatus(userId, currentUser.role, currentUser.institution);
    if (result.success) {
      // Refresh user list
      setRawUsers(getUsers().map(stripPassword));
    } else {
      alert(result.message);
    }
  }

  // Add User Modal
  const addUserModal = showAddUser && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Add New User</h3>
          <button onClick={() => { setShowAddUser(false); resetNewUserForm(); }} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleAddUser} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newUserForm.name}
              onChange={e => setNewUserForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Abebe Kebede"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={newUserForm.email}
              onChange={e => setNewUserForm(f => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input
              type="tel"
              value={newUserForm.phone}
              onChange={e => setNewUserForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+251 91 234 5678"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={newUserForm.role}
              onChange={e => setNewUserForm(f => ({ ...f, role: e.target.value, institution: '', employeeId: '' }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm bg-white"
            >
              <option value="">Select Role...</option>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Institution (conditional) */}
          {['institution_manager', 'employee', 'technician'].includes(newUserForm.role) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Institution <span className="text-red-500">*</span>
              </label>
              <select
                value={newUserForm.institution}
                onChange={e => setNewUserForm(f => ({ ...f, institution: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm bg-white"
              >
                <option value="">Select Institution...</option>
                {institutions.map(inst => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>
            </div>
          )}

          {/* Employee/Staff ID (conditional) */}
          {['institution_manager', 'employee', 'technician'].includes(newUserForm.role) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {newUserForm.role === 'technician' ? 'Staff ID' : 'Employee ID'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newUserForm.employeeId}
                onChange={e => setNewUserForm(f => ({ ...f, employeeId: e.target.value }))}
                placeholder={newUserForm.role === 'technician' ? 'TECH-001' : 'EMP-001'}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
              />
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={newUserForm.status}
              onChange={e => setNewUserForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-xs text-purple-900">
              <strong>Note:</strong> A temporary password will be generated for this user. Please share it securely with them after creation.
            </p>
          </div>

          {editError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {editError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition">
              Create User
            </button>
            <button type="button" onClick={() => { setShowAddUser(false); resetNewUserForm(); }}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Edit User Modal
  const editUserModal = editUser && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-8">
        <h3 className="font-semibold text-gray-900 mb-5">Edit User</h3>
        <form onSubmit={handleEditUser} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editUser.name}
              onChange={e => setEditUser(u => ({ ...u, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={editUser.email}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input
              type="tel"
              value={editUser.phone || ''}
              onChange={e => setEditUser(u => ({ ...u, phone: e.target.value }))}
              placeholder="+251 91 234 5678"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={editUser.role}
              onChange={e => setEditUser(u => ({ ...u, role: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm bg-white"
            >
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Institution (conditional) */}
          {['institution_manager', 'employee', 'technician'].includes(editUser.role) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Institution <span className="text-red-500">*</span>
              </label>
              <select
                value={editUser.institution || ''}
                onChange={e => setEditUser(u => ({ ...u, institution: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm bg-white"
              >
                <option value="">Select Institution...</option>
                {institutions.map(inst => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>
            </div>
          )}

          {/* Employee/Staff ID (conditional) */}
          {['institution_manager', 'employee', 'technician'].includes(editUser.role) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {editUser.role === 'technician' ? 'Staff ID' : 'Employee ID'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editUser.employeeId || ''}
                onChange={e => setEditUser(u => ({ ...u, employeeId: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
              />
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={editUser.status}
              onChange={e => setEditUser(u => ({ ...u, status: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {editError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{editError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition">
              Save Changes
            </button>
            <button type="button" onClick={() => { setEditUser(null); setEditError(''); }}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
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
          <h2 className="text-lg font-semibold text-gray-900 mb-1">User Management</h2>
          <p className="text-sm text-gray-500">Manage system users. Passwords are never displayed.</p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition flex items-center gap-2"
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
            className="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm bg-white"
        >
          <option value="">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filterInstitution}
          onChange={e => setFilterInstitution(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm bg-white"
        >
          <option value="">All Institutions</option>
          {institutions.map(inst => (
            <option key={inst} value={inst}>{inst}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm bg-white"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">System Users</h3>
          <span className="text-sm text-gray-500">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
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
                  <td colSpan="7" className="text-center text-gray-400 py-8">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.name}</td>
                    <td>{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>{u.institution || <span className="text-gray-400">—</span>}</td>
                    <td>{u.employeeId || <span className="text-gray-400">—</span>}</td>
                    <td><StatusBadge status={u.status} /></td>
                    <td>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            const fullUser = getUsers().find(user => user.id === u.id);
                            setEditUser({
                              id: fullUser.id,
                              name: fullUser.name,
                              email: fullUser.email,
                              phone: fullUser.phone || '',
                              role: fullUser.role,
                              institution: fullUser.institution || '',
                              employeeId: fullUser.employeeId || '',
                              status: fullUser.status,
                            });
                          }}
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          className={`text-sm font-medium ${u.status === 'Active' ? 'text-amber-600 hover:underline' : 'text-green-600 hover:underline'}`}
                        >
                          {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-900">
        <strong>Security:</strong> Passwords are never displayed or accessible through this interface. Users are created with temporary passwords that should be changed after first login.
      </div>
    </>
  );
}

// ─── SECTION: Institution Management ─────────────────────────────
function SectionInstitutionManagement() {
  // RBAC: Only super_admin may create/modify institutions.
  const { user } = useAuth();
  const canCreate = user?.role === 'super_admin';
  
  // Load institutions from localStorage (custom) + organizationsData (default)
  const customInstitutions = getInstitutions();
  const allInstitutions = [
    ...organizationsData.map(o => ({ ...o, status: 'Active', source: 'default' })),
    ...customInstitutions.map(o => ({ ...o, source: 'custom' }))
  ];
  
  const [institutions, setInstitutions] = useState(allInstitutions);
  const [view, setView] = useState('list'); // 'list' | 'new' | 'edit'
  const [editingInstitution, setEditingInstitution] = useState(null);
  const [form, setForm] = useState({
    name_en: '',
    name_am: '',
    image: '',
    imagePreview: '',
    description: '',
    details: '',
    officialUrl: '',
    services: [],
  });
  const [formError, setFormError] = useState('');

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

  function saveInstitution(e) {
    e.preventDefault();
    
    const error = validateInstitution();
    if (error) {
      setFormError(error);
      return;
    }

    const institutionData = {
      id: editingInstitution ? editingInstitution.id : `custom-${Date.now()}`,
      name_en: form.name_en.trim(),
      name_am: form.name_am.trim() || form.name_en.trim(),
      image: form.image,
      description: form.description.trim(),
      details: form.details.trim(),
      officialUrl: form.officialUrl.trim(),
      services: form.services,
      status: editingInstitution?.status || 'Active',
    };

    let result;
    if (editingInstitution) {
      // Update existing institution
      if (editingInstitution.source === 'default') {
        // For default institutions, update in-memory only (UI-level changes)
        setInstitutions(prev => prev.map(inst => 
          inst.id === editingInstitution.id 
            ? { ...institutionData, source: 'default', status: inst.status }
            : inst
        ));
        result = { success: true };
      } else {
        // For custom institutions, persist to localStorage
        result = updateInstitution(editingInstitution.id, institutionData);
        if (result.success) {
          const customInsts = getInstitutions();
          const allInsts = [
            ...organizationsData.map(o => ({ ...o, status: 'Active', source: 'default' })),
            ...customInsts.map(o => ({ ...o, source: 'custom' }))
          ];
          setInstitutions(allInsts);
        }
      }
    } else {
      // Create new institution
      result = createInstitution(institutionData);
      if (result.success) {
        const customInsts = getInstitutions();
        const allInsts = [
          ...organizationsData.map(o => ({ ...o, status: 'Active', source: 'default' })),
          ...customInsts.map(o => ({ ...o, source: 'custom' }))
        ];
        setInstitutions(allInsts);
      }
    }
    
    if (result.success) {
      // Reset form
      setForm({
        name_en: '',
        name_am: '',
        image: '',
        imagePreview: '',
        description: '',
        details: '',
        officialUrl: '',
        services: [],
      });
      setFormError('');
      setView('list');
      setEditingInstitution(null);
      
      if (editingInstitution?.source === 'default') {
        alert('Institution updated successfully!\n\nNote: Changes to default institutions are session-only and will reset on page reload.');
      } else {
        alert(editingInstitution ? 'Institution updated successfully!' : 'Institution created successfully!');
      }
    } else {
      setFormError(result.message || 'Failed to save institution');
    }
  }

  function toggleStatus(id) {
    const institution = institutions.find(i => i.id === id);
    if (!institution) return;
    
    const newStatus = institution.status === 'Active' ? 'Inactive' : 'Active';
    
    // Update status in memory for both default and custom institutions
    setInstitutions(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    
    // If custom institution, persist to localStorage
    if (institution.source === 'custom') {
      updateInstitution(id, { status: newStatus });
    }
  }

  function editInstitution(institution) {
    setEditingInstitution(institution);
    setForm({
      name_en: institution.name_en,
      name_am: institution.name_am || '',
      image: institution.image,
      imagePreview: institution.image,
      description: institution.description || '',
      details: institution.details || '',
      officialUrl: institution.officialUrl,
      services: [...institution.services],
    });
    setView('new'); // Reuse the same form for editing
  }

  function deleteInst(id) {
    const institution = institutions.find(i => i.id === id);
    if (!institution) return;
    
    if (institution.source === 'default') {
      alert('Cannot delete default institutions');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${institution.name_en}"?`)) {
      return;
    }
    
    const result = deleteInstitution(id);
    if (result.success) {
      setInstitutions(prev => prev.filter(o => o.id !== id));
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
            className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Institutions
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 max-w-4xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            {editingInstitution ? 'Edit Institution' : 'Add New Institution'}
          </h2>
          
          <form onSubmit={saveInstitution} className="space-y-6">
            {/* Institution Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Institution Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Institution Name (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name_en}
                    onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                    placeholder="e.g. Immigration Service"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Institution Name (Amharic)
                  </label>
                  <input
                    type="text"
                    value={form.name_am}
                    onChange={e => setForm(f => ({ ...f, name_am: e.target.value }))}
                    placeholder="e.g. የኢሚግሬሽን አገልግሎት"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Institution Logo <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
                />
                {form.imagePreview && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Logo Preview:</p>
                    <img src={form.imagePreview} alt="Logo preview" className="w-20 h-20 object-contain rounded-lg border border-gray-200 p-2" />
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
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm resize-y"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm resize-y"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
                />
              </div>
            </div>

            {/* Services Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Services</h3>
                <button
                  type="button"
                  onClick={() => { setShowServiceForm(true); setEditingServiceIndex(null); setServiceForm({ title_en: '', title_am: '', description_en: '', description_am: '', time: '', fee: '', officialUrl: '', docs_en: [], docs_am: [] }); }}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition"
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
                <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl space-y-4">
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
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
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
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
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
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm resize-y"
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
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm resize-y"
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
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
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
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
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
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
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
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={docInput.am}
                          onChange={e => setDocInput(d => ({ ...d, am: e.target.value }))}
                          placeholder="Document name (Amharic)"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm"
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

                  <div className="pt-3 border-t border-purple-200">
                    <button
                      type="button"
                      onClick={saveService}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition"
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
            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="px-6 py-3 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold rounded-xl transition text-sm"
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
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Institution Management</h2>
          <p className="text-sm text-gray-500">Manage institutions registered in Hawassa MESOB.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setView('new')}
            className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition"
          >
            + Add Institution
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Registered Institutions</h3>
          <span className="text-sm text-gray-500">{institutions.length} total</span>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead><tr><th>Institution</th><th>Amharic Name</th><th>Services</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {institutions.map(org => (
                <tr key={org.id}>
                  <td className="font-medium">{org.name_en}</td>
                  <td>{org.name_am}</td>
                  <td>{org.services.length}</td>
                  <td><StatusBadge status={org.status} /></td>
                  <td>
                    <div className="flex gap-3">
                      {canCreate && (
                        <>
                          <button onClick={() => editInstitution(org)}
                            className="text-blue-600 hover:underline text-sm font-medium">
                            Edit
                          </button>
                          <button onClick={() => toggleStatus(org.id)}
                            className={`text-sm font-medium ${org.status === 'Active' ? 'text-amber-600 hover:underline' : 'text-green-600 hover:underline'}`}>
                            {org.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                      {org.source === 'custom' && canCreate && (
                        <button onClick={() => deleteInst(org.id)}
                          className="text-red-600 hover:underline text-sm font-medium">
                          Delete
                        </button>
                      )}
                      {org.source === 'default' && (
                        <span className="text-xs text-gray-400 ml-2">(Default)</span>
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
    { role: 'citizen',             label: 'Citizen',             color: ROLE_COLORS.citizen,             perms: ['View service requirements', 'Track own applications', 'View announcements', 'Submit contact forms'] },
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Roles & Permissions</h2>
        <p className="text-sm text-gray-500">Approved role structure for Hawassa MESOB.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {roleDefinitions.map(({ role, label, color, perms }) => (
          <div key={role} className={`rounded-2xl border p-5 ${color}`}>
            <div className="flex items-center justify-between mb-3">
              <strong className="text-sm">{label}</strong>
              <span className="text-xs opacity-70">{users.filter(u => u.role === role).length} user{users.filter(u => u.role === role).length !== 1 ? 's' : ''}</span>
            </div>
            <ul className="space-y-1">
              {perms.map((p, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5">
                  <span className="mt-0.5">✔</span><span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-900">
        <strong>Note:</strong> Role permissions are enforced by the system RBAC layer. Changes to role permissions require backend configuration.
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">System Settings</h2>
        <p className="text-sm text-gray-500">System-level configuration for Hawassa MESOB.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-5">General Settings</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">System Name</label>
              <input type="text" value={systemName} onChange={e => setSystemName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm" />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-xs text-gray-500">When enabled, only Super Admin can access the system.</p>
              </div>
              <button type="button" onClick={() => setMaintenanceMode(m => !m)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${maintenanceMode ? 'bg-amber-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Allow New Registrations</p>
                <p className="text-xs text-gray-500">Allow new users to register accounts.</p>
              </div>
              <button type="button" onClick={() => setAllowSignup(v => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${allowSignup ? 'bg-[#1e3a8a]' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${allowSignup ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" className="px-6 py-3 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold rounded-xl transition text-sm">
            Save Settings
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">✓ Settings saved</span>}
        </div>
      </form>

      <div className="mt-6 p-4 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-900">
        <strong>Security:</strong> Database credentials, API keys, and Telegram Bot tokens are never stored or displayed in the frontend.
      </div>
    </>
  );
}

// ─── SECTION: Reports ─────────────────────────────────────────────
function SectionReports() {
  const { getUsers } = useAuth();
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Reports</h2>
        <p className="text-sm text-gray-500">System-wide administrative and operational reports.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === t.key ? 'bg-[#1e3a8a] text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Total Users</p><p className="text-2xl font-bold">{users.length}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Active</p><p className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'Active').length}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Roles in Use</p><p className="text-2xl font-bold">{new Set(users.map(u => u.role)).size}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">User Report</h3></div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}><td className="font-medium">{u.name}</td><td>{u.email}</td><td><RoleBadge role={u.role} /></td><td><StatusBadge status={u.status} /></td></tr>
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
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Total Institutions</p><p className="text-2xl font-bold">{organizationsData.length}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Total Services</p><p className="text-2xl font-bold">{organizationsData.reduce((s, o) => s + o.services.length, 0)}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Institution Report</h3></div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead><tr><th>Institution</th><th>Amharic Name</th><th>Services</th><th>Status</th></tr></thead>
                <tbody>
                  {organizationsData.map(org => (
                    <tr key={org.id}><td className="font-medium">{org.name_en}</td><td>{org.name_am}</td><td>{org.services.length}</td><td><span className="badge bg-green-100 text-green-800">Active</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'queue' && (
        <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm text-center text-gray-400">
          Queue report data will be available after backend integration. System-wide queue data is currently managed at the operational level.
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm text-center text-gray-400">
          Maintenance report data will be available after backend integration. Maintenance reports are managed by Technicians and Institution Managers.
        </div>
      )}

      <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-900">
        <strong>Reports:</strong> System-wide reporting. Payment, appointment, and grievance reports are not part of the approved system scope.
      </div>
    </>
  );
}

// ─── SECTION: Analytics ───────────────────────────────────────────
function SectionAnalytics() {
  const { getUsers } = useAuth();
  const users = getUsers().map(stripPassword);
  const byRole = Object.entries(ROLE_LABELS).map(([k, v]) => ({ role: k, label: v, count: users.filter(u => u.role === k).length }));

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Analytics</h2>
        <p className="text-sm text-gray-500">System-wide overview using existing data.</p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Total Users</p><p className="text-2xl font-bold">{users.length}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Institutions</p><p className="text-2xl font-bold">{organizationsData.length}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Total Services</p><p className="text-2xl font-bold">{organizationsData.reduce((s, o) => s + o.services.length, 0)}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500 mb-1">Active Users</p><p className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'Active').length}</p></div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Users by Role</h3>
        <div className="space-y-3">
          {byRole.map(({ role, label, count }) => (
            <div key={role} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-40 flex-shrink-0">{label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="h-2.5 rounded-full bg-[#1e3a8a] transition-all duration-300"
                  style={{ width: users.length ? `${(count / users.length) * 100}%` : '0%' }} />
              </div>
              <span className="text-sm font-medium text-gray-900 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Services per Institution</h3>
        <div className="space-y-3">
          {organizationsData.map(org => (
            <div key={org.id} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-52 flex-shrink-0 truncate">{org.name_en}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="h-2.5 rounded-full bg-orange-400 transition-all duration-300"
                  style={{ width: `${(org.services.length / 4) * 100}%` }} />
              </div>
              <span className="text-sm font-medium text-gray-900 w-6 text-right">{org.services.length}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-900">
        <strong>Analytics:</strong> System-level metrics. Financial, payment, and appointment analytics are not part of the approved system scope.
      </div>
    </>
  );
}

// ─── SECTION: Announcements ───────────────────────────────────────
function SectionAnnouncements() {
  const { getUsers } = useAuth();
  const { createNotification } = useNotifications();
  const [announcements, setAnnouncements] = useState(() => getAnnouncements({}));
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [formError, setFormError] = useState('');

  function markRead(id) {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }

  function publishAnnouncement(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { setFormError('Title and body are required.'); return; }
    
    const result = createAnnouncement({
      title: form.title.trim(),
      body: form.body.trim(),
      author: 'System Admin',
      scope: 'system',
      institution: null,
    });

    if (result.success) {
      // Notify ALL users (system-wide announcement)
      const allUsers = getUsers ? getUsers() : [];
      
      allUsers.forEach(user => {
        const notificationData = createAnnouncementNotification(result.announcement, user.email);
        createNotification(notificationData);
      });

      setAnnouncements(prev => [result.announcement, ...prev]);
      setForm({ title: '', body: '' });
      setFormError('');
      setShowNew(false);
      alert(`System announcement published successfully!\n\n${allUsers.length} users have been notified.`);
    } else {
      setFormError(result.message || 'Failed to create announcement.');
    }
  }

  if (selected) {
    const ann = announcements.find(a => a.id === selected);
    return (
      <>
        <div className="mb-6">
          <button onClick={() => setSelected(null)} className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Back to Announcements
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{ann.title}</h2>
            {!ann.read && <span className="badge bg-blue-100 text-blue-800 flex-shrink-0">New</span>}
          </div>
          <p className="text-xs text-gray-500 mb-4">{ann.date} · {ann.author}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{ann.body}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Announcements</h2>
          <p className="text-sm text-gray-500">System-level announcements and notifications.</p>
        </div>
        <button onClick={() => setShowNew(v => !v)}
          className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition">
          {showNew ? 'Cancel' : '+ New Announcement'}
        </button>
      </div>

      {showNew && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 max-w-2xl">
          <h3 className="font-semibold text-gray-900 mb-4">Create System Announcement</h3>
          <form onSubmit={publishAnnouncement} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Announcement title"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Content <span className="text-red-500">*</span></label>
              <textarea rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Announcement content..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-400 outline-none transition text-sm resize-y" />
            </div>
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-900">
              <strong>Scope:</strong> This announcement will be visible system-wide to all users.
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <button type="submit" className="px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition">
              Publish Announcement
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {announcements.map(ann => (
          <div key={ann.id} onClick={() => { setSelected(ann.id); markRead(ann.id); }}
            className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all duration-200 ${ann.read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!ann.read && <span className="inline-block w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />}
                  <h3 className="font-semibold text-sm text-gray-900 leading-snug">{ann.title}</h3>
                </div>
                <p className="text-xs text-gray-500">{ann.date} · {ann.author}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">My Profile</h2>
        <p className="text-sm text-gray-500">Your System Admin account information.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-14 h-14 rounded-2xl bg-purple-700 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="badge bg-purple-100 text-purple-800 mt-1">Super Admin</span>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Full Name</span><span className="font-medium text-gray-900">{user?.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-gray-900">{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium text-gray-900">Super Admin</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Access Level</span><span className="font-medium text-gray-900">System-wide</span></div>
        </div>
      </div>
      <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-900">
        <strong>Security:</strong> Passwords and authentication secrets are never displayed. To change your password, use the authentication system.
      </div>
    </>
  );
}

// ─── Main SuperAdminDashboard ─────────────────────────────────────
export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function navigate(section) {
    setActiveSection(section);
    setSidebarOpen(false);
  }

  function renderSection() {
    switch (activeSection) {
      case 'Dashboard':             return <SectionDashboard setActiveSection={navigate} />;
      case 'User Management':       return <SectionUserManagement />;
      case 'Institution Management':return <SectionInstitutionManagement />;
      case 'Roles & Permissions':   return <SectionRolesPermissions />;
      case 'System Settings':       return <SectionSystemSettings />;
      case 'Reports':               return <SectionReports />;
      case 'Analytics':             return <SectionAnalytics />;
      case 'Announcements':         return <SectionAnnouncements />;
      case 'My Profile':            return <SectionMyProfile user={user} />;
      default:                      return <SectionDashboard setActiveSection={navigate} />;
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex min-h-screen">

        {/* ── Sidebar ── */}
        <aside className={`db-sidebar fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200${sidebarOpen ? ' open' : ''}`}>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-lg">S</div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">MESOB Center</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {SECTIONS.map(section => (
              <button key={section} onClick={() => navigate(section)}
                className={`sidebar-link w-full text-left${activeSection === section ? ' active' : ''}`}>
                {section}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button onClick={() => { localStorage.removeItem('mesob_auth'); window.location.href = '/'; }}
              className="sidebar-link w-full text-left text-red-600 hover:bg-red-50">
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {activeSection === 'Dashboard' ? 'System Admin Dashboard' : activeSection}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge bg-purple-100 text-purple-800">Super Admin</span>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
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
