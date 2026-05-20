// src/pages/teacher/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Layout from '../../components/common/Layout';
import { subjectsAPI, attendanceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    Promise.all([
      subjectsAPI.getAll({ teacher_id: user.id }),
      attendanceAPI.getSessions({ from_date: format(new Date(Date.now() - 7 * 86400000), 'yyyy-MM-dd') }),
    ]).then(([sRes, aRes]) => {
      setSubjects(sRes.data.data);
      setSessions(aRes.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user.id]);

  const todaySessions = sessions.filter(s => s.session_date?.startsWith(today));
  const totalPresent = sessions.reduce((acc, s) => acc + (s.present_count || 0), 0);

  return (
    <Layout title="Teacher Dashboard">
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner w-10 h-10 border-4" /></div>
      ) : (
        <div className="space-y-6">
          {/* Welcome */}
          <div className="card bg-gradient-to-r from-blue-600/20 to-purple-600/10 border-blue-500/20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600/30 rounded-2xl flex items-center justify-center text-3xl">👩‍🏫</div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Welcome, {user.name}!</h2>
                <p className="text-slate-400 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
              </div>
              <div className="ml-auto">
                <a href="/teacher/attendance" className="btn-primary">▶️ Take Attendance</a>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '📚', label: 'My Subjects', value: subjects.length, color: 'bg-blue-500/20' },
              { icon: '📅', label: "Today's Sessions", value: todaySessions.length, color: 'bg-emerald-500/20' },
              { icon: '✅', label: 'Total Present (7d)', value: totalPresent, color: 'bg-purple-500/20' },
              { icon: '📋', label: 'Total Sessions (7d)', value: sessions.length, color: 'bg-amber-500/20' },
            ].map(stat => (
              <div key={stat.label} className="stat-card">
                <div className={`stat-icon ${stat.color}`}><span className="text-2xl">{stat.icon}</span></div>
                <div>
                  <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* My Subjects */}
            <div className="card">
              <h2 className="text-base font-semibold text-slate-200 mb-4">📚 My Subjects</h2>
              <div className="space-y-2">
                {subjects.length === 0 ? (
                  <p className="text-slate-500 text-sm">No subjects assigned yet.</p>
                ) : subjects.map(sub => (
                  <div key={sub.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-900 rounded-lg">
                    <div className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center text-sm font-bold text-blue-400 flex-shrink-0">
                      {sub.code.split('-')[1] || sub.code[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{sub.name}</p>
                      <p className="text-xs text-slate-500">{sub.code} • Sem {sub.semester} • {sub.credits} credits</p>
                    </div>
                    <span className="ml-auto badge badge-blue">{sub.department_name || 'CSE'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="card">
              <h2 className="text-base font-semibold text-slate-200 mb-4">📋 Recent Sessions (7 days)</h2>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {sessions.length === 0 ? (
                  <p className="text-slate-500 text-sm">No sessions yet. <a href="/teacher/attendance" className="text-blue-400 hover:underline">Start one →</a></p>
                ) : sessions.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-900 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{s.subject_name}</p>
                      <p className="text-xs text-slate-500">{s.session_date} • {s.start_time}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-sm font-bold text-emerald-400">{s.present_count} present</p>
                      <span className={`badge text-xs ${s.status === 'active' ? 'badge-yellow' : 'badge-green'}`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="card">
            <h2 className="text-base font-semibold text-slate-200 mb-4">⚡ Quick Actions</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: '✅', label: 'Take Attendance', desc: 'Start face recognition session', to: '/teacher/attendance', color: 'border-blue-500/30 hover:bg-blue-500/10' },
                { icon: '👤', label: 'Register Face', desc: 'Enroll student face data', to: '/teacher/face-registration', color: 'border-purple-500/30 hover:bg-purple-500/10' },
                { icon: '📊', label: 'View Reports', desc: 'Check attendance records', to: '/teacher/attendance', color: 'border-emerald-500/30 hover:bg-emerald-500/10' },
              ].map(a => (
                <a key={a.to} href={a.to} className={`p-4 rounded-xl border bg-slate-900 transition-colors ${a.color}`}>
                  <p className="text-2xl mb-2">{a.icon}</p>
                  <p className="text-sm font-semibold text-slate-200">{a.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{a.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
