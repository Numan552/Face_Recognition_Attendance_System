// controllers/departmentController.js
const db = require('../config/database');

const getAllDepartments = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*,
             COUNT(DISTINCT s.id) as student_count,
             COUNT(DISTINCT t.id) as teacher_count
      FROM departments d
      LEFT JOIN students s ON s.department_id = d.id AND s.is_active = 1
      LEFT JOIN teachers t ON t.department_id = d.id AND t.is_active = 1
      GROUP BY d.id ORDER BY d.name
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Name and code are required.' });
    const [result] = await db.query('INSERT INTO departments (name, code, description) VALUES (?, ?, ?)', [name, code, description]);
    const [dept] = await db.query('SELECT * FROM departments WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: dept[0] });
  } catch (err) { next(err); }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    await db.query('UPDATE departments SET name=?, code=?, description=? WHERE id=?', [name, code, description, req.params.id]);
    res.json({ success: true, message: 'Department updated.' });
  } catch (err) { next(err); }
};

const deleteDepartment = async (req, res, next) => {
  try {
    await db.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Department deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAllDepartments, createDepartment, updateDepartment, deleteDepartment };
