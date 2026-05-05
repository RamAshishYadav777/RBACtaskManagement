const Task = require('../models/Task');
const User = require('../models/User');
const moment = require('moment');
const mongoose = require('mongoose');
const Notification = require('../controllers/notificationController');
const fs = require('fs');
const path = require('path');

// delete physical files
const deleteFiles = (attachments = []) => {
    for (const file of attachments) {
        try {
            const filePath = path.resolve(file.path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error(`[FileCleanup] Failed to delete ${file.path}:`, err.message);
        }
    }
};

class TaskController {
    formatTask = (task) => {
        const obj = { ...task };
        obj.createdAtFormatted = moment(obj.createdAt).format('MMMM Do YYYY, h:mm a');
        obj.dueDateFormatted = moment(obj.dueDate).format('MMMM Do YYYY');
        if (obj.updatedAt && obj.createdAt && obj.createdAt.toString() !== obj.updatedAt.toString()) {
            obj.updatedAtFormatted = moment(obj.updatedAt).format('MMMM Do YYYY, h:mm a');
        }
        delete obj.__v;
        return obj;
    }

// fetch populated task
    // refresh task data
    getPopulatedTask = async (taskId) => {
        const results = await Task.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(taskId) } },
            { $lookup: { from: 'users', localField: 'assignedBy', foreignField: '_id', as: 'assignedBy' } },
            { $lookup: { from: 'users', localField: 'assignedTo', foreignField: '_id', as: 'assignedTo' } },
            { $unwind: '$assignedBy' },
            { $unwind: '$assignedTo' },
            { $project: { 'assignedBy.password': 0, 'assignedBy.refreshToken': 0, 'assignedTo.password': 0, 'assignedTo.refreshToken': 0, __v: 0 } }
        ]);
        return results.length ? this.formatTask(results[0]) : null;
    }

    createTask = async (req, res) => {
        try {
            const { title, description, priority, assignedTo, dueDate } = req.body;

            const assignee = await User.findById(assignedTo);
            if (!assignee) {
                return res.status(404).json({ success: false, message: 'Assignee not found' });
            }

            // RBAC Assignment Rules:
            // Super Admin: Any
// admin assigns managers
// manager assigns employees
            if (req.user.role === 'Admin' && assignee.role !== 'Manager') {
                return res.status(403).json({ success: false, message: 'Admins can only assign tasks to Managers (assign through managers)' });
            }
            if (req.user.role === 'Manager' && assignee.role !== 'Employee') {
                return res.status(403).json({ success: false, message: 'Managers can only assign tasks to Employees' });
            }
            if (req.user.role === 'Employee' || req.user.role === 'Super Admin') {
                return res.status(403).json({ success: false, message: `${req.user.role}s cannot create or assign tasks` });
            }



            const taskData = {
                title,
                description,
                priority,
                assignedBy: req.user._id,
                assignedTo,
                dueDate,
                assignmentChain: [
                    { userId: req.user._id, name: req.user.name, role: req.user.role, assignedAt: new Date() },
                    { userId: assignee._id, name: assignee.name, role: assignee.role, assignedAt: new Date() }
                ]
            };

            if (req.files) {
                taskData.attachments = req.files.map(file => ({
                    filename: file.originalname,
                    path: file.path,
                    mimetype: file.mimetype
                }));
            }

            const task = await Task.create(taskData);

// notify the employee
            await Notification.create({
                recipient: assignedTo,
                sender: req.user._id,
                title: 'New Task Assigned',
                message: `You have been assigned a new task: ${title}`,
                type: 'TASK_ASSIGNED',
                relatedId: task._id
            });

// return populated task
            const populated = await this.getPopulatedTask(task._id);
            return res.status(201).json({
                success: true,
                message: 'Task created successfully',
                data: populated
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }

    getTasks = async (req, res) => {
        try {
            let matchStage = {};
            
            if (req.user.role === 'Admin') {
// admins see all
// show admin tasks
                matchStage = {}; 
            } else if (req.user.role === 'Manager') {
// show manager tasks
                matchStage = {
                    $or: [
                        { assignedBy: new mongoose.Types.ObjectId(req.user._id) },
                        { assignedTo: new mongoose.Types.ObjectId(req.user._id) }
                    ]
                };
            } else if (req.user.role === 'Employee') {
                matchStage = { assignedTo: new mongoose.Types.ObjectId(req.user._id) };
            }

            const tasks = await Task.aggregate([
                { $match: matchStage },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'assignedBy',
                        foreignField: '_id',
                        as: 'assignedBy'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'assignedTo',
                        foreignField: '_id',
                        as: 'assignedTo'
                    }
                },
                { $unwind: '$assignedBy' },
                { $unwind: '$assignedTo' },
                {
                    $project: {
                        'assignedBy.password': 0,
                        'assignedBy.refreshToken': 0,
                        'assignedBy.__v': 0,
                        'assignedTo.password': 0,
                        'assignedTo.refreshToken': 0,
                        'assignedTo.__v': 0,
                        __v: 0
                    }
                },
                { $sort: { createdAt: -1 } }
            ]);

            const data = tasks.map(task => this.formatTask(task));
            
            return res.status(200).json({
                success: true,
                message: 'Tasks retrieved successfully',
                count: tasks.length,
                data: data
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }

    getTask = async (req, res) => {
        try {
            const tasks = await Task.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'assignedBy',
                        foreignField: '_id',
                        as: 'assignedBy'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'assignedTo',
                        foreignField: '_id',
                        as: 'assignedTo'
                    }
                },
                { $unwind: '$assignedBy' },
                { $unwind: '$assignedTo' },
                {
                    $project: {
                        'assignedBy.password': 0,
                        'assignedBy.refreshToken': 0,
                        'assignedBy.__v': 0,
                        'assignedTo.password': 0,
                        'assignedTo.refreshToken': 0,
                        'assignedTo.__v': 0,
                        __v: 0
                    }
                }
            ]);

            if (tasks.length === 0) {
                throw new Error('Task not found');
            }

            const task = tasks[0];

            if (req.user.role === 'Employee' && task.assignedTo._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized to view this task' });
            }

            return res.status(200).json({
                success: true,
                message: 'Task retrieved successfully',
                data: this.formatTask(task)
            });
        } catch (err) {
            const status = err.message === 'Task not found' ? 404 : 500;
            return res.status(status).json({
                success: false,
                message: err.message
            });
        }
    }

    updateTask = async (req, res) => {
        try {
            const { id } = req.params;
            let task = await Task.findById(id);

            if (!task) {
                throw new Error('Task not found');
            }

// capture old status
            const oldStatus = task.status;

            if (req.user.role === 'Employee') {
                if (task.assignedTo.toString() !== req.user._id.toString()) {
                    return res.status(403).json({ success: false, message: 'Not authorized' });
                }
                const { status } = req.body;
                task.status = status;
            } else if (req.user.role === 'Manager') {
// manager update logic
                const isAssigner = task.assignedBy.toString() === req.user._id.toString();
                const isAssignee = task.assignedTo.toString() === req.user._id.toString();
                
                if (!isAssigner && !isAssignee) {
                    return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
                }

// manager assignment rule
                if (req.body.assignedTo) {
                    const assignee = await User.findById(req.body.assignedTo);
                    if (assignee && assignee.role !== 'Employee') {
                        return res.status(403).json({ success: false, message: 'Managers can only assign tasks to Employees' });
                    }
                }

// manager reassigns task
                // take task ownership
                // set new roles
                if (isAssignee && req.body.assignedTo && req.body.assignedTo.toString() !== req.user._id.toString()) {
                    task.assignedBy = req.user._id;

// extend assignment chain
                    const newAssignee = await User.findById(req.body.assignedTo);
                    if (newAssignee) {
                        if (!task.assignmentChain) task.assignmentChain = [];
                        task.assignmentChain.push({
                            userId: newAssignee._id,
                            name: newAssignee.name,
                            role: newAssignee.role,
                            assignedAt: new Date()
                        });
                    }
                }

// prevent field overwrite
                const { assignedBy: _ab, assignmentChain: _ac, ...safeBody } = req.body;
                Object.assign(task, safeBody);
            } else if (req.user.role === 'Admin') {
// admin assignment rule
                if (req.body.assignedTo) {
                    const assignee = await User.findById(req.body.assignedTo);
                    if (assignee && assignee.role !== 'Manager') {
                        return res.status(403).json({ success: false, message: 'Admins can only assign tasks to Managers' });
                    }
                }
                Object.assign(task, req.body);
            } else {
// other user roles
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            if (req.files && req.files.length > 0) {
                const newAttachments = req.files.map(file => ({
                    filename: file.originalname,
                    path: file.path,
                    mimetype: file.mimetype
                }));
                task.attachments = [...task.attachments, ...newAttachments];
            }

            await task.save();

// notify completion now
            if (task.status === 'Completed' && oldStatus !== 'Completed') {
// notify the assigner
                await Notification.create({
                    recipient: task.assignedBy,
                    sender: req.user._id,
                    title: 'Task Completed',
                    message: `Task "${task.title}" has been marked as completed by ${req.user.name}`,
                    type: 'TASK_COMPLETED',
                    relatedId: task._id
                });

// notify super admins
                const superAdmins = await User.find({ role: 'Super Admin' });
                for (const sa of superAdmins) {
                    if (sa._id.toString() !== task.assignedBy.toString()) { // avoid double notification
                        await Notification.create({
                            recipient: sa._id,
                            sender: req.user._id,
                            title: 'Task Completed',
                            message: `Task "${task.title}" has been completed`,
                            type: 'TASK_COMPLETED',
                            relatedId: task._id
                        });
                    }
                }
            }

            const populated = await this.getPopulatedTask(task._id);
            return res.status(200).json({
                success: true,
                message: 'Task updated successfully',
                data: populated
            });
        } catch (err) {
            const status = err.message === 'Task not found' ? 404 : 500;
            return res.status(status).json({
                success: false,
                message: err.message
            });
        }
    }

    deleteTask = async (req, res) => {
        try {
            const { id } = req.params;
            let task = await Task.findById(id);

            if (!task) {
                throw new Error('Task not found');
            }

            if (req.user.role === 'Employee') {
                return res.status(403).json({ success: false, message: 'Employees are not authorized to delete tasks' });
            }

            if (req.user.role === 'Manager' && task.assignedBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Managers can only delete tasks they created' });
            }

// delete attachment files
            if (task.attachments && task.attachments.length > 0) {
                deleteFiles(task.attachments);
            }

            await task.deleteOne();
            return res.status(200).json({
                success: true,
                message: 'Task deleted successfully'
            });
        } catch (err) {
            const status = err.message === 'Task not found' ? 404 : 500;
            return res.status(status).json({
                success: false,
                message: err.message
            });
        }
    }
}

module.exports = new TaskController();
