const config = require('../../src/config/config');

describe('Config', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should load default values when environment variables are not set', () => {
        expect(parseInt(config.port)).toBe(3000);
        expect(config.mongodb.uri).toBe('mongodb://localhost:27017/test-db');
    });

    it('should override default values with environment variables', () => {
        process.env.PORT = '4000';
        process.env.MONGODB_URI = 'mongodb://localhost:27017/custom_database';

        const newConfig = require('../../src/config/config');

        expect(parseInt(newConfig.port)).toBe(4000);
        expect(newConfig.mongodb.uri).toBe('mongodb://localhost:27017/custom_database');
    });

    it('should have all required configuration properties', () => {
        expect(config).toHaveProperty('port');
        expect(config).toHaveProperty('mongodb');
        expect(config.mongodb).toHaveProperty('uri');
        expect(config).toHaveProperty('jwt');
        expect(config).toHaveProperty('env');
    });
}); 