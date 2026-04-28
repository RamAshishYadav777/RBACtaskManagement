const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../controllers/notificationController');
const moment = require('moment');

const initScheduler = () => {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('Running daily task reminder job...');
        try {
            const todayStart = moment().startOf('day').toDate();
            const todayEnd = moment().endOf('day').toDate();

            // Find tasks due today that are not completed
            const tasksDueToday = await Task.find({
                dueDate: {
                    $gte: todayStart,
                    $lte: todayEnd
                },
                status: { $ne: 'Completed' }
            });

            console.log(`Found ${tasksDueToday.length} tasks due today.`);

            for (const task of tasksDueToday) {
                // Send notification to the assignee
                await Notification.create({
                    recipient: task.assignedTo,
                    sender: task.assignedBy, // System or Assigner
                    title: 'Task Due Today',
                    message: `Reminder: The task "${task.title}" is due today.`,
                    type: 'TASK_REMINDER',
                    relatedId: task._id
                });
            }
        } catch (err) {
            console.error('Error in task reminder job:', err);
        }
    });

    console.log('Task scheduler initialized');
};

module.exports = initScheduler;
