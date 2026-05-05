const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications for current user
 *     tags:
 *       - Notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/', notificationController.getNotifications);

/**
 * @swagger
 * /notifications/read:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags:
 *       - Notifications
 *     responses:
 *       200:
 *         description: Notifications marked as read
 */
router.patch('/read', notificationController.markAsRead);

module.exports = router;
