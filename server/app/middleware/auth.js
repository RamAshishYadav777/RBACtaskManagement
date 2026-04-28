const jwt = require('jsonwebtoken');
const User = require('../models/User');

// checks if the user is logged in
const protect = async (req, res, next) => {
    let token;

    // get token from headers or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        // verify token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = await User.findById(decoded.id);
        
        if (!req.user) {
            console.error(`[Auth] User not found for ID: ${decoded.id}`);
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        console.log(`[Auth] User Authenticated: ${req.user.name} (${req.user.role}) | Status: ${req.user.isActive ? 'Active' : 'Inactive'}`);

        // check if account is still active
        if (!req.user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
    }
};

// checks if the user has one of the required roles
const authorize = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user.role.toLowerCase();
        const authorizedRoles = roles.map(role => role.toLowerCase());

        if (!authorizedRoles.includes(userRole)) {
            console.warn(`[Auth] Access Denied for ${req.user.role}. Required: ${roles.join(', ')} | URL: ${req.originalUrl}`);
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
