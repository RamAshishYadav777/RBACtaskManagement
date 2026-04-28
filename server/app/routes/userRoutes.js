const express = require('express');
const { getAllUsers, updateProfile, updateUserRole, updateUserStatus, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorize('Super Admin', 'Admin', 'Manager'), getAllUsers);
router.patch('/profile', updateProfile);
router.patch('/:id/role', authorize('Super Admin'), updateUserRole);

router.patch('/:id/status', authorize('Super Admin', 'Admin'), updateUserStatus);
router.delete('/:id', authorize('Super Admin'), deleteUser);

module.exports = router;
