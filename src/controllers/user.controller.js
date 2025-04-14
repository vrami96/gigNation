const User = require('../models/user.model');
const Category = require('../models/category.model');
const Service = require('../models/service.model');
const Cart = require('../models/cart.model');
const Order = require('../models/order.model');
const { validationResult } = require('express-validator');

/**
 * Get all users (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 10 } = req.query;
        
        // Build query
        const query = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const total = await User.countDocuments(query);
        const pages = Math.ceil(total / limit);

        // Get users with pagination
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            message: 'Users retrieved successfully',
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages
            },
            users
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Error retrieving users', error: error.message });
    }
};

/**
 * Get current user's profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Profile retrieved successfully',
            user
        });
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ message: 'Error retrieving profile', error: error.message });
    }
};

/**
 * Update current user's profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const updates = {};

        if (name) updates.name = name;
        if (email) {
            // Check if email is already taken
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== req.user.id) {
                return res.status(400).json({ message: 'Email is already taken' });
            }
            updates.email = email;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

/**
 * Get user by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User retrieved successfully',
            user
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ message: 'Error retrieving user', error: error.message });
    }
};

/**
 * Update user by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const update = async (req, res) => {
    try {
        const { name, email, role } = req.body;
        const updates = {};

        if (name) updates.name = name;
        if (email) {
            // Check if email is already taken
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== req.params.id) {
                return res.status(400).json({ message: 'Email is already taken' });
            }
            updates.email = email;
        }
        if (role) updates.role = role;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

/**
 * Delete user by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

const listCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, isFavourite } = req.query;
        const query = {};

        if (isFavourite !== undefined) {
            query.isFavourite = isFavourite === 'true';
        }

        const categories = await Category.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Category.countDocuments(query);

        res.status(200).json({
            categories,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalCategories: count
        });
    } catch (error) {
        console.error('Error in listCategories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
};

const listServices = async (req, res) => {
    try {
        const { page = 1, limit = 10, categoryId } = req.query;
        const query = {};

        if (categoryId) {
            query.category = categoryId;
        }

        const services = await Service.find(query)
            .populate('category', 'name description image')
            .populate('vendor', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Service.countDocuments(query);

        res.status(200).json({
            services,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalServices: count
        });
    } catch (error) {
        console.error('Error in listServices:', error);
        res.status(500).json({ message: 'Error fetching services' });
    }
};

const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id })
            .populate('items.serviceId', 'name description image price discount')
            .populate('items.categoryId', 'name');

        if (!cart) {
            return res.status(200).json({
                items: [],
                subtotal: 0,
                totalDiscount: 0,
                totalAmount: 0
            });
        }

        res.status(200).json(cart);
    } catch (error) {
        console.error('Error in getCart:', error);
        res.status(500).json({ message: 'Error fetching cart' });
    }
};

const addToCart = async (req, res) => {
    try {
        const { serviceId, categoryId, quantity } = req.body;

        // Get or create cart
        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            cart = new Cart({ user: req.user.id });
        }

        // Get service details
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Calculate item total
        const itemTotal = service.price * quantity;
        const itemDiscount = (service.price * (service.discount / 100)) * quantity;

        // Add or update item in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.serviceId.toString() === serviceId
        );

        if (existingItemIndex >= 0) {
            cart.items[existingItemIndex].quantity += quantity;
            cart.items[existingItemIndex].total = itemTotal;
            cart.items[existingItemIndex].discount = itemDiscount;
        } else {
            cart.items.push({
                serviceId,
                categoryId,
                quantity,
                price: service.price,
                discount: service.discount,
                total: itemTotal
            });
        }

        // Update cart totals
        cart.subtotal = cart.items.reduce((sum, item) => sum + item.total, 0);
        cart.totalDiscount = cart.items.reduce((sum, item) => sum + item.discount, 0);
        cart.totalAmount = cart.subtotal - cart.totalDiscount;

        await cart.save();

        res.status(200).json({
            message: 'Item added to cart successfully',
            cart
        });
    } catch (error) {
        console.error('Error in addToCart:', error);
        res.status(500).json({ message: 'Error adding item to cart' });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        const { itemId } = req.params;

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(
            item => item._id.toString() === itemId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Get service details
        const service = await Service.findById(cart.items[itemIndex].serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Update item
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].total = service.price * quantity;
        cart.items[itemIndex].discount = (service.price * (service.discount / 100)) * quantity;

        // Update cart totals
        cart.subtotal = cart.items.reduce((sum, item) => sum + item.total, 0);
        cart.totalDiscount = cart.items.reduce((sum, item) => sum + item.discount, 0);
        cart.totalAmount = cart.subtotal - cart.totalDiscount;

        await cart.save();

        res.status(200).json({
            message: 'Cart item updated successfully',
            cart
        });
    } catch (error) {
        console.error('Error in updateCartItem:', error);
        res.status(500).json({ message: 'Error updating cart item' });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(
            item => item._id.toString() !== itemId
        );

        // Update cart totals
        cart.subtotal = cart.items.reduce((sum, item) => sum + item.total, 0);
        cart.totalDiscount = cart.items.reduce((sum, item) => sum + item.discount, 0);
        cart.totalAmount = cart.subtotal - cart.totalDiscount;

        await cart.save();

        res.status(200).json({
            message: 'Item removed from cart successfully',
            cart
        });
    } catch (error) {
        console.error('Error in removeFromCart:', error);
        res.status(500).json({ message: 'Error removing item from cart' });
    }
};

const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = [];
        cart.subtotal = 0;
        cart.totalDiscount = 0;
        cart.totalAmount = 0;

        await cart.save();

        res.status(200).json({
            message: 'Cart cleared successfully',
            cart
        });
    } catch (error) {
        console.error('Error in clearCart:', error);
        res.status(500).json({ message: 'Error clearing cart' });
    }
};

const createOrder = async (req, res) => {
    try {
        const { paymentMethod, notes } = req.body;

        // Get user's cart
        const cart = await Cart.findOne({ user: req.user.id })
            .populate('items.serviceId')
            .populate('items.categoryId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Generate unique order ID
        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Create order items from cart items
        const orderItems = cart.items.map(item => ({
            serviceId: item.serviceId._id,
            categoryId: item.categoryId._id,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            total: item.total
        }));

        // Create new order
        const order = new Order({
            orderId,
            user: req.user.id,
            vendor: cart.items[0].serviceId.vendor,
            items: orderItems,
            subtotal: cart.subtotal,
            totalDiscount: cart.totalDiscount,
            totalAmount: cart.totalAmount,
            paymentMethod,
            notes,
            status: 'pending',
            paymentStatus: 'pending'
        });

        await order.save();

        // Clear the cart after successful order creation
        cart.items = [];
        cart.subtotal = 0;
        cart.totalDiscount = 0;
        cart.totalAmount = 0;
        await cart.save();

        res.status(201).json({
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        console.error('Error in createOrder:', error);
        res.status(500).json({ message: 'Error creating order' });
    }
};

const getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query = { user: req.user.id };

        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('items.serviceId', 'name description image')
            .populate('items.categoryId', 'name')
            .populate('vendor', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Order.countDocuments(query);

        res.status(200).json({
            orders,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalOrders: count
        });
    } catch (error) {
        console.error('Error in getOrders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.id
        })
            .populate('items.serviceId', 'name description image')
            .populate('items.categoryId', 'name')
            .populate('vendor', 'name email');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error('Error in getOrderById:', error);
        res.status(500).json({ message: 'Error fetching order' });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { cancellationReason } = req.body;

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending orders can be cancelled' });
        }

        order.status = 'cancelled';
        order.cancellationReason = cancellationReason;
        await order.save();

        res.status(200).json({
            message: 'Order cancelled successfully',
            order
        });
    } catch (error) {
        console.error('Error in cancelOrder:', error);
        res.status(500).json({ message: 'Error cancelling order' });
    }
};

const userController = {
    getAllUsers,
    getProfile,
    updateProfile,
    getById,
    update,
    delete: deleteUser,
    listCategories,
    listServices,
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    createOrder,
    getOrders,
    getOrderById,
    cancelOrder
};

module.exports = userController; 