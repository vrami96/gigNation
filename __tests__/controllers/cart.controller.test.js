const { mockRequest, mockResponse } = require('../mocks/express.mock');
const { validationResult } = require('express-validator');
const Cart = require('../../src/models/cart.model');
const Service = require('../../src/models/service.model');
const Category = require('../../src/models/category.model');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../../src/controllers/cart.controller');

jest.mock('../../src/models/cart.model');
jest.mock('../../src/models/service.model');
jest.mock('../../src/models/category.model');
jest.mock('express-validator');

describe('Cart Controller', () => {
  let req, res;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    req.user = { id: 'user123', _id: 'user123', userId: 'user123' };

    validationResult.mockImplementation(() => ({
      isEmpty: () => true,
      array: () => []
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    const mockCart = {
      _id: 'cart123',
      user: 'user123',
      items: [
        {
          service: {
            _id: 'service123',
            name: 'Test Service',
            price: 100
          },
          quantity: 2
        }
      ],
      totalAmount: 200
    };

    it('should return user cart', async () => {
      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      await getCart(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCart);
    });

    it('should return empty cart if not found', async () => {
      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getCart(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        items: [],
        totalAmount: 0
      });
    });

    it('should handle database errors during cart retrieval', async () => {
      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await getCart(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving cart',
        error: expect.any(Error)
      });
    });
  });

  describe('addToCart', () => {
    const mockService = {
      _id: 'service123',
      name: 'Test Service',
      price: 100,
      availability: true
    };

    let mockCart;

    beforeEach(() => {
      mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [],
        totalAmount: 0,
        save: jest.fn(),
        populate: jest.fn()
      };
    });

    it('should add item to cart', async () => {
      req.body = { serviceId: 'service123', quantity: 2 };

      Service.findById.mockResolvedValue(mockService);
      Cart.findOne.mockResolvedValue(mockCart);
      mockCart.save.mockResolvedValue(mockCart);
      mockCart.populate.mockResolvedValue({
        ...mockCart,
        items: [{
          service: mockService,
          quantity: 2,
          price: 100
        }],
        totalAmount: 200
      });

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Item added to cart successfully',
        cart: expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              service: expect.objectContaining({
                _id: 'service123',
                name: 'Test Service',
                price: 100,
                availability: true
              }),
              quantity: 2,
              price: 100
            })
          ]),
          totalAmount: 200
        })
      });
    });

    it('should return 404 if service not found', async () => {
      req.body = { serviceId: 'nonexistent', quantity: 2 };

      Service.findById.mockResolvedValue(null);

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Service not found'
      });
    });

    it('should handle validation errors', async () => {
      validationResult.mockImplementation(() => ({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid quantity' }]
      }));

      req.body = { serviceId: 'service123', quantity: -1 };

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.arrayContaining([
          expect.objectContaining({ msg: 'Invalid quantity' })
        ])
      });
    });

    it('should handle database errors during cart update', async () => {
      req.body = { serviceId: 'service123', quantity: 2 };

      Service.findById.mockResolvedValue(mockService);
      Cart.findOne.mockRejectedValue(new Error('Database error'));

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error adding item to cart',
        error: 'Database error'
      });
    });
  });
});