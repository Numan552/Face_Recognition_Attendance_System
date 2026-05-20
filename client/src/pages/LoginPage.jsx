// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [role, setRole] = useState('admin');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password, role);
      navigate(user.role === 'admin' ? '/admin' : '/teacher');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setForm({
      email: role === 'admin' ? 'admin@university.edu' : 'rahim@university.edu',
      password: role === 'admin' ? 'Admin@123' : 'Teacher@123',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-2xl shadow-blue-600/30">
            🎯
          </div>
          <h1 className="text-2xl font-bold text-slate-100">FaceAttend</h1>
          <p className="text-slate-500 text-sm mt-1">AI Face Recognition Attendance System</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* Role toggle */}
          <div className="flex bg-slate-900 rounded-xl p-1 mb-6">
            {['admin', 'teacher'].map(r => (
              <button
                key={r}
                onClick={() => { setRole(r); setForm({ email: '', password: '' }); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                  role === r
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === 'admin' ? '🛡️' : '👩‍🏫'} {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder={role === 'admin' ? 'admin@university.edu' : 'teacher@university.edu'}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {loading ? (
                <><span className="spinner w-5 h-5 border-2" />Signing in...</>
              ) : (
                <>🔐 Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}</>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <button
            onClick={fillDemo}
            className="mt-4 w-full text-xs text-slate-500 hover:text-blue-400 transition-colors py-2 border border-dashed border-slate-700 rounded-lg"
          >
            Use demo credentials →
          </button>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          AI Face Recognition Attendance System • Final Year CSE Project
        </p>
      </div>
    </div>
  );
}
