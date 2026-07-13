import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import ImageInput from '../../components/common/ImageInput.jsx';
import { categoryApi, subcategoryApi } from '../../api/endpoints.js';
import { assetUrl } from '../../api/client.js';

const empty = { name: '', description: '', image_url: '', is_active: true };

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [subInput, setSubInput] = useState({}); // { [categoryId]: text }

  const load = () => {
    setLoading(true);
    Promise.all([categoryApi.list(), subcategoryApi.list()])
      .then(([c, s]) => { setItems(c.data.data); setSubs(s.data.data); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const addSub = async (categoryId) => {
    const name = (subInput[categoryId] || '').trim();
    if (!name) return;
    try {
      await subcategoryApi.create({ category_id: categoryId, name });
      setSubInput((s) => ({ ...s, [categoryId]: '' }));
      toast.success('Subcategory added');
      load();
    } catch (e) {
      toast.error(e.friendlyMessage || 'Could not add subcategory');
    }
  };

  const removeSub = async (id) => {
    if (!confirm('Remove this subcategory? Services in it will keep existing but become unassigned.')) return;
    try {
      await subcategoryApi.remove(id);
      toast.success('Subcategory removed');
      load();
    } catch (e) {
      toast.error(e.friendlyMessage || 'Could not remove subcategory');
    }
  };

  const openCreate = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (c) => {
    setEditing(c.id);
    setForm({ name: c.name, description: c.description || '', image_url: c.image_url || '', is_active: c.is_active });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await categoryApi.update(editing, form); toast.success('Category updated'); }
      else { await categoryApi.create(form); toast.success('Category created'); }
      setModal(false); load();
    } catch (e) { toast.error(e.friendlyMessage || 'Save failed'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this category? Services in it will be uncategorized.')) return;
    await categoryApi.remove(id);
    toast.success('Category deleted');
    load();
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn-gold"><Plus size={16} /> Add Category</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <div key={c.id} className="card overflow-hidden">
            <div className="h-28 overflow-hidden">
              <img src={assetUrl(c.image_url) || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80'} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl text-cream">{c.name}</h3>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted">{c.service_count} services</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p>

              {/* Subcategories */}
              <div className="mt-4 border-t border-line pt-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Subcategories</p>
                <div className="flex flex-wrap gap-2">
                  {subs.filter((sc) => sc.category_id === c.id).map((sc) => (
                    <span key={sc.id} className="flex items-center gap-1.5 rounded-full border border-line bg-white/5 py-1 pl-3 pr-1.5 text-xs text-cream/80">
                      {sc.name}
                      <button onClick={() => removeSub(sc.id)} aria-label={`Remove ${sc.name}`} className="rounded-full p-0.5 text-muted hover:bg-rose-500/20 hover:text-rose-300">
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  {subs.filter((sc) => sc.category_id === c.id).length === 0 && (
                    <span className="text-xs text-muted">No subcategories yet.</span>
                  )}
                </div>
                <div className="mt-2.5 flex gap-2">
                  <input
                    className="input py-1.5 text-sm"
                    placeholder="Add subcategory…"
                    value={subInput[c.id] || ''}
                    onChange={(e) => setSubInput((s) => ({ ...s, [c.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSub(c.id); } }}
                  />
                  <button onClick={() => addSub(c.id)} className="btn-gold shrink-0 px-3 py-1.5 text-sm"><Plus size={15} /></button>
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-blue-300 hover:bg-blue-500/10"><Pencil size={15} /></button>
                <button onClick={() => remove(c.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 size={15} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={2} className="input resize-none" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <ImageInput label="Category Image" value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Active
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button disabled={saving} className="btn-gold">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
