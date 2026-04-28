const express = require('express');
const multer = require('multer');
const path = require('path');
const { createTask, getTasks, getTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('../validations/taskValidation');

const router = express.Router();

// file storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images, PDFs, and Word docs are allowed'));
        }
    }
});

router.use(protect);

router.post('/', authorize('Admin', 'Manager'), upload.array('attachments', 5), validate(createTaskSchema), createTask);
router.get('/', getTasks);
router.get('/:id', getTask);
router.patch('/:id', upload.array('attachments', 5), validate(updateTaskSchema), updateTask);
router.delete('/:id', authorize('Admin', 'Manager'), deleteTask);

module.exports = router;
