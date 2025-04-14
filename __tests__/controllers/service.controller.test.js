const { mockRequest, mockResponse } = require('../mocks/express.mock');
const { validationResult } = require('express-validator');
const Service = require('../../src/models/service.model');
const Category = require('../../src/models/category.model');
const serviceController = require('../../src/controllers/service.controller');

// Mock the models and validation
jest.mock('../../src/models/service.model');
jest.mock('../../src/models/category.model');
jest.mock('express-validator');

describe('Service Controller', () => {
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
      name: 'Test Service',
      description: 'Test Description',
      image: 'test.jpg',
      price: 100,
      discount: 10,
      duration: 60,
      availability: true,
      category: 'category123',
      vendor: 'vendor123'
    };

    it('should create a new service successfully', async () => {
      req.body = mockService;
      req.user = { id: 'vendor123' };
      
      Category.findById.mockResolvedValue({ _id: 'category123' });
      Service.prototype.save.mockResolvedValue(mockService);

      await serviceController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Service created successfully',
        service: expect.objectContaining(mockService)
      });
    });

    it('should return 400 for validation errors', async () => {
      validationResult.mockImplementation(() => ({
        isEmpty: () => false,
        array: () => [{ msg: 'Name is required' }]
      }));

      await serviceController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.arrayContaining([
          expect.objectContaining({ msg: 'Name is required' })
        ])
      });
    });

    it('should return 404 if category not found', async () => {
      req.body = mockService;
      req.user = { id: 'vendor123' };
      
      Category.findById.mockResolvedValue(null);

      await serviceController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category not found'
      });
    });

    it('should handle database errors during service creation', async () => {
      req.body = mockService;
      req.user = { id: 'vendor123' };
      
      Category.findById.mockResolvedValue({ _id: 'category123' });
      Service.prototype.save.mockRejectedValue(new Error('Database error'));

      await serviceController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error creating service'
      });
    });

    it('should handle validation errors with multiple fields', async () => {
      validationResult.mockImplementation(() => ({
        isEmpty: () => false,
        array: () => [
          { msg: 'Name is required', field: 'name' },
          { msg: 'Price must be positive', field: 'price' }
        ]
      }));

      await serviceController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.arrayContaining([
          expect.objectContaining({ msg: 'Name is required', field: 'name' }),
          expect.objectContaining({ msg: 'Price must be positive', field: 'price' })
        ])
      });
    });
  });

  describe('getAll', () => {
    const mockServices = [
      { _id: '1', name: 'Service 1' },
      { _id: '2', name: 'Service 2' }
    ];

    it('should return services with pagination', async () => {
      req.query = { page: 1, limit: 10 };
      req.user = { id: 'vendor123' };

      Service.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockServices)
      });
      Service.countDocuments.mockResolvedValue(2);

      await serviceController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        services: mockServices,
        totalPages: 1,
        currentPage: 1,
        totalServices: 2
      });
    });

    it('should filter services by category', async () => {
      req.query = { category: 'category123' };
      req.user = { id: 'vendor123' };

      Service.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockServices)
      });
      Service.countDocuments.mockResolvedValue(2);

      await serviceController.getAll(req, res);

      expect(Service.find).toHaveBeenCalledWith({
        vendor: 'vendor123',
        category: 'category123'
      });
    });

    it('should handle database errors', async () => {
      req.query = { page: 1, limit: 10 };
      req.user = { id: 'vendor123' };

      Service.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await serviceController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching services'
      });
    });

    it('should handle empty results', async () => {
      req.query = { page: 1, limit: 10 };
      req.user = { id: 'vendor123' };

      Service.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });
      Service.countDocuments.mockResolvedValue(0);

      await serviceController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        services: [],
        totalPages: 0,
        currentPage: 1,
        totalServices: 0
      });
    });
  });

  describe('getById', () => {
    const mockService = {
      _id: 'service123',
      name: 'Test Service',
      vendor: 'vendor123'
    };

    it('should return service by id', async () => {
      req.params = { id: 'service123' };
      req.user = { id: 'vendor123' };

      Service.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockService)
      });

      await serviceController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockService);
    });

    it('should return 404 if service not found', async () => {
      req.params = { id: 'nonexistent' };
      req.user = { id: 'vendor123' };

      Service.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await serviceController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Service not found'
      });
    });

    it('should handle database errors during service retrieval', async () => {
      req.params = { id: 'service123' };
      req.user = { id: 'vendor123' };

      Service.findOne.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await serviceController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching service'
      });
    });

    it('should handle invalid service ID format', async () => {
      req.params = { id: 'invalid-id-format' };
      req.user = { id: 'vendor123' };

      Service.findOne.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Invalid ID format'))
      });

      await serviceController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching service'
      });
    });
  });

  describe('update', () => {
    const mockService = {
      _id: 'service123',
      name: 'Test Service',
      save: jest.fn()
    };

    it('should update service successfully', async () => {
      req.params = { id: 'service123' };
      req.user = { id: 'vendor123' };
      req.body = { name: 'Updated Service' };

      Service.findOne.mockResolvedValue(mockService);
      mockService.save.mockResolvedValue({ ...mockService, name: 'Updated Service' });

      await serviceController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Service updated successfully',
        service: expect.objectContaining({ name: 'Updated Service' })
      });
    });

    it('should return 404 if service not found', async () => {
      req.params = { id: 'nonexistent' };
      req.user = { id: 'vendor123' };
      req.body = { name: 'Updated Service' };

      Service.findOne.mockResolvedValue(null);

      await serviceController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Service not found'
      });
    });

    it('should update service with category change', async () => {
      req.params = { id: 'service123' };
      req.user = { id: 'vendor123' };
      req.body = { 
        name: 'Updated Service',
        category: 'newCategory123'
      };

      Service.findOne.mockResolvedValue(mockService);
      Category.findById.mockResolvedValue({ _id: 'newCategory123' });
      mockService.save.mockResolvedValue({ 
        ...mockService, 
        name: 'Updated Service',
        category: 'newCategory123'
      });

      await serviceController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Service updated successfully',
        service: expect.objectContaining({ 
          name: 'Updated Service',
          category: 'newCategory123'
        })
      });
    });

    it('should return 404 if new category not found', async () => {
      req.params = { id: 'service123' };
      req.user = { id: 'vendor123' };
      req.body = { 
        name: 'Updated Service',
        category: 'nonexistent'
      };

      Service.findOne.mockResolvedValue(mockService);
      Category.findById.mockResolvedValue(null);

      await serviceController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category not found'
      });
    });

    it('should handle validation errors', async () => {
      validationResult.mockImplementation(() => ({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid service data' }]
      }));

      req.params = { id: 'service123' };
      req.user = { id: 'vendor123' };
      req.body = { name: 'Invalid Service' };

      await serviceController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.arrayContaining([
          expect.objectContaining({ msg: 'Invalid service data' })
        ])
      });
    });

    it('should handle database errors', async () => {
      req.params = { id: 'service123' };
      req.user = { id: 'vendor123' };
      req.body = { name: 'Updated Service' };

      Service.findOne.mockRejectedValue(new Error('Database error'));

      await serviceController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error updating service'
      });
    });
  });

  describe('remove', () => {
    it('should delete service successfully', async () => {
      req.params = { id: 'service123' };
      req.user = { id: 'vendor123' };

      Service.findOneAndDelete.mockResolvedValue({ _id: 'service123' });

      await serviceController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Service deleted successfully'
      });
    });

    it('should return 404 if service not found', async () => {
      req.params = { id: 'nonexistent' };
      req.user = { id: 'vendor123' };

      Service.findOneAndDelete.mockResolvedValue(null);

      await serviceController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Service not found'
      });
    });

    it('should handle database errors during service deletion', async () => {
      req.params = { id: 'service123' };
      req.user = { id: 'vendor123' };

      Service.findOneAndDelete.mockRejectedValue(new Error('Database error'));

      await serviceController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error deleting service'
      });
    });

    it('should handle invalid service ID during deletion', async () => {
      req.params = { id: 'invalid-id-format' };
      req.user = { id: 'vendor123' };

      Service.findOneAndDelete.mockRejectedValue(new Error('Invalid ID format'));

      await serviceController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error deleting service'
      });
    });
  });

  describe('getByCategory', () => {
    const mockServices = [
      { _id: '1', name: 'Service 1' },
      { _id: '2', name: 'Service 2' }
    ];

    it('should return services by category', async () => {
      req.params = { categoryId: 'category123' };
      req.query = { page: 1, limit: 10 };
      req.user = { id: 'vendor123' };

      Category.findById.mockResolvedValue({ _id: 'category123', name: 'Test Category' });
      Service.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockServices)
      });
      Service.countDocuments.mockResolvedValue(2);

      await serviceController.getByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        services: mockServices,
        category: expect.objectContaining({ _id: 'category123' }),
        totalPages: 1,
        currentPage: 1,
        totalServices: 2
      });
    });

    it('should return 404 if category not found', async () => {
      req.params = { categoryId: 'nonexistent' };
      req.query = { page: 1, limit: 10 };
      req.user = { id: 'vendor123' };

      Category.findById.mockResolvedValue(null);

      await serviceController.getByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category not found'
      });
    });

    it('should handle validation errors', async () => {
      validationResult.mockImplementation(() => ({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid category ID' }]
      }));

      req.params = { categoryId: 'invalid' };
      req.query = { page: 1, limit: 10 };
      req.user = { id: 'vendor123' };

      await serviceController.getByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.arrayContaining([
          expect.objectContaining({ msg: 'Invalid category ID' })
        ])
      });
    });

    it('should handle database errors during category service retrieval', async () => {
      req.params = { categoryId: 'category123' };
      req.query = { page: 1, limit: 10 };
      req.user = { id: 'vendor123' };

      Category.findById.mockResolvedValue({ _id: 'category123', name: 'Test Category' });
      Service.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await serviceController.getByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching services by category'
      });
    });

    it('should handle invalid category ID format', async () => {
      req.params = { categoryId: 'invalid-id-format' };
      req.query = { page: 1, limit: 10 };
      req.user = { id: 'vendor123' };

      Category.findById.mockRejectedValue(new Error('Invalid ID format'));

      await serviceController.getByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching services by category'
      });
    });

    it('should handle empty results with pagination', async () => {
      req.params = { categoryId: 'category123' };
      req.query = { page: 1, limit: 10 };
      req.user = { id: 'vendor123' };

      Category.findById.mockResolvedValue({ _id: 'category123', name: 'Test Category' });
      Service.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });
      Service.countDocuments.mockResolvedValue(0);

      await serviceController.getByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        services: [],
        category: expect.objectContaining({ _id: 'category123' }),
        totalPages: 0,
        currentPage: 1,
        totalServices: 0
      });
    });
  });
}); 