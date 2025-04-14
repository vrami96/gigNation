const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const vendorRoutes = require('./vendor.routes');
const adminRoutes = require('./admin.routes');
const healthRoutes = require('./health.routes');
const categoryRoutes = require('./category.routes');
const serviceRoutes = require('./service.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vendors', vendorRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/category', categoryRoutes);
router.use('/vendors/services', serviceRoutes);
router.use('/health', healthRoutes);

module.exports = router;
