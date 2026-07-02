import { useState, useEffect } from 'react';
import { subRegionAPI, regionAPI } from '../../api';
import { Plus, Layers, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function SubRegionListPage() {
  const { isAdmin } = useAuth();
  const [subRegions, setSubRegions] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', regionId: '', description: '' });

  const fetch = async () => {
    setLoading(true);
    try { const res = await subRegionAPI.list({ limit: 100 }); setSubRegions(res.data); }
    catch (err) { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const fetchRegions = async () => {
    try {
      const res = await regionAPI.list({ limit: 100 });
      setRegions(res.data);
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
      if (payload[k] === '') delete payload[k];
    });
    try {
      if (editItem) { await subRegionAPI.update(editItem.id, payload); toast.success('Updated'); }
      else { await subRegionAPI.create(payload); toast.success('Created'); }
      setShowModal(false); setEditItem(null); fetch();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Sub Regions</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage sub-regions within regions</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditItem(null); setForm({ name: '', code: '', regionId: '', description: '' }); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:scale-105 transition-all"
            style={{ background: 'var(--color-primary)' }}>
            <Plus size={18} /> Add Sub Region
          </button>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              <th className="text-left px-6 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Name</th>
              <th className="text-left px-6 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Code</th>
              <th className="text-left px-6 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Region</th>
              <th className="text-left px-6 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Routes</th>
              {isAdmin && <th className="text-left px-6 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {subRegions.map((sr) => (
              <tr key={sr.id} style={{ borderTop: '1px solid var(--border-color)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td className="px-6 py-4 font-medium" style={{ color: 'var(--text-primary)' }}>{sr.name}</td>
                <td className="px-6 py-4" style={{ color: 'var(--text-muted)' }}>{sr.code}</td>
                <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{sr.region?.name || '-'}</td>
                <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{sr.routes?.length || 0}</td>
                {isAdmin && (
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditItem(sr); setForm({ name: sr.name, code: sr.code, regionId: sr.region?.id || '', description: sr.description || '' }); setShowModal(true); }}
                        className="p-2 rounded-lg hover:bg-blue-500/10" style={{ color: 'var(--color-info)' }}><Edit size={16} /></button>
                      <button onClick={async () => { if (confirm('Delete?')) { await subRegionAPI.delete(sr.id); fetch(); }}}
                        className="p-2 rounded-lg hover:bg-red-500/10" style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md animate-fade-in" style={{ background: 'var(--bg-card)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{editItem ? 'Edit' : 'Create'} Sub Region</h3>
            <form onSubmit={handleSave} className="space-y-4">
              {['name', 'code'].map((f) => (
                <div key={f}><label className="block text-sm font-medium mb-1 capitalize" style={{ color: 'var(--text-secondary)' }}>{f}</label>
                  <input type="text" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" required
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} /></div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Region</label>
                <select
                  value={form.regionId}
                  onChange={(e) => setForm({ ...form, regionId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer appearance-none"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  required
                >
                  <option value="">Select Region</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
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
