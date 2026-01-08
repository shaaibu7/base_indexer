// Test setup file for backend tests
// This file runs before all tests

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.INFURA_URL = 'wss://test.infura.io/v3/test';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test_db';
process.env.DB_PORT = '5432';
process.env.OPEN_AI_KEY = 'test-key';

