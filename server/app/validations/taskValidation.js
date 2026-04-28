const Joi = require('joi');

const createTaskSchema = Joi.object({
    title: Joi.string().min(3).max(100).required().messages({
        'string.min': 'Title must be at least 3 characters long',
        'any.required': 'Title is required'
    }),
    description: Joi.string().min(10).required().messages({
        'string.min': 'Description must be at least 10 characters long',
        'any.required': 'Description is required'
    }),
    priority: Joi.string().valid('High', 'Medium', 'Low').default('Medium'),
    assignedTo: Joi.string().required().messages({
        'any.required': 'Assignee (User ID) is required'
    }),
    dueDate: Joi.date().greater('now').required().messages({
        'date.greater': 'Due date must be in the future',
        'any.required': 'Due date is required'
    })
});

const updateTaskSchema = Joi.object({
    title: Joi.string().min(3).max(100),
    description: Joi.string().min(10),
    priority: Joi.string().valid('High', 'Medium', 'Low'),
    status: Joi.string().valid('Pending', 'In Progress', 'Completed'),
    assignedTo: Joi.string(),
    dueDate: Joi.date().greater('now')
}).min(1); // At least one field must be present for update

module.exports = {
    createTaskSchema,
    updateTaskSchema
};
