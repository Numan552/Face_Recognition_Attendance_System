// controllers/authController.js
// Authentication for Admin, Teacher roles

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

/**
 * Generate JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * POST /api/auth/admin/login
 * Admin login
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await db.query('SELECT * FROM admins WHERE email = ? AND is_active = 1', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Update last login
    await db.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    const token = generateToken({ id: admin.id, role: 'admin', email: admin.email, name: admin.name });

    res.json({
      success: true,
      message: 'Admin login successful.',
      token,
      user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin', avatar: admin.avatar },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/teacher/login
 * Teacher login
 */
const teacherLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await db.query('SELECT * FROM teachers WHERE email = ? AND is_active = 1', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const teacher = rows[0];
    const isMatch = await bcrypt.compare(password, teacher.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    await db.query('UPDATE teachers SET last_login = NOW() WHERE id = ?', [teacher.id]);

    const token = generateToken({
      id: teacher.id,
      role: 'teacher',
      email: teacher.email,
      name: teacher.name,
    });

    res.json({
      success: true,
      message: 'Teacher login successful.',
      token,
      user: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: 'teacher',
        avatar: teacher.avatar,
        employee_id: teacher.employee_id,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Get current logged-in user profile
 */
const getMe = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    let query, table;

    if (role === 'admin') {
      table = 'admins';
      query = `SELECT id, name, email, phone, avatar, created_at FROM admins WHERE id = ?`;
    } else {
      table = 'teachers';
      query = `SELECT t.id, t.name, t.email, t.phone, t.avatar, t.employee_id, t.designation,
                      d.name as department FROM teachers t
               LEFT JOIN departments d ON t.department_id = d.id WHERE t.id = ?`;
    }

    const [rows] = await db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user: { ...rows[0], role } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/change-password
 * Change password for logged-in user
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id, role } = req.user;

    const table = role === 'admin' ? 'admins' : 'teachers';
    const [rows] = await db.query(`SELECT password FROM ${table} WHERE id = ?`, [id]);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query(`UPDATE ${table} SET password = ? WHERE id = ?`, [hashed, id]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { adminLogin, teacherLogin, getMe, changePassword };
