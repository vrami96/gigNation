const mongoose = require('mongoose');
const Category = require('../../src/models/category.model');

describe('Category Model', () => {
  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Category.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should validate a valid category', async () => {
      const validCategory = new Category({
        name: 'Test Category',
        description: 'Test Description',
        image: 'test.jpg',
        status: 'active'
      });

      const savedCategory = await validCategory.save();
      expect(savedCategory._id).toBeDefined();
      expect(savedCategory.name).toBe('Test Category');
      expect(savedCategory.status).toBe('active');
    });

    it('should fail validation for missing required fields', async () => {
      const categoryWithoutRequired = new Category({});
      
      await expect(categoryWithoutRequired.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail validation for invalid status', async () => {
      const categoryWithInvalidStatus = new Category({
        name: 'Test Category',
        description: 'Test Description',
        image: 'test.jpg',
        status: 'invalid_status'
      });

      await expect(categoryWithInvalidStatus.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should enforce unique category names', async () => {
      const category1 = new Category({
        name: 'Test Category',
        description: 'Test Description',
        image: 'test.jpg',
        status: 'active'
      });

      await category1.save();

      const category2 = new Category({
        name: 'Test Category',
        description: 'Another Description',
        image: 'test2.jpg',
        status: 'active'
      });

      await expect(category2.save()).rejects.toThrow(mongoose.Error.MongoServerError);
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt timestamps', async () => {
      const category = new Category({
        name: 'Test Category',
        description: 'Test Description',
        image: 'test.jpg',
        status: 'active'
      });

      await category.save();
      expect(category.createdAt).toBeDefined();
      expect(category.updatedAt).toBeDefined();
    });

    it('should update updatedAt on save', async () => {
      const category = new Category({
        name: 'Test Category',
        description: 'Test Description',
        image: 'test.jpg',
        status: 'active'
      });

      await category.save();
      const originalUpdatedAt = category.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 1000));
      category.name = 'Updated Category';
      await category.save();

      expect(category.updatedAt).not.toEqual(originalUpdatedAt);
    });
  });

  describe('Status Transitions', () => {
    it('should allow status change from active to inactive', async () => {
      const category = new Category({
        name: 'Test Category',
        description: 'Test Description',
        image: 'test.jpg',
        status: 'active'
      });

      await category.save();
      category.status = 'inactive';
      await category.save();

      const updatedCategory = await Category.findById(category._id);
      expect(updatedCategory.status).toBe('inactive');
    });

    it('should allow status change from inactive to active', async () => {
      const category = new Category({
        name: 'Test Category',
        description: 'Test Description',
        image: 'test.jpg',
        status: 'inactive'
      });

      await category.save();
      category.status = 'active';
      await category.save();

      const updatedCategory = await Category.findById(category._id);
      expect(updatedCategory.status).toBe('active');
    });
  });
}); 