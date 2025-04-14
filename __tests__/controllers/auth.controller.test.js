const { mockRequest, mockResponse } = require('../mocks/express.mock');
const User = require('../../src/models/user.model');
const authController = require('../../src/controllers/auth.controller');
const { validatePassword } = require('../../src/utils/password.validator');

jest.mock('../../src/models/user.model');
jest.mock('../../src/utils/password.validator');

describe('Auth Controller', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      _id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword',
      role: 'user',
      save: jest.fn().mockResolvedValue(true),
      comparePassword: jest.fn(),
      generateResetToken: jest.fn(),
      toObject: jest.fn().mockReturnValue({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      })
    };
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const req = mockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@123',
          role: 'user'
        }
      });
      const res = mockResponse();

      User.findOne.mockResolvedValue(null);
      validatePassword.mockReturnValue({ isValid: true });
      
      const mockSavedUser = {
        ...mockUser,
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user'
        })
      };
      
      User.prototype.save = jest.fn().mockResolvedValue(mockSavedUser);
      User.mockImplementation(() => mockSavedUser);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User registered successfully',
        user: expect.objectContaining({
          _id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user'
        })
      });
    });

    it('should return 400 if user already exists', async () => {
      const req = mockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@123',
          role: 'user'
        }
      });
      const res = mockResponse();

      User.findOne.mockResolvedValue(mockUser);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User already exists'
      });
    });

    it('should handle validation errors', async () => {
      const req = mockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'weak',
          role: 'user'
        }
      });
      const res = mockResponse();

      User.findOne.mockResolvedValue(null);
      validatePassword.mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 8 characters']
      });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password validation failed',
        errors: ['Password must be at least 8 characters']
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'Test@123'
        }
      });
      const res = mockResponse();

      mockUser.comparePassword.mockResolvedValue(true);
      User.findOne.mockResolvedValue(mockUser);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: expect.any(String),
        user: expect.objectContaining({
          _id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user'
        })
      });
    });

    it('should return 401 for invalid credentials', async () => {
      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      });
      const res = mockResponse();

      mockUser.comparePassword.mockResolvedValue(false);
      User.findOne.mockResolvedValue(mockUser);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid credentials'
      });
    });

    it('should handle validation errors', async () => {
      const req = mockRequest({
        body: {
          email: 'invalid-email',
          password: ''
        }
      });
      const res = mockResponse();

      User.findOne.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid credentials'
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Logout successful'
      });
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const req = mockRequest({
        body: {
          email: 'test@example.com'
        }
      });
      const res = mockResponse();

      mockUser.generateResetToken.mockReturnValue('reset-token');
      User.findOne.mockResolvedValue(mockUser);

      await authController.forgotPassword(req, res);

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset email sent'
      });
    });

    it('should return 404 if user not found', async () => {
      const req = mockRequest({
        body: {
          email: 'nonexistent@example.com'
        }
      });
      const res = mockResponse();

      User.findOne.mockResolvedValue(null);

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const req = mockRequest({
        body: {
          token: 'valid-token',
          password: 'New@Password123'
        }
      });
      const res = mockResponse();

      const mockUserWithToken = {
        ...mockUser,
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 3600000)
      };

      User.findOne.mockResolvedValue(mockUserWithToken);
      validatePassword.mockReturnValue({ isValid: true });

      await authController.resetPassword(req, res);

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset successful'
      });
    });

    it('should return 400 for invalid or expired token', async () => {
      const req = mockRequest({
        body: {
          token: 'expired-token',
          password: 'New@Password123'
        }
      });
      const res = mockResponse();

      User.findOne.mockResolvedValue(null);

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid or expired reset token'
      });
    });

    it('should handle validation errors', async () => {
      const req = mockRequest({
        body: {
          token: 'valid-token',
          password: 'weak'
        }
      });
      const res = mockResponse();

      const mockUserWithToken = {
        ...mockUser,
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 3600000)
      };

      User.findOne.mockResolvedValue(mockUserWithToken);
      validatePassword.mockReturnValue({
        isValid: false,
        errors: ['Password must contain at least one uppercase letter']
      });

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password validation failed',
        errors: ['Password must contain at least one uppercase letter']
      });
    });
  });
}); 