const User = require('../models/user.model');
const { validationResult } = require('express-validator');
const Order = require('../models/order.model');
const Service = require('../models/service.model');
const Category = require('../models/category.model');

/**
 * Get dashboard statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalVendors,
            pendingVendors,
            totalOrders,
            revenueStats,
            totalAdmins,
            totalServices,
            activeVendors,
            orderStats
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'vendor' }),
            User.countDocuments({ role: 'vendor', status: 'pending' }),
            Order.countDocuments(),
            Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
            User.countDocuments({ role: 'admin' }),
            Service.countDocuments(),
            User.countDocuments({ role: 'vendor', status: 'active' }),
            Order.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const orderStatusCounts = orderStats.reduce((acc, stat) => {
            acc[`${stat._id}Orders`] = stat.count;
            return acc;
        }, {});

        res.status(200).json({
            totalUsers,
            totalVendors,
            pendingVendors,
            totalOrders,
            totalRevenue: revenueStats[0]?.total || 0,
            totalAdmins,
            totalServices,
            activeVendors,
            ...orderStatusCounts
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({
            message: 'Error retrieving dashboard statistics',
            error
        });
    }
};

/**
 * Get all users with filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role } = req.query;
        const query = role ? { role } : {};

        const [users, totalUsers] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .exec(),
            User.countDocuments(query)
        ]);

        res.status(200).json({
            users,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: parseInt(page),
            totalUsers
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving users' });
    }
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            message: 'User retrieved successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving user',
            error
        });
    }
};

/**
 * Delete user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot delete admin user' });
        }
        await user.remove();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error deleting user',
            error: error instanceof Error ? error : new Error(String(error))
        });
    }
};

/**
 * Get pending vendor applications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPendingVendors = async (req, res) => {
    try {
        const pendingVendors = await User.find({ role: 'vendor', status: 'pending' })
            .select('-password')
            .sort({ createdAt: -1 })
            .exec();

        res.status(200).json(pendingVendors);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving pending vendors' });
    }
};

/**
 * Approve vendor application
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const approveVendor = async (req, res) => {
    try {
        const vendor = await User.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        vendor.status = 'active';
        await vendor.save();

        res.status(200).json({
            message: 'Vendor approved successfully',
            vendor
        });
    } catch (error) {
        res.status(500).json({ message: 'Error approving vendor' });
    }
};

/**
 * Reject vendor application
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const rejectVendor = async (req, res) => {
    try {
        const vendor = await User.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        vendor.status = 'rejected';
        await vendor.save();

        res.status(200).json({
            message: 'Vendor rejected successfully',
            vendor
        });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting vendor' });
    }
};

/**
 * Update user by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response object
 */
const updateUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { name, email, role } = req.body;
    const userId = req.params.id;

    if (role && !['user', 'admin', 'vendor'].includes(role)) {
        return res.status(400).json({ 
            message: 'Invalid role. Must be one of: user, vendor, admin'
        });
    }

    try {
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email is already taken' });
            }
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;

        await user.save();
        res.status(200).json({
            message: 'User updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Order Management
const getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, vendorId, userId, startDate, endDate } = req.query;
        const query = {};

        if (status) query.status = status;
        if (vendorId) query['items.vendorId'] = vendorId;
        if (userId) query.user = userId;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const [orders, totalOrders, statistics] = await Promise.all([
            Order.find(query)
                .populate('user', 'name email')
                .populate('items.serviceId', 'name price')
                .populate('items.categoryId', 'name')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .exec(),
            Order.countDocuments(query),
            Order.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$totalAmount' }
                    }
                }
            ])
        ]);

        res.status(200).json({
            orders,
            totalPages: Math.ceil(totalOrders / limit),
            currentPage: parseInt(page),
            statistics
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving orders' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('items.service', 'name description price');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.status(200).json(order);
    } catch (error) {
        console.error('Error getting order:', error);
        return res.status(500).json({ 
            message: 'Error retrieving order',
            error: error instanceof Error ? error : new Error(String(error))
        });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { 
                new: true,
                runValidators: true 
            }
        )
        .populate('user', 'name email')
        .populate('items.service', 'name description price');

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Error updating order status:', error);
        return res.status(500).json({
            message: 'Error updating order status',
            error: error instanceof Error ? error : new Error(String(error))
        });
    }
};

const getOrderStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const filter = {};

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const totalOrders = await Order.countDocuments(filter);
        const totalRevenue = await Order.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const statusCountsArr = await Order.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusCounts = {};
        for (const entry of statusCountsArr) {
            statusCounts[entry._id] = entry.count;
        }

        return res.status(200).json({
            totalOrders,
            totalAmount: totalRevenue[0]?.total || 0,
            statusCounts
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error getting order statistics',
            error
        });
    }
};

const getServices = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, vendorId, categoryId } = req.query;
        const query = {};

        if (status) query.status = status;
        if (vendorId) query.vendor = vendorId;
        if (categoryId) query.category = categoryId;

        const [services, totalServices] = await Promise.all([
            Service.find(query)
                .populate('vendor', 'name email')
                .populate('category', 'name')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .exec(),
            Service.countDocuments(query)
        ]);

        res.status(200).json({
            services,
            totalPages: Math.ceil(totalServices / limit),
            currentPage: parseInt(page),
            totalServices
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error retrieving services',
            error: error instanceof Error ? error : new Error(String(error))
        });
    }
};

const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate('category', 'name')
            .populate('vendor', 'name email');

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.status(200).json(service);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving service' });
    }
};

const updateServiceStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        service.status = status;
        if (adminNotes) {
            service.adminNotes = adminNotes;
        }
        await service.save();

        res.status(200).json({
            message: 'Service status updated successfully',
            service
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating service status' });
    }
};

const getServiceStatistics = async (req, res) => {
    try {
        const statistics = await Service.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalPrice: { $sum: '$price' },
                    averagePrice: { $avg: '$price' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalServices: { $sum: '$count' },
                    totalValue: { $sum: '$totalPrice' },
                    statuses: { $push: '$$ROOT' }
                }
            }
        ]);

        res.status(200).json(statistics[0] || {
            totalServices: 0,
            totalValue: 0,
            statuses: []
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving service statistics' });
    }
};

module.exports = {
    getDashboardStats,
    getUsers,
    getUserById,
    deleteUser,
    getPendingVendors,
    approveVendor,
    rejectVendor,
    updateUser,
    getOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStatistics,
    getServices,
    getServiceById,
    updateServiceStatus,
    getServiceStatistics
};