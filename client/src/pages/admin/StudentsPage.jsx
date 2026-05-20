// src/pages/admin/StudentsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import { studentsAPI, departmentsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const INITIAL_FORM = {
  name: '', email: '', roll_number: '', department_id: '', semester: 1,
  section: '', phone: '', gender: '', date_of_birth: '', address: '',
  guardian_name: '', guardian_phone: '',
};

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentsAPI.getAll({ search, department_id: filterDept, page, limit: 15 });
      setStudents(res.data.data);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [search, filterDept, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => {
    departmentsAPI.getAll().then(r => setDepartments(r.data.data));
  }, []);

  const openAdd = () => { setEditData(null); setForm(INITIAL_FORM); setShowModal(true); };
  const openEdit = (s) => {
    setEditData(s);
    setForm({
      name: s.name, email: s.email, roll_number: s.roll_number,
      department_id: s.department_id || '', semester: s.semester || 1,
      section: s.section || '', phone: s.phone || '', gender: s.gender || '',
      date_of_birth: s.date_of_birth?.split('T')[0] || '',
      address: s.address || '', guardian_name: s.guardian_name || '',
      guardian_phone: s.guardian_phone || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try {
      await studentsAPI.delete(id);
      toast.success(`${name} deactivated.`);
      fetchStudents();
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    try {
      if (editData) {
        await studentsAPI.update(editData.id, fd);
        toast.success('Student updated.');
      } else {
        await studentsAPI.create(fd);
        toast.success('Student added.');
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      if (err.response?.status === 409) toast.error('Email or roll number already exists.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Student Management">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex gap-3 flex-1 w-full">
            <input
              className="input max-w-xs"
              placeholder="🔍 Search students..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            <select
              className="input max-w-[160px]"
              value={filterDept}
              onChange={e => { setFilterDept(e.target.value); setPage(1); }}
            >
              <option value="">All Depts</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
            </select>
          </div>
          <button onClick={openAdd} className="btn-primary whitespace-nowrap">
            ➕ Add Student
          </button>
        </div>

        {/* Stats badges */}
        <div className="flex gap-2 text-xs">
          <span className="badge badge-blue">{pagination?.total ?? 0} Total</span>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/70 border-b border-slate-700">
                <tr>
                  {['Student', 'Roll No', 'Dept', 'Sem', 'Section', 'Face', 'Status', 'Actions'].map(h => (
                    <th key={h} className="table-header text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr><td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="spinner mx-auto mb-2" /> Loading...
                  </td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center text-slate-500">
                    No students found. Click "Add Student" to get started.
                  </td></tr>
                ) : students.map(s => (
                  <tr key={s.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-sm font-bold text-blue-400 flex-shrink-0">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200 text-sm">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs">{s.roll_number}</td>
                    <td className="table-cell">{s.dept_code || '—'}</td>
                    <td className="table-cell">{s.semester}</td>
                    <td className="table-cell">{s.section || '—'}</td>
                    <td className="table-cell">
                      <span className={`badge ${s.face_registered ? 'badge-green' : 'badge-red'}`}>
                        {s.face_registered ? '✓ Enrolled' : '✗ None'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${s.is_active ? 'badge-green' : 'badge-red'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(s)} className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-blue-500/10 rounded transition-colors" title="Edit">✏️</button>
                        <button onClick={() => handleDelete(s.id, s.name)} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded transition-colors" title="Deactivate">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
              <p className="text-xs text-slate-500">Showing {students.length} of {pagination.total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">← Prev</button>
                <span className="text-xs text-slate-400 flex items-center">{page}/{pagination.pages}</span>
                <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-slate-100">
                {editData ? '✏️ Edit Student' : '➕ Add New Student'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 text-2xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Full Name *</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required placeholder="Ahmed Hossain" />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required placeholder="ahmed@student.edu" />
                </div>
                <div>
                  <label className="label">Roll Number *</label>
                  <input className="input" value={form.roll_number} onChange={e => setForm(f => ({...f, roll_number: e.target.value}))} required placeholder="CSE-2021-001" />
                </div>
                <div>
                  <label className="label">Department</label>
                  <select className="input" value={form.department_id} onChange={e => setForm(f => ({...f, department_id: e.target.value}))}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Semester</label>
                  <select className="input" value={form.semester} onChange={e => setForm(f => ({...f, semester: e.target.value}))}>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Section</label>
                  <input className="input" value={form.section} onChange={e => setForm(f => ({...f, section: e.target.value}))} placeholder="A, B, C..." />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select className="input" value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="01700000000" />
                </div>
                <div>
                  <label className="label">Date of Birth</label>
                  <input type="date" className="input" value={form.date_of_birth} onChange={e => setForm(f => ({...f, date_of_birth: e.target.value}))} />
                </div>
                <div className="col-span-2">
                  <label className="label">Address</label>
                  <input className="input" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="Full address..." />
                </div>
                <div>
                  <label className="label">Guardian Name</label>
                  <input className="input" value={form.guardian_name} onChange={e => setForm(f => ({...f, guardian_name: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Guardian Phone</label>
                  <input className="input" value={form.guardian_phone} onChange={e => setForm(f => ({...f, guardian_phone: e.target.value}))} />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <><span className="spinner w-4 h-4 border-2" />Saving...</> : editData ? '✓ Update' : '➕ Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
