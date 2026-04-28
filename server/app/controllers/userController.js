const User = require('../models/User');
const moment = require('moment');

class UserController {
    formatUser = (user) => {
        const obj = { ...user };
        obj.createdAtFormatted = moment(obj.createdAt).format('MMMM Do YYYY, h:mm a');
        if (obj.updatedAt && obj.createdAt && obj.createdAt.toString() !== obj.updatedAt.toString()) {
            obj.updatedAtFormatted = moment(obj.updatedAt).format('MMMM Do YYYY, h:mm a');
        }
        delete obj.password;
        delete obj.refreshToken;
        delete obj.__v;
        return obj;
    }

    getAllUsers = async (req, res) => {
        console.log(`[Controller] getAllUsers called by ${req.user.role}`);
        try {
            let query = {};
            
            // RBAC Filtering for User List
            if (req.user.role === 'Admin') {
                // Admins see Managers and Employees
                query = { role: { $in: ['Manager', 'Employee'] } };
            } else if (req.user.role === 'Manager') {
                // Managers see Employees (to assign tasks)
                query = { role: 'Employee' };
            }
            // Super Admin sees everyone (default query {})

            const users = await User.find(query).select('-password -refreshToken -__v').sort({ createdAt: -1 });

            const data = users.map(user => this.formatUser(user.toObject()));

            return res.status(200).json({
                success: true,
                message: 'Users retrieved successfully',
                count: users.length,
                data: data
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }

    updateUserRole = async (req, res) => {
        try {
            const { id } = req.params;
            const { role } = req.body;
            
            if (req.user.role === 'Admin' && ['Super Admin', 'Admin'].includes(role)) {
                return res.status(403).json({ success: false, message: 'Admins cannot assign Admin or Super Admin roles' });
            }

            const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
            if (user) {
                return res.status(200).json({
                    success: true,
                    message: 'Role updated successfully',
                    data: this.formatUser(user._doc)
                });
            }
            throw new Error('User not found');
        } catch (err) {
            const status = err.message === 'User not found' ? 404 : 500;
            return res.status(status).json({
                success: false,
                message: err.message
            });
        }
    }

    updateUserStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const { isActive } = req.body;
            
            const targetUser = await User.findById(id);
            if (!targetUser) {
                throw new Error('User not found');
            }

            if (req.user.role === 'Admin' && ['Super Admin', 'Admin'].includes(targetUser.role)) {
                return res.status(403).json({ success: false, message: 'Admins cannot manage accounts of other Admins or Super Admins' });
            }

            targetUser.isActive = isActive;
            await targetUser.save();

            return res.status(200).json({
                success: true,
                message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
                data: this.formatUser(targetUser._doc)
            });
        } catch (err) {
            const status = err.message === 'User not found' ? 404 : 500;
            return res.status(status).json({
                success: false,
                message: err.message
            });
        }
    }

    deleteUser = async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findByIdAndDelete(id);
            if (user) {
                return res.status(200).json({
                    success: true,
                    message: 'User deleted successfully'
                });
            }
            throw new Error('User not found');
        } catch (err) {
            const status = err.message === 'User not found' ? 404 : 500;
            return res.status(status).json({
                success: false,
                message: err.message
            });
        }
    }

    updateProfile = async (req, res) => {
        try {
            const { name } = req.body;
            const user = await User.findByIdAndUpdate(req.user.id, { name }, { new: true, runValidators: true });
            
            return res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: this.formatUser(user._doc)
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
}

module.exports = new UserController();
