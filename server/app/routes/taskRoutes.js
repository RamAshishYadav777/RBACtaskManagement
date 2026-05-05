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

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags:
 *       - Tasks
 *     parameters:
 *       - in: body
 *         name: Task data
 *         schema:
 *           type: object
 *           required:
 *             - title
 *             - description
 *             - assignedTo
 *             - dueDate
 *           properties:
 *             title:
 *               type: string
 *             description:
 *               type: string
 *             priority:
 *               type: string
 *               enum: [Low, Medium, High]
 *             assignedTo:
 *               type: string
 *             dueDate:
 *               type: string
 *               format: date
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post('/', authorize('Admin', 'Manager'), upload.array('attachments', 5), validate(createTaskSchema), createTask);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks (filtered by role)
 *     tags:
 *       - Tasks
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 */
router.get('/', getTasks);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags:
 *       - Tasks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 */
router.get('/:id', getTask);

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update task status or details
 *     tags:
 *       - Tasks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *       - in: body
 *         name: Update data
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [Pending, In Progress, Completed]
 *             priority:
 *               type: string
 *               enum: [Low, Medium, High]
 *     responses:
 *       200:
 *         description: Task updated successfully
 */
router.patch('/:id', upload.array('attachments', 5), validate(updateTaskSchema), updateTask);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags:
 *       - Tasks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully
 */
router.delete('/:id', authorize('Admin', 'Manager'), deleteTask);

module.exports = router;
