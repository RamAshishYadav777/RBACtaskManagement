const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../controllers/notificationController');
const moment = require('moment');

const initScheduler = () => {
    // runs daily at 9 AM — sends reminders for tasks due today
    cron.schedule('0 9 * * *', async () => {
        console.log('Running daily task reminder...');
        try {
            const todayStart = moment().startOf('day').toDate();
            const todayEnd = moment().endOf('day').toDate();

            const tasksDueToday = await Task.find({
                dueDate: { $gte: todayStart, $lte: todayEnd },
                status: { $ne: 'Completed' }
            });

            for (const task of tasksDueToday) {
                await Notification.create({
                    recipient: task.assignedTo,
                    sender: task.assignedBy,
                    title: 'Task Due Today',
                    message: `Reminder: "${task.title}" is due today.`,
                    type: 'TASK_REMINDER',
                    relatedId: task._id
                });
            }
        } catch (err) {
            console.error('Scheduler error:', err);
        }
    });

    console.log('Task scheduler initialized');
};

module.exports = initScheduler;
