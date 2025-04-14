const jwt = require('jsonwebtoken');
const { generateToken, verifyToken } = require('../../src/utils/jwt.utils');

// Mock environment variable
process.env.JWT_SECRET = 'test-secret';

describe('JWT Utils', () => {
  const mockUser = {
    _id: '123456789',
    role: 'user'
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify the token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('userId', mockUser._id);
      expect(decoded).toHaveProperty('role', mockUser.role);
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
    });

    it('should include correct user data in token', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(mockUser._id);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should generate token that expires in 24 hours', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(24 * 60 * 60); // 24 hours in seconds
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      expect(decoded).toHaveProperty('userId', mockUser._id);
      expect(decoded).toHaveProperty('role', mockUser.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyToken('invalid-token');
      }).toThrow(jwt.JsonWebTokenError);
    });

    it('should throw error for expired token', () => {
      // Create a token that's already expired
      const expiredToken = jwt.sign(
        { userId: mockUser._id, role: mockUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      expect(() => {
        verifyToken(expiredToken);
      }).toThrow(jwt.TokenExpiredError);
    });

    it('should throw error for token with wrong secret', () => {
      const token = jwt.sign(
        { userId: mockUser._id, role: mockUser.role },
        'wrong-secret'
      );

      expect(() => {
        verifyToken(token);
      }).toThrow(jwt.JsonWebTokenError);
    });
  });
}); 