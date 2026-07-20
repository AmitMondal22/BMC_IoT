import { useState, useEffect } from 'react';
import { organizationAPI } from '../../api';
import { Plus, Search, Building2, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function OrganizationListPage() {
  const { isSuperAdmin } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    status: 'active',
  });

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await organizationAPI.list({ limit: 100 });
      setOrganizations(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') payload[k] = null;
    });

    try {
      if (editItem) {
        await organizationAPI.update(editItem.id, payload);
        toast.success('Organization updated successfully');
      } else {
        await organizationAPI.create(payload);
        toast.success('Organization created successfully');
      }
      setShowModal(false);
      setEditItem(null);
      fetchOrganizations();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save organization');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this organization? All assigned users, regions, and routes will need to be reallocated.')) return;
    try {
      await organizationAPI.delete(id);
      toast.success('Organization deleted successfully');
      fetchOrganizations();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete organization');
    }
  };

  const filtered = organizations.filter(org => 
    org.name?.toLowerCase().includes(search.toLowerCase()) ||
    org.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Organizations</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage clients and organization groups</p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => {
                setEditItem(null);
                setForm({
                  name: '',
                  code: '',
                  address: '',
                  contactEmail: '',
                  contactPhone: '',
                  status: 'active',
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:scale-105 shadow-button hover:bg-brand-dark transition-all cursor-pointer animate-fade-in"
              style={{ background: 'var(--color-primary)' }}
            >
              <Plus size={18} /> Add Organization
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface border border-edge" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search organizations by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm border-none outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 rounded-2xl skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-surface border border-edge" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <Building2 size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>No organizations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((org) => (
              <div
                key={org.id}
                className="rounded-2xl p-5 border border-edge bg-surface shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-light/10 text-brand flex items-center justify-center shrink-0">
                        <Building2 size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base truncate" style={{ color: 'var(--text-primary)' }}>{org.name}</h3>
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-surface-dim border border-edge text-t-muted mt-0.5" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                          {org.code}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                        org.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}
                    >
                      {org.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs py-3 border-y border-edge/60" style={{ borderColor: 'var(--border-color)' }}>
                    {org.address && (
                      <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <MapPin size={13} className="shrink-0 text-t-muted" />
                        <span className="truncate">{org.address}</span>
                      </div>
                    )}
                    {org.contactEmail && (
                      <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <Mail size={13} className="shrink-0 text-t-muted" />
                        <span className="truncate">{org.contactEmail}</span>
                      </div>
                    )}
                    {org.contactPhone && (
                      <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <Phone size={13} className="shrink-0 text-t-muted" />
                        <span className="truncate">{org.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center justify-end gap-2 mt-4 pt-2">
                    <button
                      onClick={() => {
                        setEditItem(org);
                        setForm({
                          name: org.name || '',
                          code: org.code || '',
                          address: org.address || '',
                          contactEmail: org.contactEmail || '',
                          contactPhone: org.contactPhone || '',
                          status: org.status || 'active',
                        });
                        setShowModal(true);
                      }}
                      className="p-2 rounded-xl text-t-muted hover:text-brand hover:bg-brand-light/10 border border-edge hover:border-brand/20 transition-all cursor-pointer"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(org.id)}
                      className="p-2 rounded-xl text-t-muted hover:text-rose hover:bg-rose-500/10 border border-edge hover:border-rose-500/20 transition-all cursor-pointer"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowModal(false)}>
          <div
            className="bg-surface-card border border-edge rounded-2xl p-6 w-full max-w-md animate-fade-in-scale space-y-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {editItem ? 'Edit Organization' : 'Add Organization'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Mother Dairy"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                  style={{ background: 'var(--color-surface-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Organization Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., MOTHERDAIRY"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                  style={{ background: 'var(--color-surface-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Address</label>
                <input
                  type="text"
                  placeholder="Address lines"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                  style={{ background: 'var(--color-surface-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    placeholder="mail@org.com"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                    style={{ background: 'var(--color-surface-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                    style={{ background: 'var(--color-surface-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                  style={{ background: 'var(--color-surface-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-surface-dim text-t-primary border border-edge hover:border-t-muted transition-all cursor-pointer"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white shadow-button hover:bg-brand-dark hover:scale-[1.02] transition-all cursor-pointer"
                  style={{ background: 'var(--color-primary)' }}
                >
                  Save Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
