import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Star } from 'lucide-react';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import ImageInput from '../../components/common/ImageInput.jsx';
import { serviceApi, categoryApi, subcategoryApi } from '../../api/endpoints.js';
import { currency, duration } from '../../utils/format.js';
import { assetUrl } from '../../api/client.js';

const empty = { name: '', description: '', category_id: '', subcategory_id: '', price: '', duration_minutes: '', image_url: '', image_pos_y: 50, image_zoom: 1, is_featured: false, is_active: true };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([serviceApi.list(), categoryApi.list(), subcategoryApi.list()])
      .then(([s, c, sc]) => {
        setServices(s.data.data);
        setCategories(c.data.data);
        setSubcategories(sc.data.data);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (s) => {
    setEditing(s.id);
    setForm({
      name: s.name, description: s.description || '', category_id: s.category_id || '',
      subcategory_id: s.subcategory_id || '',
      price: s.price, duration_minutes: s.duration_minutes, image_url: s.image_url || '',
      image_pos_y: s.image_pos_y ?? 50, image_zoom: Number(s.image_zoom) || 1,
      is_featured: s.is_featured, is_active: s.is_active,
    });
    setModal(true);
  };

  const formSubs = subcategories.filter((sc) => sc.category_id === Number(form.category_id));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await serviceApi.update(editing, form);
        toast.success('Service updated');
      } else {
        await serviceApi.create(form);
        toast.success('Service created');
      }
      setModal(false);
      load();
    } catch (e) {
      toast.error(e.friendlyMessage || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this service?')) return;
    await serviceApi.remove(id);
    toast.success('Service deleted');
    load();
  };

  const filtered = services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search services…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={openCreate} className="btn-gold"><Plus size={16} /> Add Service</button>
      </div>

      {loading ? <Loader /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-line/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={assetUrl(s.image_url)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <span className="flex items-center gap-1.5 font-medium text-cream">
                        {s.name}
                        {s.is_featured && <Star size={13} className="fill-gold text-gold" />}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{s.category_name || '—'}</td>
                  <td className="px-4 py-3 text-muted">{duration(s.duration_minutes)}</td>
                  <td className="px-4 py-3 font-medium text-gold">{currency(s.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.is_active ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/25' : 'bg-white/10 text-muted border border-line'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-blue-300 hover:bg-blue-500/10"><Pencil size={15} /></button>
                      <button onClick={() => remove(s.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted">No services found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Service' : 'Add Service'} size="lg">
        <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea rows={2} className="input resize-none" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value, subcategory_id: '' }))}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subcategory {formSubs.length === 0 && <span className="text-muted">(none for this category)</span>}</label>
            <select
              className="input"
              value={form.subcategory_id}
              onChange={(e) => setForm((f) => ({ ...f, subcategory_id: e.target.value }))}
              disabled={!form.category_id || formSubs.length === 0}
            >
              <option value="">None</option>
              {formSubs.map((sc) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <ImageInput
              label="Service Image"
              value={form.image_url}
              onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
              posY={form.image_pos_y}
              onPosYChange={(v) => setForm((f) => ({ ...f, image_pos_y: v }))}
              zoom={form.image_zoom}
              onZoomChange={(v) => setForm((f) => ({ ...f, image_zoom: v }))}
            />
          </div>
          <div>
            <label className="label">Price ($)</label>
            <input type="number" min="0" step="1" className="input" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          </div>
          <div>
            <label className="label">Duration (minutes)</label>
            <input type="number" min="5" step="5" className="input" required value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))} />
          </div>
          <div className="flex items-center gap-6 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Active
            </label>
          </div>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button disabled={saving} className="btn-gold">{saving ? 'Saving…' : 'Save Service'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
