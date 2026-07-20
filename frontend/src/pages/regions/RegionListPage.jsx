import { useState, useEffect } from 'react';
import { regionAPI, organizationAPI } from '../../api';
import { Plus, Search, MapPin, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function RegionListPage() {
  const { isSuperAdmin } = useAuth();
  const [regions, setRegions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', organizationId: '', description: '' });

  const fetchRegions = async () => {
    setLoading(true);
    try {
      const res = await regionAPI.list({ limit: 100 });
      setRegions(res.data);
    } catch (err) {
      toast.error('Failed to fetch regions');
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

  useEffect(() => {
    fetchRegions();
    if (isSuperAdmin) {
      fetchOrganizations();
    }
  }, [isSuperAdmin]);

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') payload[k] = null;
    });

    try {
      if (editItem) {
        await regionAPI.update(editItem.id, payload);
        toast.success('Region updated successfully');
      } else {
        await regionAPI.create(payload);
        toast.success('Region created successfully');
      }
      setShowModal(false);
      setEditItem(null);
      fetchRegions();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save region');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this region?')) return;
    try {
      await regionAPI.delete(id);
      toast.success('Region deleted successfully');
      fetchRegions();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete region');
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Regions</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage geographical regions</p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => {
                setEditItem(null);
                setForm({ name: '', code: '', organizationId: '', description: '' });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:scale-105 shadow-button hover:bg-brand-dark transition-all cursor-pointer"
              style={{ background: 'var(--color-primary)' }}
            >
              <Plus size={18} /> Add Region
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.map((region) => (
              <div
                key={region.id}
                className="rounded-2xl p-5 transition-all hover:shadow-lg border bg-surface-card"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand/10 shrink-0">
                      <MapPin size={20} className="text-brand" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base leading-snug" style={{ color: 'var(--text-primary)' }}>{region.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-surface-dim border border-edge rounded text-t-muted">{region.code}</span>
                        {region.organization && (
                          <span className="text-xs font-semibold text-brand">{region.organization.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => {
                          setEditItem(region);
                          setForm({
                            name: region.name,
                            code: region.code,
                            organizationId: region.organizationId || '',
                            description: region.description || '',
                          });
                          setShowModal(true);
                        }}
                        className="p-1.5 rounded-lg text-sky hover:bg-sky/10 transition-all cursor-pointer"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(region.id)}
                        className="p-1.5 rounded-lg text-rose hover:bg-rose/10 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {region.description && (
                  <p className="text-xs text-t-muted mt-3 line-clamp-2">{region.description}</p>
                )}
                {region.routes?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-edge space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-t-secondary">Routes Under Region</div>
                    <div className="flex flex-wrap gap-1.5">
                      {region.routes.map(route => (
                        <span key={route.id} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-dim text-t-primary border border-edge">
                          {route.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {regions.length === 0 && (
              <div className="col-span-full text-center py-16 text-t-muted italic border border-edge rounded-2xl bg-surface-card/50">
                No regions configured yet.
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-card border border-edge rounded-2xl p-6 w-full max-w-md animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6 text-t-primary">{editItem ? 'Edit Region' : 'Create Region'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                  required
                />
              </div>

              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Assign Organization</label>
                  <select
                    value={form.organizationId}
                    onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select Organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all min-h-[80px]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-surface-dim text-t-primary border border-edge hover:border-t-muted transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-brand text-white shadow-button hover:bg-brand-dark hover:scale-[1.02] transition-all cursor-pointer"
                >
                  {editItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
