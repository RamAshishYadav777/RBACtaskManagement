// global error handler — must be registered last in app.js
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    console.error(err.stack);

    // invalid ObjectId
    if (err.name === 'CastError') {
        return res.status(404).json({ success: false, message: `Resource not found with id of ${err.value}` });
    }

    // duplicate field (e.g. email)
    if (err.code === 11000) {
        return res.status(400).json({ success: false, message: 'Duplicate field value entered' });
    }

    // mongoose schema validation
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ success: false, message });
    }

    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Server Error' });
};

module.exports = errorHandler;
