import { useState, useEffect } from 'react';
import { routeAPI, regionAPI } from '../../api';
import { Plus, Route as RouteIcon, Edit, Trash2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function RouteListPage() {
  const { isSuperAdmin } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', regionId: '', description: '' });

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await routeAPI.list({ limit: 100 });
      setRoutes(res.data);
    } catch (err) {
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const res = await regionAPI.list({ limit: 100 });
      setRegions(res.data || []);
    } catch (err) {
      toast.error('Failed to load regions');
    }
  };

  useEffect(() => {
    fetch();
    fetchRegions();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.regionId) {
      toast.error('Please select a parent region');
      return;
    }
    const payload = { ...form };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') payload[k] = null;
    });
    try {
      if (editItem) {
        await routeAPI.update(editItem.id, payload);
        toast.success('Route updated successfully');
      } else {
        await routeAPI.create(payload);
        toast.success('Route created successfully');
      }
      setShowModal(false);
      setEditItem(null);
      fetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save route');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this route?')) return;
    try {
      await routeAPI.delete(id);
      toast.success('Route deleted successfully');
      fetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete route');
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Routes</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage collection routes</p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => {
                setEditItem(null);
                setForm({ name: '', code: '', regionId: '', description: '' });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:scale-105 shadow-button hover:bg-brand-dark transition-all cursor-pointer"
              style={{ background: 'var(--color-primary)' }}
            >
              <Plus size={18} /> Add Route
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route) => (
              <div
                key={route.id}
                className="rounded-2xl p-5 transition-all hover:shadow-lg border bg-surface-card"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky/10">
                      <RouteIcon size={18} className="text-sky" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>{route.name}</h3>
                      <span className="text-[10px] uppercase font-bold text-t-muted">{route.code}</span>
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditItem(route);
                          setForm({
                            name: route.name,
                            code: route.code,
                            regionId: route.region?.id || '',
                            description: route.description || '',
                          });
                          setShowModal(true);
                        }}
                        className="p-1.5 rounded-lg text-sky hover:bg-sky/10 transition-colors cursor-pointer"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(route.id)}
                        className="p-1.5 rounded-lg text-rose hover:bg-rose/10 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {route.region && (
                  <div className="flex items-center gap-1 text-xs text-t-muted">
                    <MapPin size={12} /> {route.region.name}
                  </div>
                )}
                <div className="mt-2 text-xs font-semibold text-t-secondary">
                  {route.devices?.length || 0} devices
                </div>
              </div>
            ))}
            {routes.length === 0 && (
              <div className="col-span-full text-center py-16 text-t-muted italic border border-edge rounded-2xl bg-surface-card/50">
                No routes configured yet.
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-card border border-edge rounded-2xl p-6 w-full max-w-md animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6 text-t-primary">{editItem ? 'Edit' : 'Create'} Route</h3>
            <form onSubmit={handleSave} className="space-y-4">
              {['name', 'code'].map((f) => (
                <div key={f}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5 capitalize">{f}</label>
                  <input
                    type="text"
                    value={form[f]}
                    onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                    required
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-t-secondary mb-1.5">Region</label>
                <select
                  value={form.regionId}
                  onChange={(e) => setForm({ ...form, regionId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-input border border-edge text-t-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select Region</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>{region.name} ({region.code})</option>
                  ))}
                </select>
              </div>
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
