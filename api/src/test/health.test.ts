import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('Health Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      // Accept both 200 (db connected) and 503 (db not available in test)
      expect([200, 503]).toContain(response.status);
    });
  });

  describe('GET /api', () => {
    it('should return API info', async () => {
      const response = await request(app).get('/api');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Welcome to VÖR API');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });
});
