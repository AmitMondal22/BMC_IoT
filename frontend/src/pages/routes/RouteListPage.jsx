import { useState, useEffect } from 'react';
import { routeAPI, subRegionAPI } from '../../api';
import { Plus, Route as RouteIcon, Edit, Trash2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function RouteListPage() {
  const { isAdmin } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [subRegions, setSubRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', subRegionId: '', description: '' });

  const fetch = async () => {
    setLoading(true);
    try { const res = await routeAPI.list({ limit: 100 }); setRoutes(res.data); }
    catch (err) { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const fetchSubRegions = async () => {
    try {
      const res = await subRegionAPI.list({ limit: 100 });
      setSubRegions(res.data);
    } catch (err) {
      toast.error('Failed to load sub regions');
    }
  };

  useEffect(() => {
    fetch();
    fetchSubRegions();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.subRegionId) {
      toast.error('Please select a parent sub region');
      return;
    }
    const payload = { ...form };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') delete payload[k];
    });
    try {
      if (editItem) { await routeAPI.update(editItem.id, payload); toast.success('Updated'); }
      else { await routeAPI.create(payload); toast.success('Created'); }
      setShowModal(false); setEditItem(null); fetch();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Routes</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage collection routes</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditItem(null); setForm({ name: '', code: '', subRegionId: '', description: '' }); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:scale-105 transition-all"
            style={{ background: 'var(--color-primary)' }}>
            <Plus size={18} /> Add Route
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((route) => (
          <div key={route.id} className="rounded-2xl p-5 transition-all hover:shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(102,204,255,0.1)' }}>
                  <RouteIcon size={18} style={{ color: 'var(--color-info)' }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{route.name}</h3>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{route.code}</span>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <button onClick={() => { setEditItem(route); setForm({ name: route.name, code: route.code, subRegionId: route.subRegion?.id || '', description: route.description || '' }); setShowModal(true); }}
                    className="p-1.5 rounded-lg hover:bg-blue-500/10" style={{ color: 'var(--color-info)' }}><Edit size={14} /></button>
                  <button onClick={async () => { if (confirm('Delete?')) { await routeAPI.delete(route.id); fetch(); }}}
                    className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            {route.subRegion && (
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <MapPin size={12} /> {route.subRegion.name} → {route.subRegion.region?.name || ''}
              </div>
            )}
            <div className="mt-2 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {route.devices?.length || 0} devices
            </div>
          </div>
        ))}
      </div>
    </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md animate-fade-in" style={{ background: 'var(--bg-card)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{editItem ? 'Edit' : 'Create'} Route</h3>
            <form onSubmit={handleSave} className="space-y-4">
              {['name', 'code'].map((f) => (
                <div key={f}><label className="block text-sm font-medium mb-1 capitalize" style={{ color: 'var(--text-secondary)' }}>{f}</label>
                  <input type="text" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" required
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} /></div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Sub Region</label>
                <select
                  value={form.subRegionId}
                  onChange={(e) => setForm({ ...form, subRegionId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer appearance-none"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  required
                >
                  <option value="">Select Sub Region</option>
                  {subRegions.map((sr) => (
                    <option key={sr.id} value={sr.id}>{sr.name} ({sr.code})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ background: 'var(--color-primary)' }}>{editItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
