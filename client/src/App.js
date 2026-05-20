// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentsPage from './pages/admin/StudentsPage';
import TeachersPage from './pages/admin/TeachersPage';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import SubjectsPage from './pages/admin/SubjectsPage';
import AttendanceReportPage from './pages/admin/AttendanceReportPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AttendancePage from './pages/teacher/AttendancePage';
import FaceRegistrationPage from './pages/FaceRegistrationPage';
import NotFound from './pages/NotFound';

// Route guards
const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/teacher'} replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Admin routes */}
      <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/students" element={<PrivateRoute roles={['admin']}><StudentsPage /></PrivateRoute>} />
      <Route path="/admin/teachers" element={<PrivateRoute roles={['admin']}><TeachersPage /></PrivateRoute>} />
      <Route path="/admin/departments" element={<PrivateRoute roles={['admin']}><DepartmentsPage /></PrivateRoute>} />
      <Route path="/admin/subjects" element={<PrivateRoute roles={['admin']}><SubjectsPage /></PrivateRoute>} />
      <Route path="/admin/reports" element={<PrivateRoute roles={['admin']}><AttendanceReportPage /></PrivateRoute>} />
      <Route path="/admin/face-registration" element={<PrivateRoute roles={['admin']}><FaceRegistrationPage /></PrivateRoute>} />

      {/* Teacher routes */}
      <Route path="/teacher" element={<PrivateRoute roles={['teacher']}><TeacherDashboard /></PrivateRoute>} />
      <Route path="/teacher/attendance" element={<PrivateRoute roles={['teacher']}><AttendancePage /></PrivateRoute>} />
      <Route path="/teacher/face-registration" element={<PrivateRoute roles={['teacher']}><FaceRegistrationPage /></PrivateRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
