// routes/teachers.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/teacherController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);
router.get('/', ctrl.getAllTeachers);
router.get('/:id', ctrl.getTeacherById);
router.get('/:id/subjects', ctrl.getTeacherSubjects);
router.post('/', authorizeRoles('admin'), upload.single('avatar'), ctrl.createTeacher);
router.put('/:id', authorizeRoles('admin'), upload.single('avatar'), ctrl.updateTeacher);
router.delete('/:id', authorizeRoles('admin'), ctrl.deleteTeacher);

module.exports = router;
