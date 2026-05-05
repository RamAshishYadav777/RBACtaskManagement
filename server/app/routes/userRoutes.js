const express = require('express');
const { getAllUsers, updateProfile, updateUserRole, updateUserStatus, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/', authorize('Super Admin', 'Admin', 'Manager'), getAllUsers);

/**
 * @swagger
 * /users/profile:
 *   patch:
 *     summary: Update current user profile
 *     tags:
 *       - Users
 *     parameters:
 *       - in: body
 *         name: Profile update
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch('/profile', updateProfile);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *       - in: body
 *         name: Role update
 *         schema:
 *           type: object
 *           properties:
 *             role:
 *               type: string
 *               enum: [Admin, Manager, Employee]
 *     responses:
 *       200:
 *         description: Role updated successfully
 */
router.patch('/:id/role', authorize('Super Admin'), updateUserRole);

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *       - in: body
 *         name: Status update
 *         schema:
 *           type: object
 *           properties:
 *             isActive:
 *               type: boolean
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/:id/status', authorize('Super Admin', 'Admin'), updateUserStatus);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/:id', authorize('Super Admin'), deleteUser);

module.exports = router;
