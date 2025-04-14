const { mockRequest, mockResponse } = require('../mocks/express.mock');
const { validationResult } = require('express-validator');
const Category = require('../../src/models/category.model');
const categoryController = require('../../src/controllers/category.controller');

// Mock the models and validation
jest.mock('../../src/models/category.model');
jest.mock('express-validator');

describe('Category Controller', () => {
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

  describe('createCategory', () => {
    const mockCategory = {
      name: 'Test Category',
      description: 'Test Description',
      image: 'test.jpg',
      status: 'active'
    };

    it('should create a new category successfully', async () => {
      req.body = mockCategory;
      
      Category.findOne.mockResolvedValue(null);
      Category.prototype.save.mockResolvedValue(mockCategory);

      await categoryController.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category created successfully',
        category: mockCategory
      });
    });

    it('should return 400 if category already exists', async () => {
      req.body = mockCategory;
      
      Category.findOne.mockResolvedValue(mockCategory);

      await categoryController.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category already exists'
      });
    });

    it('should handle validation errors', async () => {
      validationResult.mockImplementation(() => ({
        isEmpty: () => false,
        array: () => [{ msg: 'Name is required' }]
      }));

      await categoryController.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.arrayContaining([
          expect.objectContaining({ msg: 'Name is required' })
        ])
      });
    });

    it('should handle database errors during category creation', async () => {
      req.body = mockCategory;
      
      Category.findOne.mockRejectedValue(new Error('Database error'));

      await categoryController.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error creating category',
        error: expect.any(Error)
      });
    });
  });

  describe('getCategories', () => {
    const mockCategories = [
      { _id: '1', name: 'Category 1', status: 'active' },
      { _id: '2', name: 'Category 2', status: 'inactive' }
    ];

    it('should return categories with pagination', async () => {
      req.query = { page: 1, limit: 10 };
      
      Category.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCategories)
      });
      Category.countDocuments.mockResolvedValue(2);

      await categoryController.getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        categories: mockCategories,
        totalPages: 1,
        currentPage: 1,
        totalCategories: 2
      });
    });

    it('should filter categories by status', async () => {
      req.query = { status: 'active' };
      
      Category.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockCategories[0]])
      });
      Category.countDocuments.mockResolvedValue(1);

      await categoryController.getCategories(req, res);

      expect(Category.find).toHaveBeenCalledWith({ status: 'active' });
    });

    it('should handle database errors during category retrieval', async () => {
      req.query = { page: 1, limit: 10 };
      
      Category.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await categoryController.getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving categories',
        error: expect.any(Error)
      });
    });

    it('should handle empty results with pagination', async () => {
      req.query = { page: 1, limit: 10 };
      
      Category.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });
      Category.countDocuments.mockResolvedValue(0);

      await categoryController.getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        categories: [],
        totalPages: 0,
        currentPage: 1,
        totalCategories: 0
      });
    });
  });

  describe('getCategoryById', () => {
    const mockCategory = {
      _id: 'category123',
      name: 'Test Category',
      description: 'Test Description',
      status: 'active'
    };

    it('should return category details', async () => {
      req.params = { id: 'category123' };
      
      Category.findById.mockResolvedValue(mockCategory);

      await categoryController.getCategoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCategory);
    });

    it('should return 404 if category not found', async () => {
      req.params = { id: 'nonexistent' };
      
      Category.findById.mockResolvedValue(null);

      await categoryController.getCategoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category not found'
      });
    });

    it('should handle database errors during category retrieval', async () => {
      req.params = { id: 'category123' };
      
      Category.findById.mockRejectedValue(new Error('Database error'));

      await categoryController.getCategoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving category',
        error: expect.any(Error)
      });
    });
  });

  describe('updateCategory', () => {
    const mockCategory = {
      _id: 'category123',
      name: 'Test Category',
      description: 'Test Description',
      status: 'active',
      save: jest.fn()
    };

    it('should update category details', async () => {
      req.params = { id: 'category123' };
      req.body = { name: 'Updated Category' };
      
      Category.findById.mockResolvedValue(mockCategory);
      mockCategory.save.mockResolvedValue({ ...mockCategory, name: 'Updated Category' });

      await categoryController.updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category updated successfully',
        category: expect.objectContaining({ name: 'Updated Category' })
      });
    });

    it('should return 404 if category not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { name: 'Updated Category' };
      
      Category.findById.mockResolvedValue(null);

      await categoryController.updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category not found'
      });
    });

    it('should handle validation errors', async () => {
      validationResult.mockImplementation(() => ({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid category data' }]
      }));

      req.params = { id: 'category123' };
      req.body = { name: 'Invalid Category' };

      await categoryController.updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: expect.arrayContaining([
          expect.objectContaining({ msg: 'Invalid category data' })
        ])
      });
    });

    it('should handle database errors during category update', async () => {
      req.params = { id: 'category123' };
      req.body = { name: 'Updated Category' };
      
      Category.findById.mockRejectedValue(new Error('Database error'));

      await categoryController.updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error updating category',
        error: expect.any(Error)
      });
    });
  });

  describe('deleteCategory', () => {
    it('should delete category', async () => {
      req.params = { id: 'category123' };
      
      Category.findByIdAndDelete.mockResolvedValue({ _id: 'category123' });

      await categoryController.deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category deleted successfully'
      });
    });

    it('should return 404 if category not found', async () => {
      req.params = { id: 'nonexistent' };
      
      Category.findByIdAndDelete.mockResolvedValue(null);

      await categoryController.deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category not found'
      });
    });

    it('should handle database errors during category deletion', async () => {
      req.params = { id: 'category123' };
      
      Category.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

      await categoryController.deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error deleting category',
        error: expect.any(Error)
      });
    });
  });
}); 