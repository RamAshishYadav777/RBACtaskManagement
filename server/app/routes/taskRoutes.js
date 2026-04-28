const express = require('express');
const multer = require('multer');
const path = require('path');
const { createTask, getTasks, getTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('../validations/taskValidation');

const router = express.Router();

// save files to disk with timestamp prefix
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|pdf|doc|docx/;
        const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
        ok ? cb(null, true) : cb(new Error('Only images, PDFs, and Word docs are allowed'));
    }
});

// all routes need a valid JWT
router.use(protect);

router.post('/', authorize('Admin', 'Manager'), upload.array('attachments', 5), validate(createTaskSchema), createTask);
router.get('/', getTasks);
router.get('/:id', getTask);
router.patch('/:id', upload.array('attachments', 5), validate(updateTaskSchema), updateTask);
router.delete('/:id', authorize('Admin', 'Manager'), deleteTask);

module.exports = router;
