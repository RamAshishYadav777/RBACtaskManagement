const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
    
    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        return res.status(400).json({
            success: false,
            message: errorMessage
        });
    }
    
    req.body = value;
    next();
};

module.exports = validate;
