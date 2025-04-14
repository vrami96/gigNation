const { validatePassword } = require('../../src/utils/password.validator');

describe('Password Validator', () => {
  it('should validate a strong password', () => {
    const result = validatePassword('Test123!@#');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject password shorter than 8 characters', () => {
    const result = validatePassword('Test1!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('should reject password without uppercase letter', () => {
    const result = validatePassword('test123!@#');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('should reject password without lowercase letter', () => {
    const result = validatePassword('TEST123!@#');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('should reject password without number', () => {
    const result = validatePassword('TestTest!@#');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('should reject password without special character', () => {
    const result = validatePassword('TestTest123');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
  });

  it('should return multiple errors for weak password', () => {
    const result = validatePassword('test');
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual([
      'Password must be at least 8 characters',
      'Password must contain at least one uppercase letter',
      'Password must contain at least one number',
      'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)'
    ]);
  });

  it('should validate password with all required characters', () => {
    const result = validatePassword('StrongP@ssw0rd');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
}); 