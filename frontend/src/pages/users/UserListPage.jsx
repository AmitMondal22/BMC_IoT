import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, organizationAPI, regionAPI, routeAPI } from '../../api';
import { Plus, Search, Edit, Trash2, X, ExternalLink, Key, LogOut, History, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function UserListPage() {
  const navigate = useNavigate();
  const { enterPortal, isSuperAdmin } = useAuth();
  
  // Existing states
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [regions, setRegions] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'user', status: 'active', organizationId: '', regionId: '', routeId: '' });

  // New states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyUser, setHistoryUser] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await userAPI.list({ page, search, limit: 20 });
      setUsers(res.data || []);
      setPagination(res.pagination);
    } catch { 
      toast.error('Failed to fetch users'); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchOrganizations = async () => {
    try {
      const res = await organizationAPI.list({ limit: 100 });
      setOrganizations(res.data || []);
    } catch (err) {
      console.error('Failed to load organizations', err);
    }
  };

  const fetchRegionsAndRoutes = async () => {
    try {
      const regionsRes = await regionAPI.list({ limit: 100 });
      setRegions(regionsRes.data || []);
      const routesRes = await routeAPI.list({ limit: 200 });
      setRoutes(routesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch regions or routes', err);
    }
  };

  useEffect(() => { 
    fetchUsers();
    if (isSuperAdmin) {
      fetchOrganizations();
    }
    fetchRegionsAndRoutes();
  }, [search, isSuperAdmin]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.organizationId === '') {
        payload.organizationId = null;
      }
      if (payload.regionId === '') {
        payload.regionId = null;
      }
      if (payload.routeId === '') {
        payload.routeId = null;
      }
      if (editUser) {
        await userAPI.update(editUser.id, payload);
        toast.success('User updated');
      } else {
        await userAPI.create(payload);
        toast.success('User created');
      }
      setShowModal(false); 
      setEditUser(null);
      setForm({ name: '', email: '', password: '', phone: '', role: 'user', status: 'active', organizationId: '', regionId: '', routeId: '' });
      fetchUsers();
    } catch (err) { 
      toast.error(err?.response?.data?.message || 'Failed to save user'); 
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({ 
      name: user.name, 
      email: user.email, 
      phone: user.phone || '', 
      role: user.role, 
      status: user.status, 
      organizationId: user.organizationId || '',
      regionId: user.regionId || '',
      routeId: user.routeId || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { 
      await userAPI.delete(id); 
      toast.success('User deleted'); 
      fetchUsers(); 
    } catch { 
      toast.error('Failed to delete'); 
    }
  };

  // Force Logout
  const handleForceLogout = async (user) => {
    if (!confirm(`Are you sure you want to force logout and terminate active sessions for ${user.name}?`)) return;
    try {
      await userAPI.forceLogout(user.id);
      toast.success(`Forced logout for ${user.name}. Active sessions invalidated.`);
    } catch (err) {
      toast.error('Failed to force logout user');
    }
  };

  // Reset Password
  const handlePromptResetPassword = (user) => {
    setResetUser(user);
    setNewPassword('');
    setShowResetModal(true);
  };

  const handleSaveResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setResettingPassword(true);
    try {
      await userAPI.resetPassword(resetUser.id, { password: newPassword });
      toast.success(`Password reset successfully for ${resetUser.name}`);
      setShowResetModal(false);
      setResetUser(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  // Login History
  const handleShowLoginHistory = async (user) => {
    setHistoryUser(user);
    setLoginHistory([]);
    setLoadingHistory(true);
    setShowHistoryModal(true);
    try {
      const res = await userAPI.getLoginHistory(user.id);
      setLoginHistory(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch login history');
      setShowHistoryModal(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (users.length === 0) {
      toast.error('No users to export');
      return;
    }
    let csv = 'Name,Email,Phone,Role,Status,Last Login\n';
    users.forEach((u) => {
      const name = u.name.replace(/"/g, '""');
      const email = u.email.replace(/"/g, '""');
      const phone = (u.phone || '').replace(/"/g, '""');
      const role = u.role;
      const status = u.status;
      const lastLogin = u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never';
      csv += `"${name}","${email}","${phone}","${role}","${status}","${lastLogin}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BMC_Users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Users list exported successfully');
  };

  const roleColors = {
    super_admin: 'bg-rose/15 text-rose border border-rose/20',
    admin: 'bg-brand/15 text-brand border border-brand/20',
    user: 'bg-sky/15 text-sky border border-sky/20',
  };

  const logActionColors = {
    LOGIN: 'bg-emerald/15 text-emerald font-bold border border-emerald/20',
    FAILED_LOGIN: 'bg-rose/15 text-rose border border-rose/20',
    ACCOUNT_LOCKOUT: 'bg-rose/25 text-rose font-bold border border-rose/30',
    LOGOUT: 'bg-surface-dim text-t-muted border border-edge',
    FORCE_LOGOUT: 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-t-primary">Users</h1>
            <p className="text-sm text-t-secondary">Manage platform users, lock status, and role assignments</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-edge bg-surface-card text-t-primary text-sm font-medium hover:bg-surface-dim transition-all cursor-pointer"
            >
              <Download size={16} /> Export CSV
            </button>
            <button
              onClick={() => { setEditUser(null); setForm({ name: '', email: '', password: '', phone: '', role: 'user', status: 'active' }); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold shadow-button hover:bg-brand-dark hover:scale-105 transition-all cursor-pointer"
            >
              <Plus size={18} /> Add User
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-t-muted" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-surface-card border border-edge text-t-primary placeholder:text-t-muted outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
          />
        </div>

        {/* Table */}
        <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-surface-dim font-semibold text-t-secondary border-b border-edge">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-edge hover:bg-surface-dim/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-semibold shrink-0">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-t-primary block leading-none">{user.name}</span>
                          <div className="flex flex-col gap-0.5 mt-1">
                            {user.organization && (
                              <span className="text-[10px] text-brand font-bold leading-none">{user.organization.name}</span>
                            )}
                            {(user.region || user.route) && (
                              <span className="text-[10px] text-t-muted leading-none">
                                {user.region?.name || ''} {user.route ? `→ ${user.route.name}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-t-secondary">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${roleColors[user.role] || 'bg-surface-dim text-t-muted'}`}>
                        {user.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        user.status === 'active' 
                          ? 'bg-emerald/15 text-emerald border border-emerald/20' 
                          : user.status === 'suspended' 
                            ? 'bg-rose/25 text-rose border border-rose/30 font-bold animate-pulse' 
                            : 'bg-rose/15 text-rose border border-rose/20'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {user.role === 'user' && (
                          <button
                            onClick={() => { enterPortal(user); navigate('/dashboard'); }}
                            className="p-2 rounded-lg text-emerald hover:bg-emerald/10 transition-colors cursor-pointer"
                            title="Enter User Portal"
                          >
                            <ExternalLink size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleShowLoginHistory(user)}
                          className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                          title="View Login History"
                        >
                          <History size={15} />
                        </button>
                        <button
                          onClick={() => handlePromptResetPassword(user)}
                          className="p-2 rounded-lg text-amber hover:bg-amber/10 transition-colors cursor-pointer"
                          title="Reset Password"
                        >
                          <Key size={15} />
                        </button>
                        <button
                          onClick={() => handleForceLogout(user)}
                          className="p-2 rounded-lg text-purple-500 hover:bg-purple-500/10 transition-colors cursor-pointer"
                          title="Force Logout Session"
                        >
                          <LogOut size={15} />
                        </button>
                        <button onClick={() => handleEdit(user)} className="p-2 rounded-lg text-sky hover:bg-sky/10 transition-colors cursor-pointer" title="Edit Profile"><Edit size={15} /></button>
                        <button onClick={() => handleDelete(user.id)} className="p-2 rounded-lg text-rose hover:bg-rose/10 transition-colors cursor-pointer" title="Delete Account"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr><td colSpan={5} className="text-center py-12 text-t-muted">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-edge flex items-center justify-between bg-surface-dim/30">
              <span className="text-xs text-t-muted">
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total users)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchUsers(pagination.page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-edge bg-surface-card hover:bg-surface-dim disabled:opacity-40 text-xs font-semibold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchUsers(pagination.page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-edge bg-surface-card hover:bg-surface-dim disabled:opacity-40 text-xs font-semibold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-card border border-edge rounded-2xl p-6 w-full max-w-md animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-t-primary">{editUser ? 'Edit User' : 'Create User'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-t-muted hover:text-t-primary hover:bg-surface-dim transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {['name', 'email', 'phone'].map((field) => (
                <div key={field}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5 capitalize">
                    {field === 'phone' ? 'Phone Number (For Mobile OTP Login, e.g. +919999999999)' : field}
                  </label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    required={field !== 'phone' || form.role === 'user'}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                </div>
              ))}
              {!editUser && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Password</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all appearance-none cursor-pointer">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all appearance-none cursor-pointer">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              {isSuperAdmin && (form.role === 'admin' || form.role === 'user') && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Organization</label>
                  <select value={form.organizationId || ''} onChange={(e) => setForm({ ...form, organizationId: e.target.value || '' })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all appearance-none cursor-pointer"
                    required>
                    <option value="">Select Organization</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.role === 'user' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Region</label>
                    <select
                      value={form.regionId || ''}
                      onChange={(e) => setForm({ ...form, regionId: e.target.value || '', routeId: '' })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">No Region</option>
                      {regions.map((reg) => (
                        <option key={reg.id} value={reg.id}>{reg.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Route</label>
                    <select
                      value={form.routeId || ''}
                      onChange={(e) => setForm({ ...form, routeId: e.target.value || '' })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all appearance-none cursor-pointer"
                      disabled={!form.regionId}
                    >
                      <option value="">No Route</option>
                      {routes
                        .filter((rt) => !form.regionId || rt.regionId === form.regionId)
                        .map((rt) => (
                          <option key={rt.id} value={rt.id}>{rt.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-surface-dim text-t-primary border border-edge hover:border-t-muted transition-all">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-brand text-white shadow-button hover:bg-brand-dark hover:scale-[1.02] transition-all">
                  {editUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {showResetModal && resetUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowResetModal(false)}>
          <div className="bg-surface-card border border-edge rounded-2xl p-6 w-full max-w-sm animate-fade-in-scale space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-edge">
              <h3 className="text-lg font-bold text-t-primary flex items-center gap-2">
                <Key className="text-amber" size={18} /> Reset Password
              </h3>
              <button onClick={() => setShowResetModal(false)} className="p-1.5 rounded-lg text-t-muted hover:text-t-primary hover:bg-surface-dim transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-t-secondary">
              Configure a new password for user <strong>{resetUser.name}</strong> ({resetUser.email}).
            </p>
            <form onSubmit={handleSaveResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-surface-dim text-t-primary border border-edge hover:border-t-muted transition-all">Cancel</button>
                <button type="submit" disabled={resettingPassword}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-brand text-white shadow-button hover:bg-brand-dark hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                  {resettingPassword ? 'Resetting...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login History Modal */}
      {showHistoryModal && historyUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-surface-card border border-edge rounded-2xl p-6 w-full max-w-xl animate-fade-in-scale space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-edge">
              <div>
                <h3 className="text-lg font-bold text-t-primary flex items-center gap-2">
                  <History className="text-indigo-500" size={18} /> User Login History
                </h3>
                <p className="text-[10px] text-t-muted mt-0.5">{historyUser.name} ({historyUser.email})</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1.5 rounded-lg text-t-muted hover:text-t-primary hover:bg-surface-dim transition-colors">
                <X size={18} />
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw size={24} className="animate-spin text-brand" />
              </div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto border border-edge rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-surface-dim text-t-secondary font-semibold">
                      <th className="px-4 py-2.5">Date & Time</th>
                      <th className="px-4 py-2.5">Security Event</th>
                      <th className="px-4 py-2.5">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.map((log) => (
                      <tr key={log.id} className="border-t border-edge hover:bg-surface-dim/40 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-t-secondary">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${logActionColors[log.action] || 'bg-surface-dim text-t-muted'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-t-secondary">{log.ipAddress || '-'}</td>
                      </tr>
                    ))}
                    {loginHistory.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-t-muted italic">
                          No recent login activity records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-edge">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-surface-dim text-t-primary border border-edge hover:border-t-muted transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
