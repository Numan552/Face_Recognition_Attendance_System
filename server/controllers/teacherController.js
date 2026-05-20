// controllers/teacherController.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const getAllTeachers = async (req, res, next) => {
  try {
    const { department_id, search } = req.query;
    let query = `
      SELECT t.id, t.name, t.email, t.employee_id, t.phone, t.designation,
             t.avatar, t.is_active, t.last_login, t.created_at,
             d.name as department
      FROM teachers t LEFT JOIN departments d ON t.department_id = d.id WHERE 1=1
    `;
    const params = [];
    if (department_id) { query += ' AND t.department_id = ?'; params.push(department_id); }
    if (search) {
      query += ' AND (t.name LIKE ? OR t.email LIKE ? OR t.employee_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY t.name';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const getTeacherById = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, d.name as department FROM teachers t
       LEFT JOIN departments d ON t.department_id = d.id WHERE t.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    const { password, ...teacher } = rows[0];
    res.json({ success: true, data: teacher });
  } catch (err) { next(err); }
};

const createTeacher = async (req, res, next) => {
  try {
    const { name, email, employee_id, password, phone, department_id, designation } = req.body;
    if (!name || !email || !employee_id || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, employee ID, and password are required.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const avatar = req.file ? req.file.path : null;
    const [result] = await db.query(
      `INSERT INTO teachers (name, email, employee_id, password, phone, department_id, designation, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, employee_id, hashed, phone, department_id || null, designation, avatar]
    );
    const [newT] = await db.query('SELECT id, name, email, employee_id, phone, designation FROM teachers WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Teacher created.', data: newT[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Email or employee ID already exists.' });
    next(err);
  }
};

const updateTeacher = async (req, res, next) => {
  try {
    const { name, email, employee_id, phone, department_id, designation, is_active } = req.body;
    const [ex] = await db.query('SELECT * FROM teachers WHERE id = ?', [req.params.id]);
    if (!ex.length) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    let avatar = ex[0].avatar;
    if (req.file) {
      if (avatar && fs.existsSync(avatar)) fs.unlinkSync(avatar);
      avatar = req.file.path;
    }
    await db.query(
      `UPDATE teachers SET name=?, email=?, employee_id=?, phone=?, department_id=?, designation=?, avatar=?, is_active=? WHERE id=?`,
      [name, email, employee_id, phone, department_id || null, designation, avatar, is_active ?? 1, req.params.id]
    );
    res.json({ success: true, message: 'Teacher updated.' });
  } catch (err) { next(err); }
};

const deleteTeacher = async (req, res, next) => {
  try {
    await db.query('UPDATE teachers SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Teacher deactivated.' });
  } catch (err) { next(err); }
};

const getTeacherSubjects = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, d.name as department FROM subjects s
       LEFT JOIN departments d ON s.department_id = d.id
       WHERE s.teacher_id = ? AND s.is_active = 1`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

module.exports = { getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher, getTeacherSubjects };
