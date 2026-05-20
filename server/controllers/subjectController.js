// controllers/subjectController.js
const db = require('../config/database');

const getAllSubjects = async (req, res, next) => {
  try {
    const { department_id, semester, teacher_id } = req.query;
    let query = `
      SELECT s.*, d.name as department_name, t.name as teacher_name
      FROM subjects s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN teachers t ON s.teacher_id = t.id
      WHERE s.is_active = 1
    `;
    const params = [];
    if (department_id) { query += ' AND s.department_id = ?'; params.push(department_id); }
    if (semester) { query += ' AND s.semester = ?'; params.push(semester); }
    if (teacher_id) { query += ' AND s.teacher_id = ?'; params.push(teacher_id); }
    query += ' ORDER BY s.code';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const createSubject = async (req, res, next) => {
  try {
    const { name, code, department_id, semester, credits, teacher_id, description } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Name and code are required.' });
    const [result] = await db.query(
      `INSERT INTO subjects (name, code, department_id, semester, credits, teacher_id, description) VALUES (?,?,?,?,?,?,?)`,
      [name, code, department_id || null, semester || null, credits || 3, teacher_id || null, description]
    );
    const [sub] = await db.query('SELECT * FROM subjects WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Subject created.', data: sub[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Subject code already exists.' });
    next(err);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { name, code, department_id, semester, credits, teacher_id, description, is_active } = req.body;
    await db.query(
      `UPDATE subjects SET name=?, code=?, department_id=?, semester=?, credits=?, teacher_id=?, description=?, is_active=? WHERE id=?`,
      [name, code, department_id || null, semester, credits, teacher_id || null, description, is_active ?? 1, req.params.id]
    );
    res.json({ success: true, message: 'Subject updated.' });
  } catch (err) { next(err); }
};

const deleteSubject = async (req, res, next) => {
  try {
    await db.query('UPDATE subjects SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Subject deactivated.' });
  } catch (err) { next(err); }
};

module.exports = { getAllSubjects, createSubject, updateSubject, deleteSubject };

// =============================================
// controllers/departmentController.js
// =============================================
// (exporting as separate module below for cleanliness)
