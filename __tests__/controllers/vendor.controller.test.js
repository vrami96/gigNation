const { mockRequest, mockResponse } = require('../mocks/express.mock');
const User = require('../../src/models/user.model');
const Service = require('../../src/models/service.model');
const Order = require('../../src/models/order.model');
const Category = require('../../src/models/category.model');
const vendorController = require('../../src/controllers/vendor.controller');

jest.mock('../../src/models/user.model');
jest.mock('../../src/models/service.model');
jest.mock('../../src/models/order.model');
jest.mock('../../src/models/category.model');
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('Vendor Controller', () => {
  let req, res;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    req.user = { _id: 'vendor123', role: 'vendor' };
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all vendors with pagination', async () => {
      const mockVendors = [
        { _id: '1', name: 'Vendor 1', role: 'vendor' },
        { _id: '2', name: 'Vendor 2', role: 'vendor' }
      ];

      User.find.mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(2),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockVendors)
      });

      req.query = { page: 1, limit: 10 };

      await vendorController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Vendors retrieved successfully',
        count: 2,
        vendors: mockVendors
      });
    });

    it('should handle errors', async () => {
      User.find.mockReturnValue({
        countDocuments: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await vendorController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving vendors',
        error: expect.any(Error)
      });
    });
  });

  describe('getCategories', () => {
    it('should return vendor categories with pagination', async () => {
      const mockCategories = [
        { _id: '1', name: 'Category 1' },
        { _id: '2', name: 'Category 2' }
      ];

      Service.distinct.mockResolvedValue(mockCategories);

      req.query = { page: 1, limit: 10 };
      req.user = { _id: 'vendorId' };

      await vendorController.getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Categories retrieved successfully',
        count: mockCategories.length,
        categories: mockCategories
      });
    });

    it('should handle errors', async () => {
      Service.distinct.mockRejectedValue(new Error('Database error'));

      await vendorController.getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving categories',
        error: expect.any(Error)
      });
    });
  });

  describe('getDashboard', () => {
    it('should return vendor dashboard statistics', async () => {
      const mockStats = {
        totalOrders: 10,
        totalRevenue: 1000,
        averageOrderValue: 100,
        statusDistribution: {
          pending: 2,
          confirmed: 3,
          completed: 5
        }
      };

      Order.aggregate.mockResolvedValue([mockStats]);

      await vendorController.getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Dashboard statistics retrieved successfully',
        statistics: mockStats
      });
    });

    it('should handle empty statistics', async () => {
      Order.aggregate.mockResolvedValue([]);

      await vendorController.getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Dashboard statistics retrieved successfully',
        statistics: {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          statusDistribution: {
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0
          }
        }
      });
    });

    it('should handle database errors', async () => {
      Order.aggregate.mockRejectedValue(new Error('Database error'));

      await vendorController.getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving dashboard statistics',
        error: expect.any(Error)
      });
    });
  });

  describe('getOrders', () => {
    const mockOrders = [
      {
        _id: 'order1',
        status: 'pending',
        totalAmount: 100,
        items: [{ service: 'service1', quantity: 1 }]
      },
      {
        _id: 'order2',
        status: 'completed',
        totalAmount: 200,
        items: [{ service: 'service2', quantity: 2 }]
      }
    ];

    it('should return vendor orders with pagination', async () => {
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockOrders)
      });

      Order.countDocuments.mockResolvedValue(2);

      req.query = { page: 1, limit: 10 };

      await vendorController.getOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Orders retrieved successfully',
        orders: mockOrders,
        currentPage: 1,
        totalPages: 1,
        totalOrders: 2
      });
    });

    it('should filter orders by status', async () => {
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockOrders[0]])
      });

      Order.countDocuments.mockResolvedValue(1);

      req.query = { page: 1, limit: 10, status: 'pending' };

      await vendorController.getOrders(req, res);

      expect(Order.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Orders retrieved successfully',
        orders: [mockOrders[0]],
        currentPage: 1,
        totalPages: 1,
        totalOrders: 1
      });
    });

    it('should handle database errors', async () => {
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await vendorController.getOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving orders',
        error: expect.any(Error)
      });
    });
  });

  describe('updateOrderItemStatus', () => {
    const mockOrder = {
      _id: 'order1',
      items: [
        {
          _id: 'item1',
          service: { vendor: 'vendor123' },
          status: 'pending'
        }
      ],
      save: jest.fn()
    };

    it('should update order item status successfully', async () => {
      Order.findById.mockResolvedValue(mockOrder);
      mockOrder.save.mockResolvedValue(mockOrder);

      req.params = { orderId: 'order1', itemId: 'item1' };
      req.body = { status: 'completed' };

      await vendorController.updateOrderItemStatus(req, res);

      expect(mockOrder.items[0].status).toBe('completed');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Order item status updated successfully',
        order: mockOrder
      });
    });

    it('should return 404 if order not found', async () => {
      Order.findById.mockResolvedValue(null);

      req.params = { orderId: 'nonexistent', itemId: 'item1' };
      req.body = { status: 'completed' };

      await vendorController.updateOrderItemStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Order not found'
      });
    });

    it('should return 404 if item not found in order', async () => {
      Order.findById.mockResolvedValue(mockOrder);

      req.params = { orderId: 'order1', itemId: 'nonexistent' };
      req.body = { status: 'completed' };

      await vendorController.updateOrderItemStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Order item not found'
      });
    });

    it('should return 403 if vendor not authorized', async () => {
      const unauthorizedOrder = {
        ...mockOrder,
        items: [{
          ...mockOrder.items[0],
          service: { vendor: 'different_vendor' }
        }]
      };

      Order.findById.mockResolvedValue(unauthorizedOrder);

      req.params = { orderId: 'order1', itemId: 'item1' };
      req.body = { status: 'completed' };

      await vendorController.updateOrderItemStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not authorized to update this order item'
      });
    });

    it('should handle invalid status', async () => {
      Order.findById.mockResolvedValue(mockOrder);

      req.params = { orderId: 'order1', itemId: 'item1' };
      req.body = { status: 'invalid_status' };

      await vendorController.updateOrderItemStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid status'
      });
    });

    it('should handle database errors', async () => {
      Order.findById.mockRejectedValue(new Error('Database error'));

      req.params = { orderId: 'order1', itemId: 'item1' };
      req.body = { status: 'completed' };

      await vendorController.updateOrderItemStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error updating order item status',
        error: expect.any(Error)
      });
    });
  });

  describe('getOrderStatistics', () => {
    it('should return order statistics', async () => {
      const mockStats = {
        totalOrders: 10,
        totalRevenue: 1000,
        averageOrderValue: 100,
        statusDistribution: {
          pending: 2,
          confirmed: 3,
          completed: 5
        },
        dailyStats: [
          { date: '2024-01-01', orders: 2, revenue: 200 }
        ]
      };

      Order.aggregate.mockResolvedValue([
        {
          totalOrders: mockStats.totalOrders,
          totalRevenue: mockStats.totalRevenue,
          averageOrderValue: mockStats.averageOrderValue,
          statusDistribution: mockStats.statusDistribution,
          dailyStats: mockStats.dailyStats
        }
      ]);

      req.query = { startDate: '2024-01-01', endDate: '2024-01-31' };
      req.user = { _id: 'vendorId' };

      await vendorController.getOrderStatistics(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Order statistics retrieved successfully',
        statistics: mockStats
      });
    });

    it('should handle errors', async () => {
      Order.aggregate.mockRejectedValue(new Error('Database error'));

      await vendorController.getOrderStatistics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving order statistics',
        error: expect.any(Error)
      });
    });
  });

  describe('getProfile', () => {
    it('should return vendor profile successfully', async () => {
      const mockVendor = {
        _id: 'vendor123',
        name: 'Test Vendor',
        email: 'test@vendor.com',
        vendorInfo: {
          businessName: 'Test Business',
          businessAddress: 'Test Address'
        }
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockVendor)
      });

      await vendorController.getProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith(req.user._id);
      expect(res.json).toHaveBeenCalledWith({ vendor: mockVendor });
    });

    it('should return 404 if vendor not found', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await vendorController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Vendor profile not found' });
    });

    it('should handle database errors', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await vendorController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching vendor profile',
        error: expect.any(String)
      });
    });
  });

  describe('updateProfile', () => {
    it('should update vendor profile successfully', async () => {
      const { validationResult } = require('express-validator');
      validationResult.mockReturnValue({ isEmpty: () => true });

      const mockVendor = {
        _id: 'vendor123',
        vendorInfo: {
          businessName: 'Old Business',
          businessAddress: 'Old Address'
        },
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockVendor);

      req.body = {
        businessName: 'New Business',
        businessAddress: 'New Address'
      };

      await vendorController.updateProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith(req.user._id);
      expect(mockVendor.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Vendor profile updated successfully',
        vendor: mockVendor
      });
    });

    it('should return 404 if vendor not found', async () => {
      const { validationResult } = require('express-validator');
      validationResult.mockReturnValue({ isEmpty: () => true });

      User.findById.mockResolvedValue(null);

      await vendorController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Vendor profile not found' });
    });

    it('should handle validation errors', async () => {
      const mockErrors = {
        array: () => [{ msg: 'Invalid business name' }]
      };

      const { validationResult } = require('express-validator');
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => mockErrors.array() });

      req.body = {
        businessName: 'Invalid Business Name'
      };

      await vendorController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: mockErrors.array() });
    });
  });

  describe('getById', () => {
    it('should return vendor by ID successfully', async () => {
      const mockVendor = {
        _id: 'vendor123',
        name: 'Test Vendor',
        email: 'test@vendor.com',
        vendorInfo: {
          businessName: 'Test Business'
        }
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockVendor)
      });

      req.params = { id: 'vendor123' };

      await vendorController.getById(req, res);

      expect(User.findOne).toHaveBeenCalledWith(
        { _id: 'vendor123', role: 'vendor' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Vendor retrieved successfully',
        vendor: mockVendor
      });
    });

    it('should return 404 if vendor not found', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null)
      });

      req.params = { id: 'nonexistent' };

      await vendorController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Vendor not found' });
    });

    it('should handle database errors', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      req.params = { id: 'vendor123' };

      await vendorController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error retrieving vendor' });
    });
  });
}); 