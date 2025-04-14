const { mockRequest, mockResponse } = require('../mocks/express.mock');
const { validationResult } = require('express-validator');
const Order = require('../../src/models/order.model');
const Cart = require('../../src/models/cart.model');
const Service = require('../../src/models/service.model');
const orderController = require('../../src/controllers/order.controller');

// Mock the models and validation
jest.mock('../../src/models/order.model');
jest.mock('../../src/models/cart.model');
jest.mock('../../src/models/service.model');
jest.mock('express-validator');

describe('Order Controller', () => {
  let req, res;
  
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
    
    // Default validation result
    validationResult.mockImplementation(() => ({
      isEmpty: () => true,
      array: () => []
    }));
  });

  describe('create', () => {
    const mockService = {
      _id: 'service123',
      name: 'Test Service',
      price: 100,
      availability: true
    };

    const mockCart = {
      items: [
        {
          service: mockService,
          quantity: 2
        }
      ],
      totalAmount: 200,
      populate: jest.fn().mockResolvedValue({
        items: [
          {
            service: mockService,
            quantity: 2
          }
        ],
        totalAmount: 200
      })
    };

    it('should create a new order from cart items', async () => {
      req.user = { _id: 'user123' };
      Cart.findOne.mockResolvedValue(mockCart);
      Service.findById.mockResolvedValue(mockService);
      
      const savedOrder = {
        _id: 'order123',
        items: [{
          service: mockService._id,
          quantity: 2,
          price: mockService.price
        }],
        totalAmount: 200,
        user: 'user123'
      };
      
      Order.prototype.save.mockResolvedValue(savedOrder);

      await orderController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Order created successfully',
        order: savedOrder
      });
    });

    it('should return 400 if cart is empty', async () => {
      req.user = { _id: 'user123' };
      Cart.findOne.mockResolvedValue({ items: [], populate: jest.fn().mockResolvedValue({ items: [] }) });

      await orderController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cart is empty'
      });
    });

    it('should return 400 if service is not available', async () => {
      req.user = { _id: 'user123' };
      Cart.findOne.mockResolvedValue(mockCart);
      Service.findById.mockResolvedValue({ ...mockService, availability: false });

      await orderController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'One or more services are not available'
      });
    });

    it('should handle database errors during order creation', async () => {
      req.user = { _id: 'user123' };
      Cart.findOne.mockRejectedValue(new Error('Database error'));

      await orderController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error creating order',
        error: expect.any(Error)
      });
    });
  });

  describe('getAll', () => {
    const mockOrders = [
      {
        _id: 'order1',
        items: [{ service: { name: 'Service 1' } }],
        totalAmount: 100,
        status: 'pending'
      },
      {
        _id: 'order2',
        items: [{ service: { name: 'Service 2' } }],
        totalAmount: 200,
        status: 'completed'
      }
    ];

    it('should return orders with pagination', async () => {
      req.user = { _id: 'user123' };
      req.query = { page: 1, limit: 10 };
      
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockOrders)
      });
      Order.countDocuments.mockResolvedValue(2);

      await orderController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        orders: mockOrders,
        currentPage: 1,
        totalPages: 1,
        totalOrders: 2
      });
    });

    it('should filter orders by status', async () => {
      req.user = { _id: 'user123' };
      req.query = { status: 'pending' };
      
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockOrders[0]])
      });
      Order.countDocuments.mockResolvedValue(1);

      await orderController.getAll(req, res);

      expect(Order.find).toHaveBeenCalledWith({
        user: 'user123',
        status: 'pending'
      });
    });

    it('should handle database errors during order retrieval', async () => {
      req.user = { _id: 'user123' };
      req.query = { page: 1, limit: 10 };
      
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await orderController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving orders',
        error: expect.any(Error)
      });
    });

    it('should handle empty results with pagination', async () => {
      req.user = { _id: 'user123' };
      req.query = { page: 1, limit: 10 };
      
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });
      Order.countDocuments.mockResolvedValue(0);

      await orderController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        orders: [],
        currentPage: 1,
        totalPages: 0,
        totalOrders: 0
      });
    });
  });

  describe('getById', () => {
    const mockOrder = {
      _id: 'order123',
      items: [{ service: { name: 'Test Service' } }],
      totalAmount: 100,
      user: 'user123'
    };

    it('should return order details', async () => {
      req.params = { id: 'order123' };
      req.user = { _id: 'user123' };
      
      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder)
      });

      await orderController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockOrder);
    });

    it('should return 404 if order not found', async () => {
      req.params = { id: 'nonexistent' };
      req.user = { _id: 'user123' };
      
      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await orderController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Order not found'
      });
    });

    it('should return 403 if user not authorized', async () => {
      req.params = { id: 'order123' };
      req.user = { _id: 'different_user' };
      
      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder)
      });

      await orderController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not authorized to view this order'
      });
    });

    it('should handle database errors during order retrieval', async () => {
      req.params = { id: 'order123' };
      req.user = { _id: 'user123' };
      
      Order.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await orderController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving order',
        error: expect.any(Error)
      });
    });
  });

  describe('cancel', () => {
    const mockOrder = {
      _id: 'order123',
      status: 'pending',
      user: 'user123',
      save: jest.fn()
    };

    it('should cancel a pending order', async () => {
      req.params = { id: 'order123' };
      req.user = { _id: 'user123' };
      
      Order.findById.mockResolvedValue(mockOrder);
      mockOrder.save.mockResolvedValue({ ...mockOrder, status: 'cancelled' });

      await orderController.cancel(req, res);

      expect(mockOrder.status).toBe('cancelled');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Order cancelled successfully',
        order: expect.objectContaining({ status: 'cancelled' })
      });
    });

    it('should return 400 if order cannot be cancelled', async () => {
      req.params = { id: 'order123' };
      req.user = { _id: 'user123' };
      
      Order.findById.mockResolvedValue({ ...mockOrder, status: 'completed' });

      await orderController.cancel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Order cannot be cancelled'
      });
    });

    it('should handle database errors during order cancellation', async () => {
      req.params = { id: 'order123' };
      req.user = { _id: 'user123' };
      
      Order.findById.mockRejectedValue(new Error('Database error'));

      await orderController.cancel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error cancelling order',
        error: expect.any(Error)
      });
    });
  });

  describe('updateStatus', () => {
    const mockOrder = {
      _id: 'order123',
      status: 'pending',
      user: 'user123',
      save: jest.fn()
    };

    it('should update order status', async () => {
      req.params = { id: 'order123' };
      req.user = { _id: 'user123', role: 'admin' };
      req.body = { status: 'completed' };
      
      Order.findById.mockResolvedValue(mockOrder);
      mockOrder.save.mockResolvedValue({ ...mockOrder, status: 'completed' });

      await orderController.updateStatus(req, res);

      expect(mockOrder.status).toBe('completed');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Order status updated successfully',
        order: expect.objectContaining({ status: 'completed' })
      });
    });

    it('should return 400 for invalid status', async () => {
      req.params = { id: 'order123' };
      req.user = { _id: 'user123', role: 'admin' };
      req.body = { status: 'invalid_status' };
      
      Order.findById.mockResolvedValue(mockOrder);

      await orderController.updateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid status'
      });
    });

    it('should handle database errors during status update', async () => {
      req.params = { id: 'order123' };
      req.user = { _id: 'user123', role: 'admin' };
      req.body = { status: 'completed' };
      
      Order.findById.mockRejectedValue(new Error('Database error'));

      await orderController.updateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error updating order status',
        error: expect.any(Error)
      });
    });
  });

  describe('getStatistics', () => {
    const mockStats = {
      totalOrders: 10,
      totalRevenue: 1000,
      averageOrderValue: 100,
      statusDistribution: {
        pending: 5,
        completed: 3,
        cancelled: 2
      }
    };

    it('should return order statistics', async () => {
      req.user = { _id: 'user123', role: 'admin' };
      
      Order.aggregate.mockResolvedValue([mockStats]);

      await orderController.getStatistics(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStats);
    });

    it('should handle database errors during statistics retrieval', async () => {
      req.user = { _id: 'user123', role: 'admin' };
      
      Order.aggregate.mockRejectedValue(new Error('Database error'));

      await orderController.getStatistics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving order statistics',
        error: expect.any(Error)
      });
    });

    it('should handle empty statistics', async () => {
      req.user = { _id: 'user123', role: 'admin' };
      
      Order.aggregate.mockResolvedValue([{
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusDistribution: {}
      }]);

      await orderController.getStatistics(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusDistribution: {}
      });
    });
  });
}); 