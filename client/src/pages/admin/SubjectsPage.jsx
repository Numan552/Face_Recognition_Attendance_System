// src/pages/admin/SubjectsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import { subjectsAPI, departmentsAPI, teachersAPI } from '../../services/api';
import toast from 'react-hot-toast';

const INIT = { name: '', code: '', department_id: '', semester: '', credits: 3, teacher_id: '', description: '' };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState(INIT);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await subjectsAPI.getAll({ department_id: filterDept }); setSubjects(r.data.data); } catch {}
    setLoading(false);
  }, [filterDept]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => {
    departmentsAPI.getAll().then(r => setDepartments(r.data.data));
    teachersAPI.getAll().then(r => setTeachers(r.data.data));
  }, []);

  const openAdd = () => { setEditData(null); setForm(INIT); setShowModal(true); };
  const openEdit = (s) => {
    setEditData(s);
    setForm({ name: s.name, code: s.code, department_id: s.department_id || '', semester: s.semester || '', credits: s.credits || 3, teacher_id: s.teacher_id || '', description: s.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this subject?')) return;
    try { await subjectsAPI.delete(id); toast.success('Subject deactivated.'); fetch(); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editData) { await subjectsAPI.update(editData.id, form); toast.success('Subject updated.'); }
      else { await subjectsAPI.create(form); toast.success('Subject created.'); }
      setShowModal(false); fetch();
    } catch (err) {
      if (err.response?.status === 409) toast.error('Subject code already exists.');
    } finally { setSaving(false); }
  };

  const inp = k => ({ className: 'input', value: form[k], onChange: e => setForm(f => ({ ...f, [k]: e.target.value })) });

  return (
    <Layout title="Subject Management">
      <div className="space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <select className="input max-w-[200px]" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button onClick={openAdd} className="btn-primary">➕ Add Subject</button>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/70 border-b border-slate-700">
                <tr>{['Subject', 'Code', 'Department', 'Semester', 'Credits', 'Teacher', 'Actions'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr><td colSpan={7} className="py-16 text-center text-slate-500"><div className="spinner mx-auto mb-2" />Loading...</td></tr>
                ) : subjects.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center text-slate-500">No subjects found.</td></tr>
                ) : subjects.map(s => (
                  <tr key={s.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-medium text-slate-200 text-sm">{s.name}</p>
                      {s.description && <p className="text-xs text-slate-500 truncate max-w-xs">{s.description}</p>}
                    </td>
                    <td className="table-cell font-mono text-xs badge badge-blue">{s.code}</td>
                    <td className="table-cell text-xs">{s.department_name || '—'}</td>
                    <td className="table-cell text-xs">{s.semester ? `Sem ${s.semester}` : '—'}</td>
                    <td className="table-cell text-xs">{s.credits}</td>
                    <td className="table-cell text-xs">{s.teacher_name || '—'}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(s)} className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-blue-500/10 rounded transition-colors">✏️</button>
                        <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded transition-colors">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold">{editData ? '✏️ Edit Subject' : '➕ Add Subject'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 text-2xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Subject Name *</label><input {...inp('name')} required placeholder="Artificial Intelligence" /></div>
                <div><label className="label">Subject Code *</label><input {...inp('code')} required placeholder="CSE-601" /></div>
                <div><label className="label">Credits</label><input type="number" {...inp('credits')} min={1} max={6} /></div>
                <div><label className="label">Department</label>
                  <select className="input" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                    <option value="">Select</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Semester</label>
                  <select className="input" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className="label">Assign Teacher</label>
                  <select className="input" value={form.teacher_id} onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}>
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.employee_id})</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className="label">Description</label>
                  <textarea className="input h-20 resize-none" {...inp('description')} placeholder="Brief course description..." />
                </div>
              </div>
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
