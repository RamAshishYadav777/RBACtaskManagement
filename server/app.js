require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

const dbConnect = require('./app/config/db');
const authRoutes = require('./app/routes/authRoutes');
const userRoutes = require('./app/routes/userRoutes');
const taskRoutes = require('./app/routes/taskRoutes');
const notificationRoutes = require('./app/routes/notificationRoutes');
const errorHandler = require('./app/middleware/errorMiddleware');
const validateApiKey = require('./app/middleware/apiKeyMiddleware');
const setupSwagger = require('./app/config/swagger');
const initScheduler = require('./app/utils/scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// create uploads folder if missing
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// security headers
app.use(helmet());

// allow frontend requests with cookies
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


setupSwagger(app);

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);

// global error handler
app.use(errorHandler);

// start server after DB connects
dbConnect().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        initScheduler();
    });
}).catch(err => {
    console.error('DB connection failed', err);
    process.exit(1);
});

module.exports = app;
