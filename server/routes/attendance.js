// routes/attendance.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.use(authenticate);
router.get('/dashboard-stats', authorizeRoles('admin'), ctrl.getDashboardStats);
router.get('/report', ctrl.getReport);
router.get('/sessions', ctrl.getSessions);
router.post('/sessions', authorizeRoles('teacher', 'admin'), ctrl.startSession);
router.put('/sessions/:id/end', authorizeRoles('teacher', 'admin'), ctrl.endSession);
router.get('/sessions/:id/records', ctrl.getSessionRecords);
router.post('/mark', authorizeRoles('teacher', 'admin'), ctrl.markAttendance);
router.post('/mark-batch', authorizeRoles('teacher', 'admin'), ctrl.markBatchAttendance);

module.exports = router;
