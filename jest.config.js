module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true
}; 