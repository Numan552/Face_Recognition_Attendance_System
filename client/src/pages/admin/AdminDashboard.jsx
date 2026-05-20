// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import Layout from '../../components/common/Layout';
import { attendanceAPI, studentsAPI, teachersAPI } from '../../services/api';

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="stat-card">
    <div className={`stat-icon ${color}`}>
      <span className="text-2xl">{icon}</span>
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-100">{value ?? '—'}</p>
      <p className="text-sm font-medium text-slate-300">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceAPI.getDashboardStats()
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chartData = stats?.trend?.map(t => ({
    date: format(new Date(t.date), 'MMM d'),
    present: t.present_count,
  })) || [];

  return (
    <Layout title="Admin Dashboard">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner w-10 h-10 border-4" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard icon="🎓" label="Total Students" value={stats?.students} sub="Active" color="bg-blue-500/20" />
            <StatCard icon="👩‍🏫" label="Teachers" value={stats?.teachers} sub="Active" color="bg-purple-500/20" />
            <StatCard icon="📚" label="Subjects" value={stats?.subjects} sub="This semester" color="bg-amber-500/20" />
            <StatCard icon="📅" label="Sessions Today" value={stats?.today_sessions} sub="Active sessions" color="bg-cyan-500/20" />
            <StatCard icon="✅" label="Present Today" value={stats?.today_present} sub="Students" color="bg-emerald-500/20" />
            <StatCard icon="🤖" label="Face Enrolled" value={stats?.face_registered} sub="Students" color="bg-rose-500/20" />
          </div>

          {/* Attendance trend chart */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 card">
              <h2 className="text-base font-semibold text-slate-200 mb-4">📈 Attendance Trend (Last 7 Days)</h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                    />
                    <Area type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={2} fill="url(#colorPresent)" name="Present" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-500">
                  <p>No attendance data yet</p>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="card">
              <h2 className="text-base font-semibold text-slate-200 mb-4">⚡ Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon: '🎓', label: 'Add New Student', to: '/admin/students' },
                  { icon: '👩‍🏫', label: 'Add Teacher', to: '/admin/teachers' },
                  { icon: '📚', label: 'Manage Subjects', to: '/admin/subjects' },
                  { icon: '👤', label: 'Register Face', to: '/admin/face-registration' },
                  { icon: '📊', label: 'View Reports', to: '/admin/reports' },
                ].map(action => (
                  <a
                    key={action.to}
                    href={action.to}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-900 hover:bg-slate-700 transition-colors text-sm text-slate-300 hover:text-slate-100"
                  >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                    <span className="ml-auto text-slate-600">→</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Info cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-sm bg-blue-600/10 border-blue-500/30">
              <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">Face Recognition</p>
              <p className="text-2xl font-bold text-white">{stats?.face_registered || 0}</p>
              <p className="text-xs text-slate-400 mt-1">of {stats?.students || 0} students enrolled</p>
              <div className="mt-2 bg-slate-900 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${stats?.students ? (stats.face_registered / stats.students) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="card-sm bg-emerald-600/10 border-emerald-500/30">
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">Today's Rate</p>
              <p className="text-2xl font-bold text-white">
                {stats?.today_sessions > 0
                  ? Math.round((stats.today_present / (stats.students * stats.today_sessions)) * 100) + '%'
                  : 'N/A'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Attendance rate</p>
            </div>
            <div className="card-sm bg-purple-600/10 border-purple-500/30">
              <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-1">Departments</p>
              <p className="text-2xl font-bold text-white">5</p>
              <p className="text-xs text-slate-400 mt-1">Academic departments</p>
            </div>
            <div className="card-sm bg-amber-600/10 border-amber-500/30">
              <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">System Status</p>
              <p className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block animate-pulse" />
                All Systems Online
              </p>
              <p className="text-xs text-slate-400 mt-1">Face API ready</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
