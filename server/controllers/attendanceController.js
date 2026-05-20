// controllers/attendanceController.js
// Handles attendance sessions and individual attendance records

const db = require('../config/database');

/**
 * POST /api/attendance/sessions
 * Start a new attendance session
 */
const startSession = async (req, res, next) => {
  try {
    const { subject_id, session_date, notes } = req.body;
    const teacher_id = req.user.id;

    if (!subject_id || !session_date) {
      return res.status(400).json({ success: false, message: 'Subject and date are required.' });
    }

    // Check for existing active session for this subject today
    const [existing] = await db.query(
      `SELECT id FROM attendance_sessions WHERE subject_id = ? AND session_date = ? AND status = 'active'`,
      [subject_id, session_date]
    );
    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: 'An active session already exists for this subject today.',
        session_id: existing[0].id,
      });
    }

    const [result] = await db.query(
      `INSERT INTO attendance_sessions (subject_id, teacher_id, session_date, start_time, status, notes)
       VALUES (?, ?, ?, CURTIME(), 'active', ?)`,
      [subject_id, teacher_id, session_date, notes || null]
    );

    const [session] = await db.query(
      `SELECT sess.*, sub.name as subject_name, sub.code as subject_code
       FROM attendance_sessions sess JOIN subjects sub ON sess.subject_id = sub.id
       WHERE sess.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, message: 'Session started.', data: session[0] });
  } catch (err) { next(err); }
};

/**
 * PUT /api/attendance/sessions/:id/end
 * End an attendance session
 */
const endSession = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM attendance_sessions WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Session not found.' });

    const [countResult] = await db.query(
      `SELECT COUNT(*) as present FROM attendance WHERE session_id = ? AND status = 'present'`,
      [req.params.id]
    );

    await db.query(
      `UPDATE attendance_sessions SET status='completed', end_time=CURTIME(), present_count=? WHERE id=?`,
      [countResult[0].present, req.params.id]
    );

    res.json({ success: true, message: 'Session ended successfully.' });
  } catch (err) { next(err); }
};

/**
 * GET /api/attendance/sessions
 * List sessions (teacher sees own, admin sees all)
 */
const getSessions = async (req, res, next) => {
  try {
    const { subject_id, from_date, to_date, status } = req.query;
    let query = `
      SELECT sess.*, sub.name as subject_name, sub.code as subject_code,
             t.name as teacher_name
      FROM attendance_sessions sess
      JOIN subjects sub ON sess.subject_id = sub.id
      JOIN teachers t ON sess.teacher_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'teacher') {
      query += ' AND sess.teacher_id = ?'; params.push(req.user.id);
    }
    if (subject_id) { query += ' AND sess.subject_id = ?'; params.push(subject_id); }
    if (from_date) { query += ' AND sess.session_date >= ?'; params.push(from_date); }
    if (to_date) { query += ' AND sess.session_date <= ?'; params.push(to_date); }
    if (status) { query += ' AND sess.status = ?'; params.push(status); }

    query += ' ORDER BY sess.session_date DESC, sess.start_time DESC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

/**
 * POST /api/attendance/mark
 * Mark attendance for a student in a session
 */
