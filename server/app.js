require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const morgan = require('morgan');

const dbConnect = require('./app/config/db');

const authRoutes = require('./app/routes/authRoutes');
const userRoutes = require('./app/routes/userRoutes');
const taskRoutes = require('./app/routes/taskRoutes');
const notificationRoutes = require('./app/routes/notificationRoutes');
const errorHandler = require('./app/middleware/errorMiddleware');

const validateApiKey = require('./app/middleware/apiKeyMiddleware');
const setupSwagger = require('./app/config/swagger');

const app = express();
const PORT = process.env.PORT || 5000;

// make sure uploads folder exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// security and parsing
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// custom security middleware
// app.use(validateApiKey);


// api documentation
setupSwagger(app);



// api routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);

// error handling
app.use(errorHandler);

// start everything
dbConnect().then(() => {

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to database', err);
    process.exit(1);
});

module.exports = app;
