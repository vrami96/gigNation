const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../src/models/user.model');

describe('User Model', () => {
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
    await User.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should validate a valid user', async () => {
      const validUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        role: 'user'
      });

      const savedUser = await validUser.save();
      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe('Test User');
      expect(savedUser.email).toBe('test@example.com');
    });

    it('should fail validation for missing required fields', async () => {
      const userWithoutRequired = new User({});
      
      await expect(userWithoutRequired.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail validation for invalid email', async () => {
      const userWithInvalidEmail = new User({
        name: 'Test User',
        email: 'invalid-email',
        password: 'Password123!'
      });

      await expect(userWithInvalidEmail.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should validate vendor-specific fields when role is vendor', async () => {
      const vendor = new User({
        name: 'Vendor User',
        email: 'vendor@example.com',
        password: 'Password123!',
        role: 'vendor',
        vendorInfo: {
          businessName: 'Test Business',
          businessAddress: '123 Test St',
          businessPhone: '1234567890',
          businessCategory: 'service'
        }
      });

      const savedVendor = await vendor.save();
      expect(savedVendor.vendorInfo.businessName).toBe('Test Business');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });

      await user.save();
      expect(user.password).not.toBe('Password123!');
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/);
    });

    it('should not rehash password if not modified', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });

      await user.save();
      const firstHash = user.password;

      user.name = 'Updated Name';
      await user.save();
      expect(user.password).toBe(firstHash);
    });
  });

  describe('Methods', () => {
    it('should correctly compare passwords', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });

      await user.save();
      const isMatch = await user.comparePassword('Password123!');
      const isNotMatch = await user.comparePassword('WrongPassword');

      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });

    it('should generate reset token', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });

      await user.save();
      const resetToken = user.generateResetToken();

      expect(resetToken).toBeDefined();
      expect(typeof resetToken).toBe('string');
      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpires).toBeDefined();
      expect(user.resetPasswordExpires).toBeInstanceOf(Date);
    });

    it('should remove sensitive data in toJSON', () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        resetPasswordToken: 'token',
        resetPasswordExpires: new Date()
      });

      const userJson = user.toJSON();
      expect(userJson.password).toBeUndefined();
      expect(userJson.resetPasswordToken).toBeUndefined();
      expect(userJson.resetPasswordExpires).toBeUndefined();
    });

    it('should find users by role', async () => {
      await User.create([
        { name: 'User1', email: 'user1@test.com', password: 'pass123!', role: 'user' },
        { 
          name: 'User2', 
          email: 'user2@test.com', 
          password: 'pass123!', 
          role: 'vendor',
          vendorInfo: {
            businessName: 'Test Business',
            businessAddress: '123 Test St',
            businessPhone: '1234567890',
            businessCategory: 'service'
          }
        },
        { name: 'User3', email: 'user3@test.com', password: 'pass123!', role: 'admin' }
      ]);

      const vendors = await User.findByRole('vendor');
      expect(vendors).toHaveLength(1);
      expect(vendors[0].role).toBe('vendor');
    });

    it('should check if user is admin', async () => {
      const admin = new User({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'pass123!',
        role: 'admin'
      });

      const user = new User({
        name: 'Regular User',
        email: 'user@test.com',
        password: 'pass123!',
        role: 'user'
      });

      expect(admin.isAdmin()).toBe(true);
      expect(user.isAdmin()).toBe(false);
    });

    it('should check if user is vendor', async () => {
      const vendor = new User({
        name: 'Vendor User',
        email: 'vendor@test.com',
        password: 'pass123!',
        role: 'vendor'
      });

      const user = new User({
        name: 'Regular User',
        email: 'user@test.com',
        password: 'pass123!',
        role: 'user'
      });

      expect(vendor.isVendor()).toBe(true);
      expect(user.isVendor()).toBe(false);
    });
  });

  describe('Timestamps', () => {
    it('should update timestamps on save', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });

      await user.save();
      const createdAt = user.createdAt;
      const updatedAt = user.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 1000));
      user.name = 'Updated Name';
      await user.save();

      expect(user.createdAt).toEqual(createdAt);
      expect(user.updatedAt).not.toEqual(updatedAt);
    });
  });
}); 