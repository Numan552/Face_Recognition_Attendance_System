// routes/face.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/faceController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);
router.get('/descriptors', ctrl.getAllDescriptors);
router.post('/register', upload.single('face_image'), ctrl.registerFace);
router.delete('/:student_id', authorizeRoles('admin'), ctrl.deleteFaceData);

module.exports = router;
