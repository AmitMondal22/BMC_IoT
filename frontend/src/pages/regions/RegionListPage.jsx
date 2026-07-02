import { useState, useEffect } from 'react';
import { regionAPI, subRegionAPI } from '../../api';
import { Plus, Search, MapPin, Edit, Trash2, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegionListPage() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', organizationId: '', description: '' });

  const fetchRegions = async () => {
    setLoading(true);
    try { const res = await regionAPI.list({ limit: 100 }); setRegions(res.data); }
    catch (err) { toast.error('Failed to fetch regions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRegions(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') delete payload[k];
    });
    try {
      if (editItem) { await regionAPI.update(editItem.id, payload); toast.success('Updated'); }
      else { await regionAPI.create(payload); toast.success('Created'); }
      setShowModal(false); setEditItem(null); fetchRegions();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this region?')) return;
    try { await regionAPI.delete(id); toast.success('Deleted'); fetchRegions(); }
    catch (err) { toast.error('Failed'); }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Regions</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage geographical regions</p>
        </div>
        <button onClick={() => { setEditItem(null); setForm({ name: '', code: '', organizationId: '', description: '' }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:scale-105 transition-all"
          style={{ background: 'var(--color-primary)' }}>
          <Plus size={18} /> Add Region
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regions.map((region) => (
          <div key={region.id} className="rounded-2xl p-5 transition-all hover:shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.1)' }}>
                  <MapPin size={18} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{region.name}</h3>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{region.code}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditItem(region); setForm({ name: region.name, code: region.code, description: region.description || '' }); setShowModal(true); }}
                  className="p-1.5 rounded-lg hover:bg-blue-500/10" style={{ color: 'var(--color-info)' }}><Edit size={14} /></button>
                <button onClick={() => handleDelete(region.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
              </div>
            </div>
            {region.subRegions?.length > 0 && (
              <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-1 mb-1">
                  <Layers size={12} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Sub Regions</span>
                </div>
                {region.subRegions.map((sr) => (
                  <div key={sr.id} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    {sr.name} <span style={{ color: 'var(--text-muted)' }}>({sr.code})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md animate-fade-in" style={{ background: 'var(--bg-card)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{editItem ? 'Edit Region' : 'Create Region'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              {['name', 'code', 'description'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-1 capitalize" style={{ color: 'var(--text-secondary)' }}>{field}</label>
                  <input type="text" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    required={field !== 'description'} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white hover:scale-[1.02] transition-all"
                  style={{ background: 'var(--color-primary)' }}>{editItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
