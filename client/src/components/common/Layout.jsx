// src/components/common/Layout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, title }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main className={`transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'} min-h-screen`}>
        <Header title={title} collapsed={collapsed} />
        <div className="p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
