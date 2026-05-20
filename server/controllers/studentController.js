// controllers/studentController.js
// Full CRUD for students management

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

/**
 * GET /api/students
 * List all students with filters
 */
const getAllStudents = async (req, res, next) => {
  try {
    const { department_id, semester, section, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.id, s.name, s.email, s.roll_number, s.semester, s.section,
             s.phone, s.avatar, s.gender, s.is_active, s.face_registered,
             d.name as department, d.code as dept_code, s.created_at
      FROM students s
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (department_id) { query += ' AND s.department_id = ?'; params.push(department_id); }
    if (semester) { query += ' AND s.semester = ?'; params.push(semester); }
    if (section) { query += ' AND s.section = ?'; params.push(section); }
    if (search) {
      query += ' AND (s.name LIKE ? OR s.roll_number LIKE ? OR s.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Count total
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM'
    );
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [students] = await db.query(query, params);

    res.json({
      success: true,
      data: students,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/students/:id
 * Get single student
 */
const getStudentById = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, d.name as department, d.code as dept_code,
             CASE WHEN f.id IS NOT NULL THEN true ELSE false END as has_face_data
      FROM students s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN face_data f ON f.student_id = s.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/students
 * Create new student
 */
const createStudent = async (req, res, next) => {
  try {
    const {
      name, email, roll_number, department_id, semester, section,
      phone, gender, date_of_birth, address, guardian_name, guardian_phone
    } = req.body;

    if (!name || !email || !roll_number) {
      return res.status(400).json({ success: false, message: 'Name, email, and roll number are required.' });
    }

    const avatar = req.file ? req.file.path : null;

    const [result] = await db.query(
      `INSERT INTO students (name, email, roll_number, department_id, semester, section,
       phone, gender, date_of_birth, address, guardian_name, guardian_phone, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, roll_number, department_id || null, semester || 1, section,
       phone, gender, date_of_birth || null, address, guardian_name, guardian_phone, avatar]
    );

    const [newStudent] = await db.query('SELECT * FROM students WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Student created successfully.', data: newStudent[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email or roll number already exists.' });
    }
    next(err);
  }
};

/**
 * PUT /api/students/:id
 * Update student
 */
const updateStudent = async (req, res, next) => {
  try {
    const {
      name, email, roll_number, department_id, semester, section,
      phone, gender, date_of_birth, address, guardian_name, guardian_phone, is_active
    } = req.body;

    const [existing] = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    let avatar = existing[0].avatar;
    if (req.file) {
      // Delete old avatar if exists
      if (avatar && fs.existsSync(avatar)) fs.unlinkSync(avatar);
      avatar = req.file.path;
    }

    await db.query(
      `UPDATE students SET name=?, email=?, roll_number=?, department_id=?, semester=?,
       section=?, phone=?, gender=?, date_of_birth=?, address=?, guardian_name=?,
       guardian_phone=?, avatar=?, is_active=? WHERE id=?`,
      [name, email, roll_number, department_id || null, semester, section,
       phone, gender, date_of_birth || null, address, guardian_name,
       guardian_phone, avatar, is_active ?? 1, req.params.id]
    );

    const [updated] = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Student updated successfully.', data: updated[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/students/:id
 * Delete student (soft delete)
 */
const deleteStudent = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id FROM students WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    await db.query('UPDATE students SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Student deactivated successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/students/:id/attendance
 * Get student attendance summary
 */
const getStudentAttendance = async (req, res, next) => {
  try {
    const { subject_id, from_date, to_date } = req.query;

    let query = `
      SELECT a.*, sub.name as subject_name, sub.code as subject_code,
             sess.session_date, sess.start_time
      FROM attendance a
      JOIN attendance_sessions sess ON a.session_id = sess.id
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.student_id = ?
    `;
    const params = [req.params.id];

    if (subject_id) { query += ' AND a.subject_id = ?'; params.push(subject_id); }
    if (from_date) { query += ' AND sess.session_date >= ?'; params.push(from_date); }
    if (to_date) { query += ' AND sess.session_date <= ?'; params.push(to_date); }

    query += ' ORDER BY sess.session_date DESC';

    const [records] = await db.query(query, params);

    // Compute summary per subject
    const summary = {};
    records.forEach(r => {
      if (!summary[r.subject_id]) {
        summary[r.subject_id] = { subject: r.subject_name, code: r.subject_code, total: 0, present: 0 };
      }
      summary[r.subject_id].total++;
      if (r.status === 'present') summary[r.subject_id].present++;
    });

    Object.values(summary).forEach(s => {
      s.percentage = s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : '0.0';
    });

    res.json({ success: true, data: records, summary: Object.values(summary) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent, getStudentAttendance };
