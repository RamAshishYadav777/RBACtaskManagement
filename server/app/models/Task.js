const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Task description is required']
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed'],
        default: 'Pending'
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required']
    },
// stored file metadata
    attachments: [{
        filename: String,
        path: String,
        mimetype: String
    }],
// tracks task delegation
    assignmentChain: [{
        userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name:       { type: String },
        role:       { type: String },
        assignedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
