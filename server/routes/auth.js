// routes/auth.js
const express = require('express');
const router = express.Router();
const { adminLogin, teacherLogin, getMe, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/admin/login', adminLogin);
router.post('/teacher/login', teacherLogin);
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