const markAttendance = async (req, res, next) => {
  try {
    const { session_id, student_id, status = 'present', confidence_score, recognition_method = 'face' } = req.body;

    if (!session_id || !student_id) {
      return res.status(400).json({ success: false, message: 'Session ID and student ID are required.' });
    }

    // Get session info
    const [sessions] = await db.query('SELECT * FROM attendance_sessions WHERE id = ? AND status = ?', [session_id, 'active']);
    if (!sessions.length) {
      return res.status(400).json({ success: false, message: 'No active session found.' });
    }

    const session = sessions[0];

    // Check duplicate
    const [existing] = await db.query(
      'SELECT id FROM attendance WHERE session_id = ? AND student_id = ?',
      [session_id, student_id]
    );

    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Attendance already marked for this student.' });
    }

    await db.query(
      `INSERT INTO attendance (session_id, student_id, subject_id, status, confidence_score, recognition_method, marked_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [session_id, student_id, session.subject_id, status, confidence_score || null, recognition_method, req.user.id]
    );

    // Update session count
    await db.query(
      `UPDATE attendance_sessions SET present_count = (
         SELECT COUNT(*) FROM attendance WHERE session_id = ? AND status = 'present'
       ) WHERE id = ?`,
      [session_id, session_id]
    );

    const [student] = await db.query('SELECT id, name, roll_number, avatar FROM students WHERE id = ?', [student_id]);

    res.status(201).json({ success: true, message: 'Attendance marked.', student: student[0] });
  } catch (err) { next(err); }
};

/**
 * POST /api/attendance/mark-batch
 * Batch mark attendance (face recognition result)
 */
const markBatchAttendance = async (req, res, next) => {
  try {
    const { session_id, records } = req.body; // records: [{student_id, confidence_score}]

    if (!session_id || !records?.length) {
      return res.status(400).json({ success: false, message: 'Session ID and records are required.' });
    }

    const [sessions] = await db.query('SELECT * FROM attendance_sessions WHERE id = ? AND status = ?', [session_id, 'active']);
    if (!sessions.length) {
      return res.status(400).json({ success: false, message: 'No active session found.' });
    }

    const session = sessions[0];
    const results = { marked: [], skipped: [] };

    for (const record of records) {
      const [existing] = await db.query(
        'SELECT id FROM attendance WHERE session_id = ? AND student_id = ?',
        [session_id, record.student_id]
      );

      if (existing.length) {
        results.skipped.push(record.student_id);
        continue;
      }

      await db.query(
        `INSERT INTO attendance (session_id, student_id, subject_id, status, confidence_score, recognition_method)
         VALUES (?, ?, ?, 'present', ?, 'face')`,
        [session_id, record.student_id, session.subject_id, record.confidence_score]
      );
      results.marked.push(record.student_id);
    }

    res.json({ success: true, message: `Marked ${results.marked.length}, skipped ${results.skipped.length}`, results });
  } catch (err) { next(err); }
};

/**
 * GET /api/attendance/sessions/:id/records
 * Get all attendance records for a session
 */
const getSessionRecords = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, s.name as student_name, s.roll_number, s.avatar
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.session_id = ?
      ORDER BY s.roll_number
    `, [req.params.id]);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

/**
 * GET /api/attendance/report
 * Attendance report with filters
 */
const getReport = async (req, res, next) => {
  try {
    const { subject_id, from_date, to_date, department_id } = req.query;

    let query = `
      SELECT s.id, s.name, s.roll_number, d.name as department,
             sub.name as subject_name, sub.code as subject_code,
             COUNT(DISTINCT sess.id) as total_classes,
             SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
             ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(DISTINCT sess.id) * 100, 1) as percentage
      FROM students s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN attendance a ON a.student_id = s.id
      LEFT JOIN attendance_sessions sess ON a.session_id = sess.id
      LEFT JOIN subjects sub ON a.subject_id = sub.id
      WHERE s.is_active = 1
    `;
    const params = [];

    if (subject_id) { query += ' AND a.subject_id = ?'; params.push(subject_id); }
    if (department_id) { query += ' AND s.department_id = ?'; params.push(department_id); }
    if (from_date) { query += ' AND sess.session_date >= ?'; params.push(from_date); }
    if (to_date) { query += ' AND sess.session_date <= ?'; params.push(to_date); }

    query += ' GROUP BY s.id, sub.id ORDER BY s.roll_number, sub.code';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

/**
 * GET /api/attendance/dashboard-stats
 * Dashboard statistics for admin
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [[students]] = await db.query('SELECT COUNT(*) as total FROM students WHERE is_active = 1');
    const [[teachers]] = await db.query('SELECT COUNT(*) as total FROM teachers WHERE is_active = 1');
    const [[subjects]] = await db.query('SELECT COUNT(*) as total FROM subjects WHERE is_active = 1');
    const [[todaySessions]] = await db.query(
      `SELECT COUNT(*) as total FROM attendance_sessions WHERE session_date = CURDATE()`
    );
    const [[todayPresent]] = await db.query(
      `SELECT COUNT(*) as total FROM attendance a
       JOIN attendance_sessions sess ON a.session_id = sess.id
       WHERE sess.session_date = CURDATE() AND a.status = 'present'`
    );
    const [[faceRegistered]] = await db.query('SELECT COUNT(*) as total FROM students WHERE face_registered = 1');

    // Attendance trend last 7 days
    const [trend] = await db.query(`
      SELECT sess.session_date as date,
             COUNT(DISTINCT a.id) as present_count
      FROM attendance_sessions sess
      LEFT JOIN attendance a ON a.session_id = sess.id AND a.status = 'present'
      WHERE sess.session_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY sess.session_date
      ORDER BY sess.session_date
    `);

    res.json({
      success: true,
      data: {
        students: students.total,
        teachers: teachers.total,
        subjects: subjects.total,
        today_sessions: todaySessions.total,
        today_present: todayPresent.total,
        face_registered: faceRegistered.total,
        trend,
      },
    });
  } catch (err) { next(err); }
};

module.exports = {
  startSession, endSession, getSessions, markAttendance,
  markBatchAttendance, getSessionRecords, getReport, getDashboardStats,
};
