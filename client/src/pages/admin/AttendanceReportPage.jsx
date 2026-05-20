// src/pages/admin/AttendanceReportPage.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { attendanceAPI, subjectsAPI, departmentsAPI } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AttendanceReportPage() {
  const [report, setReport] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    subject_id: '', department_id: '',
    from_date: format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd'),
    to_date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    subjectsAPI.getAll().then(r => setSubjects(r.data.data));
    departmentsAPI.getAll().then(r => setDepartments(r.data.data));
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getReport(filters);
      setReport(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!report.length) { toast.error('No data to export.'); return; }
    const headers = ['Student', 'Roll No', 'Department', 'Subject', 'Subject Code', 'Total Classes', 'Present', 'Percentage'];
    const rows = report.map(r => [
      r.name, r.roll_number, r.department || '', r.subject_name || '', r.subject_code || '',
      r.total_classes || 0, r.present || 0, `${r.percentage || 0}%`,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `attendance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  const getPercentColor = (pct) => {
    const p = parseFloat(pct);
    if (p >= 75) return 'badge-green';
    if (p >= 50) return 'badge-yellow';
    return 'badge-red';
  };

  const inp = k => ({ className: 'input', value: filters[k], onChange: e => setFilters(f => ({ ...f, [k]: e.target.value })) });

  return (
    <Layout title="Attendance Reports">
      <div className="space-y-4">
        {/* Filters */}
        <div className="card">
          <h2 className="text-base font-semibold text-slate-200 mb-4">🔍 Filter Report</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Department</label>
              <select className="input" value={filters.department_id} onChange={e => setFilters(f => ({ ...f, department_id: e.target.value }))}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject</label>
              <select className="input" value={filters.subject_id} onChange={e => setFilters(f => ({ ...f, subject_id: e.target.value }))}>
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div><label className="label">From Date</label><input type="date" {...inp('from_date')} /></div>
            <div><label className="label">To Date</label><input type="date" {...inp('to_date')} /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={generateReport} disabled={loading} className="btn-primary">
              {loading ? <><span className="spinner w-4 h-4 border-2" />Generating...</> : '📊 Generate Report'}
            </button>
            <button onClick={exportCSV} className="btn-secondary">📥 Export CSV</button>
          </div>
        </div>

        {/* Summary cards */}
        {report.length > 0 && (
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Records', value: report.length, color: 'text-blue-400' },
              { label: 'Avg Attendance', value: report.length ? `${(report.reduce((a, r) => a + parseFloat(r.percentage || 0), 0) / report.length).toFixed(1)}%` : '—', color: 'text-emerald-400' },
              { label: 'Above 75%', value: report.filter(r => parseFloat(r.percentage) >= 75).length, color: 'text-green-400' },
              { label: 'Below 50%', value: report.filter(r => parseFloat(r.percentage) < 50).length, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="card-sm text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">📋 Attendance Records</h2>
            <span className="badge badge-blue">{report.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/70 border-b border-slate-700">
                <tr>{['Student', 'Roll No', 'Dept', 'Subject', 'Total Classes', 'Present', 'Attendance %'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr><td colSpan={7} className="py-16 text-center text-slate-500"><div className="spinner mx-auto mb-2" />Generating report...</td></tr>
                ) : report.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center text-slate-500">
                    No data for selected filters. Click "Generate Report".
                  </td></tr>
                ) : report.map((r, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-600/30 flex items-center justify-center text-xs font-bold text-blue-400">{r.name?.[0]}</div>
                        <span className="text-sm text-slate-200">{r.name}</span>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs">{r.roll_number}</td>
                    <td className="table-cell text-xs">{r.department || '—'}</td>
                    <td className="table-cell text-xs">
                      <span>{r.subject_name || '—'}</span>
                      {r.subject_code && <span className="ml-1 badge badge-blue text-xs">{r.subject_code}</span>}
                    </td>
                    <td className="table-cell text-center font-mono">{r.total_classes || 0}</td>
                    <td className="table-cell text-center font-mono text-emerald-400">{r.present || 0}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-900 rounded-full h-1.5 max-w-[80px]">
                          <div
                            className={`h-1.5 rounded-full ${parseFloat(r.percentage) >= 75 ? 'bg-emerald-500' : parseFloat(r.percentage) >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, r.percentage || 0)}%` }}
                          />
                        </div>
                        <span className={`badge ${getPercentColor(r.percentage)}`}>{r.percentage || 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
