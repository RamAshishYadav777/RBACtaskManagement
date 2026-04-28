const Notification = require('../models/Notification');

class NotificationController {

    // get latest 20 notifications for current user
    getNotifications = async (req, res) => {
        try {
            const notifications = await Notification.find({ recipient: req.user._id })
                .sort({ createdAt: -1 })
                .limit(20);
            res.status(200).json({ success: true, data: notifications });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    };

    // mark all as read
    markAsRead = async (req, res) => {
        try {
            await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
            res.status(200).json({ success: true, message: 'Notifications marked as read' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    };

    // internal helper used by task controller — errors won't break the main flow
    create = async (data) => {
        try {
            await Notification.create(data);
        } catch (err) {
            console.error('Notification error:', err);
        }
    }
}

module.exports = new NotificationController();
