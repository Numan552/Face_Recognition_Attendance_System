// src/services/api.js
// Centralized Axios instance with JWT auto-attach and error handling

import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please log in again.');
    } else if (error.response?.status !== 409) {
      // Don't auto-toast 409 (duplicates) - let UI handle it
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

// ========================
// Auth API
// ========================
export const authAPI = {
  adminLogin: (data) => api.post('/auth/admin/login', data),
  teacherLogin: (data) => api.post('/auth/teacher/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ========================
// Students API
// ========================
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (formData) => api.post('/students', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/students/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/students/${id}`),
  getAttendance: (id, params) => api.get(`/students/${id}/attendance`, { params }),
};

// ========================
// Teachers API
// ========================
export const teachersAPI = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  getSubjects: (id) => api.get(`/teachers/${id}/subjects`),
  create: (formData) => api.post('/teachers', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/teachers/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/teachers/${id}`),
};

// ========================
// Subjects API
// ========================
export const subjectsAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

// ========================
// Departments API
// ========================
export const departmentsAPI = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// ========================
// Attendance API
// ========================
export const attendanceAPI = {
  getDashboardStats: () => api.get('/attendance/dashboard-stats'),
  getSessions: (params) => api.get('/attendance/sessions', { params }),
  startSession: (data) => api.post('/attendance/sessions', data),
  endSession: (id) => api.put(`/attendance/sessions/${id}/end`),
  getSessionRecords: (id) => api.get(`/attendance/sessions/${id}/records`),
  markAttendance: (data) => api.post('/attendance/mark', data),
  markBatchAttendance: (data) => api.post('/attendance/mark-batch', data),
  getReport: (params) => api.get('/attendance/report', { params }),
};

// ========================
// Face API
// ========================
export const faceAPI = {
  getAllDescriptors: () => api.get('/face/descriptors'),
  register: (formData) => api.post('/face/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (studentId) => api.delete(`/face/${studentId}`),
};

export default api;
