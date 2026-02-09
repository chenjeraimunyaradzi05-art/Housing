/**
 * Test setup file
 * Runs before all tests
 */

import { beforeAll, afterAll, afterEach } from 'vitest';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-minimum-32-characters';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5434/vor_test?schema=public';

beforeAll(async () => {
  // Setup before all tests
  console.log('🧪 Starting test suite...');
});

afterEach(async () => {
  // Cleanup after each test
});

afterAll(async () => {
  // Cleanup after all tests
  console.log('✅ Test suite completed');
});
