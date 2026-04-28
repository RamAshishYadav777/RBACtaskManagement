const jwt = require('jsonwebtoken');
const User = require('../models/User');

// verify JWT from cookie or Authorization header
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }


        if (!req.user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
    }
};

// role-based access control — usage: authorize('Admin', 'Manager')
const authorize = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user.role.toLowerCase();
        const authorizedRoles = roles.map(r => r.toLowerCase());

        if (!authorizedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
