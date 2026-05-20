// src/pages/admin/TeachersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import { teachersAPI, departmentsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const INIT = { name: '', email: '', employee_id: '', password: '', phone: '', department_id: '', designation: '' };

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState(INIT);
  const [saving, setSaving] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teachersAPI.getAll({ search });
      setTeachers(res.data.data);
    } catch {}
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);
  useEffect(() => { departmentsAPI.getAll().then(r => setDepartments(r.data.data)); }, []);

  const openAdd = () => { setEditData(null); setForm(INIT); setShowModal(true); };
  const openEdit = (t) => {
    setEditData(t);
    setForm({ name: t.name, email: t.email, employee_id: t.employee_id, password: '', phone: t.phone || '', department_id: t.department_id || '', designation: t.designation || '' });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try { await teachersAPI.delete(id); toast.success('Teacher deactivated.'); fetchTeachers(); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v || k !== 'password') fd.append(k, v); });
    try {
      if (editData) { await teachersAPI.update(editData.id, fd); toast.success('Teacher updated.'); }
      else { await teachersAPI.create(fd); toast.success('Teacher added.'); }
      setShowModal(false); fetchTeachers();
    } catch (err) {
      if (err.response?.status === 409) toast.error('Email or Employee ID already exists.');
    } finally { setSaving(false); }
  };

  const inp = (key) => ({ className: 'input', value: form[key], onChange: e => setForm(f => ({ ...f, [key]: e.target.value })) });

  return (
    <Layout title="Teacher Management">
      <div className="space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <input className="input max-w-xs" placeholder="🔍 Search teachers..." value={search} onChange={e => setSearch(e.target.value)} />
          <button onClick={openAdd} className="btn-primary">➕ Add Teacher</button>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/70 border-b border-slate-700">
                <tr>{['Teacher', 'Employee ID', 'Department', 'Designation', 'Status', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr><td colSpan={7} className="py-16 text-center text-slate-500"><div className="spinner mx-auto mb-2" />Loading...</td></tr>
                ) : teachers.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center text-slate-500">No teachers found.</td></tr>
                ) : teachers.map(t => (
                  <tr key={t.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-600/30 flex items-center justify-center text-sm font-bold text-purple-400">{t.name[0]}</div>
                        <div>
                          <p className="font-medium text-slate-200 text-sm">{t.name}</p>
                          <p className="text-xs text-slate-500">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs">{t.employee_id}</td>
                    <td className="table-cell text-xs">{t.department || '—'}</td>
                    <td className="table-cell text-xs">{t.designation || '—'}</td>
                    <td className="table-cell"><span className={`badge ${t.is_active ? 'badge-green' : 'badge-red'}`}>{t.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="table-cell text-xs text-slate-500">{t.last_login ? new Date(t.last_login).toLocaleDateString() : 'Never'}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(t)} className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-blue-500/10 rounded transition-colors">✏️</button>
                        <button onClick={() => handleDelete(t.id, t.name)} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded transition-colors">🗑️</button>
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
              <h2 className="text-lg font-semibold">{editData ? '✏️ Edit Teacher' : '➕ Add Teacher'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 text-2xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Full Name *</label><input {...inp('name')} required placeholder="Dr. Rahman Uddin" /></div>
                <div><label className="label">Email *</label><input type="email" {...inp('email')} required placeholder="teacher@uni.edu" /></div>
                <div><label className="label">Employee ID *</label><input {...inp('employee_id')} required placeholder="EMP001" /></div>
                <div><label className="label">{editData ? 'New Password (leave blank)' : 'Password *'}</label><input type="password" {...inp('password')} required={!editData} placeholder="••••••••" /></div>
                <div><label className="label">Phone</label><input {...inp('phone')} placeholder="01700000000" /></div>
                <div><label className="label">Department</label>
                  <select className="input" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                    <option value="">Select</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Designation</label><input {...inp('designation')} placeholder="Associate Professor" /></div>
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
