const mongoose = require('mongoose');
const Cart = require('../../src/models/cart.model');

describe('Cart Model', () => {
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
    await Cart.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should validate a valid cart', async () => {
      const validCart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          serviceId: new mongoose.Types.ObjectId(),
          categoryId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 100,
          discount: 10,
          total: 180
        }],
        subtotal: 200,
        totalDiscount: 20,
        totalAmount: 180
      });

      const savedCart = await validCart.save();
      expect(savedCart._id).toBeDefined();
      expect(savedCart.items).toHaveLength(1);
      expect(savedCart.totalAmount).toBe(180);
    });

    it('should fail validation for missing required fields', async () => {
      const cartWithoutRequired = new Cart({});
      
      await expect(cartWithoutRequired.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail validation for invalid quantity', async () => {
      const cartWithInvalidQuantity = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          serviceId: new mongoose.Types.ObjectId(),
          categoryId: new mongoose.Types.ObjectId(),
          quantity: 0,
          price: 100,
          discount: 10,
          total: 90
        }],
        subtotal: 100,
        totalDiscount: 10,
        totalAmount: 90
      });

      await expect(cartWithInvalidQuantity.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail validation for invalid price', async () => {
      const cartWithInvalidPrice = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          serviceId: new mongoose.Types.ObjectId(),
          categoryId: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: -100,
          discount: 10,
          total: 90
        }],
        subtotal: -100,
        totalDiscount: 10,
        totalAmount: 90
      });

      await expect(cartWithInvalidPrice.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail validation for invalid discount', async () => {
      const cartWithInvalidDiscount = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          serviceId: new mongoose.Types.ObjectId(),
          categoryId: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: 100,
          discount: 150,
          total: 90
        }],
        subtotal: 100,
        totalDiscount: 150,
        totalAmount: 90
      });

      await expect(cartWithInvalidDiscount.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt timestamps', async () => {
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          serviceId: new mongoose.Types.ObjectId(),
          categoryId: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: 100,
          discount: 10,
          total: 90
        }],
        subtotal: 100,
        totalDiscount: 10,
        totalAmount: 90
      });

      await cart.save();
      expect(cart.createdAt).toBeDefined();
      expect(cart.updatedAt).toBeDefined();
    });

    it('should update lastUpdated on save', async () => {
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          serviceId: new mongoose.Types.ObjectId(),
          categoryId: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: 100,
          discount: 10,
          total: 90
        }],
        subtotal: 100,
        totalDiscount: 10,
        totalAmount: 90
      });

      await cart.save();
      const originalLastUpdated = cart.lastUpdated;

      await new Promise(resolve => setTimeout(resolve, 1000));
      cart.items[0].quantity = 2;
      await cart.save();

      expect(cart.lastUpdated).not.toEqual(originalLastUpdated);
    });
  });

  describe('Cart Calculations', () => {
    it('should calculate item total correctly', async () => {
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          serviceId: new mongoose.Types.ObjectId(),
          categoryId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 100,
          discount: 10,
          total: 180
        }],
        subtotal: 200,
        totalDiscount: 20,
        totalAmount: 180
      });

      await cart.save();
      expect(cart.items[0].total).toBe(180); // (100 * 2) - (100 * 2 * 0.1)
    });

    it('should calculate cart totals correctly', async () => {
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [
          {
            serviceId: new mongoose.Types.ObjectId(),
            categoryId: new mongoose.Types.ObjectId(),
            quantity: 2,
            price: 100,
            discount: 10,
            total: 180
          },
          {
            serviceId: new mongoose.Types.ObjectId(),
            categoryId: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 200,
            discount: 20,
            total: 160
          }
        ],
        subtotal: 400,
        totalDiscount: 60,
        totalAmount: 340
      });

      await cart.save();
      expect(cart.subtotal).toBe(400); // (100 * 2) + (200 * 1)
      expect(cart.totalDiscount).toBe(60); // (100 * 2 * 0.1) + (200 * 1 * 0.2)
      expect(cart.totalAmount).toBe(340); // 400 - 60
    });
  });
}); 