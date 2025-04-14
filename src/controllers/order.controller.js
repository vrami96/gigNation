const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Service = require('../models/service.model');

const orderController = {
  create: async (req, res) => {
    try {
      const cart = await Cart.findOne({ user: req.user._id });
      
      if (!cart || !cart.items.length) {
        return res.status(400).json({ message: 'Cart is empty' });
      }

      // Populate cart items with service details
      const populatedCart = await cart.populate('items.service');

      // Validate all services exist and are available
      for (const item of populatedCart.items) {
        const service = await Service.findById(item.service._id);
        if (!service || !service.availability) {
          return res.status(400).json({ message: 'One or more services are not available' });
        }
      }

      const order = new Order({
        user: req.user._id,
        items: populatedCart.items.map(item => ({
          service: item.service._id,
          quantity: item.quantity,
          price: item.service.price
        })),
        totalAmount: populatedCart.totalAmount,
        status: 'pending'
      });

      const savedOrder = await order.save();
      await Cart.findOneAndDelete({ user: req.user._id });

      res.status(201).json({ 
        message: 'Order created successfully', 
        order: savedOrder
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Error creating order', error });
    }
  },

  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const query = { user: req.user._id };
      
      if (status) {
        query.status = status;
      }

      const totalOrders = await Order.countDocuments(query);
      const totalPages = Math.ceil(totalOrders / limit);
      const skip = (page - 1) * limit;

      const orders = await Order.find(query)
        .populate('items.service', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      res.status(200).json({
        orders,
        currentPage: parseInt(page),
        totalPages,
        totalOrders
      });
    } catch (error) {
      console.error('Error retrieving orders:', error);
      res.status(500).json({ message: 'Error retrieving orders', error });
    }
  },

  getById: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id).populate('items.service');
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }

      res.status(200).json(order);
    } catch (error) {
      console.error('Error retrieving order:', error);
      res.status(500).json({ message: 'Error retrieving order', error });
    }
  },

  cancel: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to cancel this order' });
      }

      if (order.status === 'completed') {
        return res.status(400).json({ message: 'Order cannot be cancelled' });
      }

      order.status = 'cancelled';
      await order.save();

      res.status(200).json({ message: 'Order cancelled successfully', order });
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ message: 'Error cancelling order', error });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this order' });
      }

      if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      order.status = status;
      await order.save();

      res.status(200).json({ message: 'Order status updated successfully', order });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Error updating order status', error });
    }
  },

  getStatistics: async (req, res) => {
    try {
      const stats = await Order.aggregate([
        { $match: { user: req.user._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            averageOrderValue: { $avg: '$totalAmount' },
            statusDistribution: {
              $push: '$status'
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
                    input: '$statusDistribution',
                    as: 'status',
                    cond: { $eq: ['$$status', 'pending'] }
                  }
                }
              },
              completed: {
                $size: {
                  $filter: {
                    input: '$statusDistribution',
                    as: 'status',
                    cond: { $eq: ['$$status', 'completed'] }
                  }
                }
              },
              cancelled: {
                $size: {
                  $filter: {
                    input: '$statusDistribution',
                    as: 'status',
                    cond: { $eq: ['$$status', 'cancelled'] }
                  }
                }
              }
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
          completed: 0,
          cancelled: 0
        }
      };

      res.status(200).json(stats[0] || defaultStats);
    } catch (error) {
      console.error('Error getting statistics:', error);
      res.status(500).json({ message: 'Error retrieving order statistics', error });
    }
  }
};

module.exports = orderController; 