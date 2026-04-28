const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

class AuthController {
    generateTokens = (user) => {
        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m'
        });
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d'
        });
        return { accessToken, refreshToken };
    }

    register = async (req, res) => {
        try {
            const { name, email, password, role } = req.body;

            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({ success: false, message: 'User already exists' });
            }

            const userCount = await User.countDocuments();
            let finalRole = (userCount === 0) ? 'Super Admin' : (role || 'Employee');

            const user = await User.create({ name, email, password, role: finalRole });

            return res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }

    login = async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find user and explicitly select password and isActive
            const user = await User.findOne({ email }).select('+password +isActive');

            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const isMatch = await user.comparePassword(password);
            
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            if (!user.isActive) {
                console.log(`Deactivated account attempt: ${email}`);
                return res.status(403).json({ success: false, message: 'Account is deactivated' });
            }

            const { accessToken, refreshToken } = this.generateTokens(user);

            await User.findByIdAndUpdate(user._id, { refreshToken });

            const isProduction = process.env.NODE_ENV === 'production';

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'None' : 'Lax',
                maxAge: 15 * 60 * 1000
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'None' : 'Lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            console.log(`Login successful: ${email}`);

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                }
            });
        } catch (err) {
            console.error('Login error:', err);
            return res.status(500).json({
                success: false,
                message: err.message || 'Internal Server Error'
            });
        }
    }

    refresh = async (req, res) => {
        try {
            const token = req.cookies.refreshToken || req.body.refreshToken;

            if (!token) {
                return res.status(401).json({ success: false, message: 'Refresh token required' });
            }

            const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
            
            // using aggregation to verify user exists
            const users = await User.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(decoded.id) } }
            ]);

            if (users.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid refresh token' });
            }

            const user = await User.findById(users[0]._id).select('+refreshToken');

            if (!user || user.refreshToken !== token) {
                return res.status(401).json({ success: false, message: 'Invalid refresh token' });
            }

            const tokens = this.generateTokens(user);
            user.refreshToken = tokens.refreshToken;
            await user.save();

            const isProduction = process.env.NODE_ENV === 'production';

            res.cookie('accessToken', tokens.accessToken, { 
                httpOnly: true, 
                secure: isProduction,
                sameSite: isProduction ? 'None' : 'Lax',
                maxAge: 15 * 60 * 1000 
            });
            
            res.cookie('refreshToken', tokens.refreshToken, { 
                httpOnly: true, 
                secure: isProduction,
                sameSite: isProduction ? 'None' : 'Lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 
            });

            return res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken
                }
            });
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Token expired or invalid'
            });
        }
    }

    logout = async (req, res) => {
        try {
            const token = req.cookies.refreshToken;
            if (token) {
                await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: null });
            }

            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            return res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
}

module.exports = new AuthController();
