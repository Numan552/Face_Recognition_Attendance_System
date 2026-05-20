// src/pages/admin/DepartmentsPage.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { departmentsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const INIT = { name: '', code: '', description: '' };

export default function DepartmentsPage() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState(INIT);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const r = await departmentsAPI.getAll(); setDepts(r.data.data); } catch {}
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEditData(null); setForm(INIT); setShowModal(true); };
  const openEdit = (d) => { setEditData(d); setForm({ name: d.name, code: d.code, description: d.description || '' }); setShowModal(true); };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" department?`)) return;
    try { await departmentsAPI.delete(id); toast.success('Deleted.'); fetch(); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editData) { await departmentsAPI.update(editData.id, form); toast.success('Updated.'); }
      else { await departmentsAPI.create(form); toast.success('Department added.'); }
      setShowModal(false); fetch();
    } catch {} finally { setSaving(false); }
  };

  const inp = k => ({ className: 'input', value: form[k], onChange: e => setForm(f => ({ ...f, [k]: e.target.value })) });

  return (
    <Layout title="Department Management">
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={openAdd} className="btn-primary">➕ Add Department</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-slate-500"><div className="spinner mx-auto mb-2" />Loading...</div>
          ) : depts.map(d => (
            <div key={d.id} className="card hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-400">{d.code}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(d)} className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-blue-500/10 rounded transition-colors">✏️</button>
                  <button onClick={() => handleDelete(d.id, d.name)} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded transition-colors">🗑️</button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-200 text-sm mb-1">{d.name}</h3>
              {d.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{d.description}</p>}
              <div className="flex gap-3 pt-2 border-t border-slate-700">
                <div className="text-center flex-1">
                  <p className="text-lg font-bold text-slate-100">{d.student_count}</p>
                  <p className="text-xs text-slate-500">Students</p>
                </div>
                <div className="text-center flex-1 border-l border-slate-700">
                  <p className="text-lg font-bold text-slate-100">{d.teacher_count}</p>
                  <p className="text-xs text-slate-500">Teachers</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold">{editData ? '✏️ Edit Department' : '➕ Add Department'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 text-2xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="label">Department Name *</label><input {...inp('name')} required placeholder="Computer Science & Engineering" /></div>
              <div><label className="label">Department Code *</label><input {...inp('code')} required placeholder="CSE" /></div>
              <div><label className="label">Description</label><textarea className="input h-24 resize-none" {...inp('description')} placeholder="Brief description..." /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <><span className="spinner w-4 h-4 border-2" />Saving...</> : editData ? '✓ Update' : '➕ Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
