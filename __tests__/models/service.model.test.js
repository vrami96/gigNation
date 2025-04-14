const mongoose = require('mongoose');
const Service = require('../../src/models/service.model');

describe('Service Model', () => {
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
    await Service.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should validate a valid service', async () => {
      const validService = new Service({
        name: 'Test Service',
        description: 'Test Description',
        image: 'test.jpg',
        price: 100,
        duration: 2,
        availability: ['monday', 'wednesday', 'friday'],
        category: new mongoose.Types.ObjectId(),
        vendor: new mongoose.Types.ObjectId()
      });

      const savedService = await validService.save();
      expect(savedService._id).toBeDefined();
      expect(savedService.name).toBe('Test Service');
      expect(savedService.price).toBe(100);
    });

    it('should fail validation for missing required fields', async () => {
      const serviceWithoutRequired = new Service({});
      
      await expect(serviceWithoutRequired.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail validation for invalid price', async () => {
      const serviceWithInvalidPrice = new Service({
        name: 'Test Service',
        description: 'Test Description',
        image: 'test.jpg',
        price: -100,
        duration: 2,
        availability: ['monday'],
        category: new mongoose.Types.ObjectId(),
        vendor: new mongoose.Types.ObjectId()
      });

      await expect(serviceWithInvalidPrice.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail validation for invalid duration', async () => {
      const serviceWithInvalidDuration = new Service({
        name: 'Test Service',
        description: 'Test Description',
        image: 'test.jpg',
        price: 100,
        duration: 0,
        availability: ['monday'],
        category: new mongoose.Types.ObjectId(),
        vendor: new mongoose.Types.ObjectId()
      });

      await expect(serviceWithInvalidDuration.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail validation for invalid discount', async () => {
      const serviceWithInvalidDiscount = new Service({
        name: 'Test Service',
        description: 'Test Description',
        image: 'test.jpg',
        price: 100,
        duration: 2,
        discount: 150,
        availability: ['monday'],
        category: new mongoose.Types.ObjectId(),
        vendor: new mongoose.Types.ObjectId()
      });

      await expect(serviceWithInvalidDiscount.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail validation for empty availability', async () => {
      const serviceWithEmptyAvailability = new Service({
        name: 'Test Service',
        description: 'Test Description',
        image: 'test.jpg',
        price: 100,
        duration: 2,
        availability: [],
        category: new mongoose.Types.ObjectId(),
        vendor: new mongoose.Types.ObjectId()
      });

      await expect(serviceWithEmptyAvailability.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail validation for invalid availability day', async () => {
      const serviceWithInvalidDay = new Service({
        name: 'Test Service',
        description: 'Test Description',
        image: 'test.jpg',
        price: 100,
        duration: 2,
        availability: ['invalid-day'],
        category: new mongoose.Types.ObjectId(),
        vendor: new mongoose.Types.ObjectId()
      });

      await expect(serviceWithInvalidDay.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt timestamps', async () => {
      const service = new Service({
        name: 'Test Service',
        description: 'Test Description',
        image: 'test.jpg',
        price: 100,
        duration: 2,
        availability: ['monday'],
        category: new mongoose.Types.ObjectId(),
        vendor: new mongoose.Types.ObjectId()
      });

      await service.save();
      expect(service.createdAt).toBeDefined();
      expect(service.updatedAt).toBeDefined();
    });

    it('should update updatedAt on save', async () => {
      const service = new Service({
        name: 'Test Service',
        description: 'Test Description',
        image: 'test.jpg',
        price: 100,
        duration: 2,
        availability: ['monday'],
        category: new mongoose.Types.ObjectId(),
        vendor: new mongoose.Types.ObjectId()
      });

      await service.save();
      const originalUpdatedAt = service.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 1000));
      service.name = 'Updated Service';
      await service.save();

      expect(service.updatedAt).not.toEqual(originalUpdatedAt);
    });
  });
}); 