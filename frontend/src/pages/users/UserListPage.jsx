import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../api';
import { Plus, Search, Edit, Trash2, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function UserListPage() {
  const navigate = useNavigate();
  const { enterPortal } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'user', status: 'active' });

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await userAPI.list({ page, search, limit: 20 });
      setUsers(res.data);
      setPagination(res.pagination);
    } catch { toast.error('Failed to fetch users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await userAPI.update(editUser.id, form);
        toast.success('User updated');
      } else {
        await userAPI.create(form);
        toast.success('User created');
      }
      setShowModal(false); setEditUser(null);
      setForm({ name: '', email: '', password: '', phone: '', role: 'user', status: 'active' });
      fetchUsers();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to save user'); }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, phone: user.phone || '', role: user.role, status: user.status });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await userAPI.delete(id); toast.success('User deleted'); fetchUsers(); }
    catch { toast.error('Failed to delete'); }
  };

  const roleColors = {
    super_admin: 'bg-rose/15 text-rose',
    admin: 'bg-brand/15 text-brand',
    user: 'bg-sky/15 text-sky',
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-t-primary">Users</h1>
          <p className="text-sm text-t-secondary">Manage platform users and permissions</p>
        </div>
        <button
          onClick={() => { setEditUser(null); setForm({ name: '', email: '', password: '', phone: '', role: 'user', status: 'active' }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium shadow-button hover:bg-brand-dark hover:scale-105 transition-all"
        >
          <Plus size={18} /> Add User
        </button>
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
      <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-dim">
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-t-secondary">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-t-secondary">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-t-secondary">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-t-secondary">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-t-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-edge hover:bg-surface-dim/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="font-medium text-t-primary">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-t-secondary">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase ${roleColors[user.role] || 'bg-surface-dim text-t-muted'}`}>
                      {user.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase ${
                      user.status === 'active' ? 'bg-emerald/15 text-emerald' : 'bg-rose/15 text-rose'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {user.role === 'user' && (
                        <button
                          onClick={() => { enterPortal(user); navigate('/dashboard'); }}
                          className="p-2 rounded-lg text-emerald hover:bg-emerald/10 transition-colors"
                          title="Enter User Portal"
                        >
                          <ExternalLink size={15} />
                        </button>
                      )}
                      <button onClick={() => handleEdit(user)} className="p-2 rounded-lg text-sky hover:bg-sky/10 transition-colors"><Edit size={15} /></button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 rounded-lg text-rose hover:bg-rose/10 transition-colors"><Trash2 size={15} /></button>
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
      </div>
    </div>

      {/* Modal */}
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5 capitalize">{field}</label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    required={field !== 'phone'}
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
    </>
  );
}
