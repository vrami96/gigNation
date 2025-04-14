require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/node-boilerplate',
    options: {
      user: process.env.MONGODB_USER || '',
      pass: process.env.MONGODB_PASSWORD || ''
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  },
  
  // Add more configuration as needed
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
};

module.exports = config; 