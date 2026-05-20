// controllers/faceController.js
// Manages facial embedding storage and retrieval for face recognition

const db = require('../config/database');
const fs = require('fs');

/**
 * POST /api/face/register
 * Save face descriptor (128-dim float array) for a student
 */
const registerFace = async (req, res, next) => {
  try {
    const { student_id, face_descriptor } = req.body;

    if (!student_id || !face_descriptor) {
      return res.status(400).json({ success: false, message: 'Student ID and face descriptor are required.' });
    }

    // Validate student exists
    const [students] = await db.query('SELECT id, name FROM students WHERE id = ?', [student_id]);
    if (!students.length) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Validate descriptor is array of 128 numbers
    let descriptor;
    try {
      descriptor = typeof face_descriptor === 'string' ? JSON.parse(face_descriptor) : face_descriptor;
      if (!Array.isArray(descriptor) || descriptor.length !== 128) {
        throw new Error('Invalid descriptor');
      }
    } catch {
      return res.status(400).json({ success: false, message: 'Face descriptor must be a 128-element float array.' });
    }

    const face_image_path = req.file ? req.file.path : null;

    // Upsert face data
    const [existing] = await db.query('SELECT id FROM face_data WHERE student_id = ?', [student_id]);

    if (existing.length) {
      // Delete old face image if updating
      const [old] = await db.query('SELECT face_image_path FROM face_data WHERE student_id = ?', [student_id]);
      if (old[0].face_image_path && face_image_path && fs.existsSync(old[0].face_image_path)) {
        fs.unlinkSync(old[0].face_image_path);
      }

      await db.query(
        'UPDATE face_data SET face_descriptor = ?, face_image_path = ?, registered_at = NOW() WHERE student_id = ?',
        [JSON.stringify(descriptor), face_image_path || old[0].face_image_path, student_id]
      );
    } else {
      await db.query(
        'INSERT INTO face_data (student_id, face_descriptor, face_image_path) VALUES (?, ?, ?)',
        [student_id, JSON.stringify(descriptor), face_image_path]
      );
    }

    // Mark student as face-registered
    await db.query('UPDATE students SET face_registered = 1 WHERE id = ?', [student_id]);

    res.json({
      success: true,
      message: `Face data ${existing.length ? 'updated' : 'registered'} for ${students[0].name}.`,
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/face/descriptors
 * Get ALL face descriptors for client-side recognition matching
 * Returns lightweight payload: student_id, name, roll_number, descriptor
 */
const getAllDescriptors = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT f.student_id, f.face_descriptor, f.face_image_path,
             s.name, s.roll_number, s.avatar
      FROM face_data f
      JOIN students s ON f.student_id = s.id
      WHERE s.is_active = 1 AND s.face_registered = 1
    `);

    const data = rows.map(r => ({
      student_id: r.student_id,
      name: r.name,
      roll_number: r.roll_number,
      avatar: r.avatar,
      face_descriptor: JSON.parse(r.face_descriptor),
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/face/:student_id
 * Remove face data for a student
 */
const deleteFaceData = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM face_data WHERE student_id = ?', [req.params.student_id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'No face data found.' });
    }

    if (rows[0].face_image_path && fs.existsSync(rows[0].face_image_path)) {
      fs.unlinkSync(rows[0].face_image_path);
    }

    await db.query('DELETE FROM face_data WHERE student_id = ?', [req.params.student_id]);
    await db.query('UPDATE students SET face_registered = 0 WHERE id = ?', [req.params.student_id]);

    res.json({ success: true, message: 'Face data removed.' });
  } catch (err) { next(err); }
};

module.exports = { registerFace, getAllDescriptors, deleteFaceData };
