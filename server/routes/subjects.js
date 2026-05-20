// routes/subjects.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subjectController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAllSubjects);
router.post('/', authorizeRoles('admin'), ctrl.createSubject);
router.put('/:id', authorizeRoles('admin'), ctrl.updateSubject);
router.delete('/:id', authorizeRoles('admin'), ctrl.deleteSubject);

module.exports = router;
