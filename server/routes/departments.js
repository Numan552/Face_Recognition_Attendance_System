// routes/departments.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/departmentController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAllDepartments);
router.post('/', authorizeRoles('admin'), ctrl.createDepartment);
router.put('/:id', authorizeRoles('admin'), ctrl.updateDepartment);
router.delete('/:id', authorizeRoles('admin'), ctrl.deleteDepartment);

module.exports = router;
