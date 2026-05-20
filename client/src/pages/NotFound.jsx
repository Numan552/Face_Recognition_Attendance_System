// src/pages/NotFound.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const home = user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/login';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center p-4">
      <div className="animate-fade-in">
        <p className="text-8xl font-black text-slate-800 select-none">404</p>
        <h1 className="text-2xl font-bold text-slate-200 mt-4">Page Not Found</h1>
        <p className="text-slate-500 mt-2 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <button onClick={() => navigate(home)} className="btn-primary mx-auto">← Go Home</button>
      </div>
    </div>
  );
}
