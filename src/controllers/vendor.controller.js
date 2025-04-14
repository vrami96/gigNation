const User = require('../models/user.model');
const Category = require('../models/category.model');
const { validationResult } = require('express-validator');
const Order = require('../models/order.model');
const Service = require('../models/service.model');

const vendorController = {
  // Get all vendors with pagination
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const query = User.find({ role: 'vendor' });
      const count = await query.countDocuments();

      const vendors = await query
        .select('_id name role')
        .skip(skip)
        .limit(parseInt(limit))
        .exec();

      res.status(200).json({
        message: 'Vendors retrieved successfully',
        count,
        vendors
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error retrieving vendors',
        error
      });
    }
  },

  // Get vendor categories
  getCategories: async (req, res) => {
    try {
      const categories = await Service.distinct('category', { vendor: req.user._id });

      res.status(200).json({
        message: 'Categories retrieved successfully',
        count: categories.length,
        categories
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error retrieving categories',
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  },

  // Get vendor dashboard statistics
  getDashboard: async (req, res) => {
    try {
      const vendorId = req.user._id;
      const stats = await Order.aggregate([
        { $match: { 'items.vendor': vendorId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            averageOrderValue: { $avg: '$totalAmount' }
          }
        },
        {
          $project: {
            _id: 0,
            totalOrders: 1,
            totalRevenue: 1,
            averageOrderValue: 1,
            statusDistribution: {
              pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
              confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
              completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
              cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
            }
          }
        }
      ]);

      const defaultStats = {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusDistribution: {
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0
        }
      };

      res.status(200).json({
        message: 'Dashboard statistics retrieved successfully',
        statistics: stats[0] || defaultStats
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error retrieving dashboard statistics',
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  },

  // Get vendor orders with pagination and filters
  getOrders: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const { status } = req.query;

      const query = { 'items.vendor': req.user._id };
      if (status) {
        query.status = status;
      }

      const orders = await Order.find(query)
        .populate('items.service')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      const totalOrders = await Order.countDocuments(query);
      const totalPages = Math.ceil(totalOrders / limit);

      res.status(200).json({
        message: 'Orders retrieved successfully',
        orders,
        currentPage: page,
        totalPages,
        totalOrders
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error retrieving orders',
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  },

  // Update order item status
  updateOrderItemStatus: async (req, res) => {
    try {
      const { orderId, itemId } = req.params;
      const { status } = req.body;

      if (!['pending', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          message: 'Invalid status'
        });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          message: 'Order not found'
        });
      }

      const item = order.items.find(item => item._id.toString() === itemId);
      if (!item) {
        return res.status(404).json({
          message: 'Order item not found'
        });
      }

      if (item.service.vendor.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'Not authorized to update this order item'
        });
      }

      item.status = status;
      await order.save();

      res.status(200).json({
        message: 'Order item status updated successfully',
        order
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error updating order item status',
        error
      });
    }
  },

  // Get current vendor's profile
  getProfile: async (req, res) => {
    try {
      const vendor = await User.findById(req.user._id)
        .select('-password');
      
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor profile not found' });
      }

      res.json({ vendor });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching vendor profile', error: error.message });
    }
  },

  // Update vendor profile
  updateProfile: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const vendor = await User.findById(req.user._id);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor profile not found' });
      }

      const { businessName, businessAddress, businessPhone, businessDescription, businessCategory } = req.body;
      
      vendor.vendorInfo = {
        ...vendor.vendorInfo,
        businessName: businessName || vendor.vendorInfo.businessName,
        businessAddress: businessAddress || vendor.vendorInfo.businessAddress,
        businessPhone: businessPhone || vendor.vendorInfo.businessPhone,
        businessDescription: businessDescription || vendor.vendorInfo.businessDescription,
        businessCategory: businessCategory || vendor.vendorInfo.businessCategory
      };

      await vendor.save();
      res.json({ message: 'Vendor profile updated successfully', vendor });
    } catch (error) {
      res.status(500).json({ message: 'Error updating vendor profile', error: error.message });
    }
  },

  // Get vendor by ID
  getById: async (req, res) => {
    try {
      const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' })
        .select('-password')
        .populate('vendorInfo');
      
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      res.status(200).json({
        message: 'Vendor retrieved successfully',
        vendor
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error retrieving vendor' });
    }
  },

  // Verify vendor (Admin only)
  verify: async (req, res) => {
    try {
      const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
      
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      vendor.vendorInfo.isVerified = true;
      await vendor.save();

      res.status(200).json({
        message: 'Vendor verified successfully',
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          vendorInfo: vendor.vendorInfo
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error verifying vendor' });
    }
  },

  // Deactivate vendor (Admin only)
  deactivate: async (req, res) => {
    try {
      const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
      
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      vendor.isActive = false;
      await vendor.save();

      res.status(200).json({
        message: 'Vendor deactivated successfully',
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          isActive: vendor.isActive
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deactivating vendor' });
    }
  },

  // Get all vendors
  getAllVendors: async (req, res) => {
    try {
      const vendors = await User.find({ role: 'vendor' })
        .select('-password')
        .populate('vendorInfo');
      res.json({ vendors });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching vendors', error: error.message });
    }
  },

  // Get vendor by ID
  getVendorById: async (req, res) => {
    try {
      const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' })
        .select('-password')
        .populate('vendorInfo');
      
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      res.json({ vendor });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching vendor', error: error.message });
    }
  },

  // Update vendor profile
  updateVendorProfile: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor profile not found' });
      }

      const { businessName, businessType, description, address, phone, website } = req.body;
      
      vendor.vendorInfo = {
        ...vendor.vendorInfo,
        businessName: businessName || vendor.vendorInfo.businessName,
        businessType: businessType || vendor.vendorInfo.businessType,
        description: description || vendor.vendorInfo.description,
        address: address || vendor.vendorInfo.address,
        phone: phone || vendor.vendorInfo.phone,
        website: website || vendor.vendorInfo.website
      };

      await vendor.save();
      res.json({ message: 'Vendor profile updated successfully', vendor });
    } catch (error) {
      res.status(500).json({ message: 'Error updating vendor profile', error: error.message });
    }
  },

  // Verify vendor (admin only)
  verifyVendor: async (req, res) => {
    try {
      const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      vendor.vendorInfo.isVerified = true;
      await vendor.save();
      res.json({ message: 'Vendor verified successfully', vendor });
    } catch (error) {
      res.status(500).json({ message: 'Error verifying vendor', error: error.message });
    }
  },

  // Deactivate vendor (admin only)
  deactivateVendor: async (req, res) => {
    try {
      const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      vendor.isActive = false;
      await vendor.save();
      res.json({ message: 'Vendor deactivated successfully', vendor });
    } catch (error) {
      res.status(500).json({ message: 'Error deactivating vendor', error: error.message });
    }
  },

  // Get vendor's services with pagination and filters
  getServices: async (req, res) => {
    try {
      const { page = 1, limit = 10, category, search } = req.query;
      
      // Build query
      const query = { vendor: req.user.id };
      
      // Add category filter if provided
      if (category) {
        query.category = category;
      }
      
      // Add search filter if provided
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Get services with pagination
      const services = await Service.find(query)
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      // Get total count
      const total = await Service.countDocuments(query);

      res.status(200).json({
        services,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching services', error: error.message });
    }
  },

  /**
   * Add media to an order item
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  addOrderItemMedia: async (req, res) => {
    try {
      const { orderId, itemId } = req.params;
      const { url, type, name, description } = req.body;

      // Validate media type
      const validTypes = ['image', 'video', 'document', 'other'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: 'Invalid media type' });
      }

      // Find the order and ensure it belongs to the vendor
      const order = await Order.findOne({
        orderId,
        'items._id': itemId,
        'items.vendorId': req.user.id
      });

      if (!order) {
        return res.status(404).json({ message: 'Order item not found' });
      }

      // Find the specific item
      const item = order.items.id(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Order item not found' });
      }

      // Add the new media
      item.media.push({
        url,
        type,
        name,
        description,
        uploadedAt: new Date()
      });

      await order.save();

      res.status(200).json({
        message: 'Media added successfully',
        media: item.media[item.media.length - 1]
      });
    } catch (error) {
      res.status(500).json({ message: 'Error adding media', error: error.message });
    }
  },

  /**
   * Remove media from an order item
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  removeOrderItemMedia: async (req, res) => {
    try {
      const { orderId, itemId, mediaId } = req.params;

      // Find the order and ensure it belongs to the vendor
      const order = await Order.findOne({
        orderId,
        'items._id': itemId,
        'items.vendorId': req.user.id
      });

      if (!order) {
        return res.status(404).json({ message: 'Order item not found' });
      }

      // Find the specific item
      const item = order.items.id(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Order item not found' });
      }

      // Remove the media
      item.media = item.media.filter(media => media._id.toString() !== mediaId);

      await order.save();

      res.status(200).json({
        message: 'Media removed successfully'
      });
    } catch (error) {
      res.status(500).json({ message: 'Error removing media', error: error.message });
    }
  },

  // Get order statistics
  getOrderStatistics: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const matchStage = {
        'items.vendor': req.user._id
      };

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      const stats = await Order.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        { $match: { 'items.vendor': req.user._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$items.price' },
            averageOrderValue: { $avg: '$items.price' },
            ordersByStatus: {
              $push: '$items.status'
            },
            dailyStats: {
              $push: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                orders: 1,
                revenue: '$items.price'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalOrders: 1,
            totalRevenue: 1,
            averageOrderValue: 1,
            statusDistribution: {
              pending: {
                $size: {
                  $filter: {
                    input: '$ordersByStatus',
                    as: 'status',
                    cond: { $eq: ['$$status', 'pending'] }
                  }
                }
              },
              confirmed: {
                $size: {
                  $filter: {
                    input: '$ordersByStatus',
                    as: 'status',
                    cond: { $eq: ['$$status', 'confirmed'] }
                  }
                }
              },
              completed: {
                $size: {
                  $filter: {
                    input: '$ordersByStatus',
                    as: 'status',
                    cond: { $eq: ['$$status', 'completed'] }
                  }
                }
              }
            },
            dailyStats: 1
          }
        }
      ]);

      const defaultStats = {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusDistribution: {
          pending: 0,
          confirmed: 0,
          completed: 0
        },
        dailyStats: []
      };

      res.status(200).json({
        message: 'Order statistics retrieved successfully',
        statistics: stats[0] || defaultStats
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error retrieving order statistics',
        error: error
      });
    }
  }
};

module.exports = vendorController;