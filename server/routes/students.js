// routes/students.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studentController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', ctrl.getAllStudents);
router.get('/:id', ctrl.getStudentById);
router.get('/:id/attendance', ctrl.getStudentAttendance);
router.post('/', authorizeRoles('admin'), upload.single('avatar'), ctrl.createStudent);
router.put('/:id', authorizeRoles('admin'), upload.single('avatar'), ctrl.updateStudent);
router.delete('/:id', authorizeRoles('admin'), ctrl.deleteStudent);

module.exports = router;
