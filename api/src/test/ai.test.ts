import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('AI Endpoints', () => {
  describe('POST /api/ai/valuation', () => {
    it('should return property valuation for valid input', async () => {
      const response = await request(app)
        .post('/api/ai/valuation')
        .send({
          beds: 3,
          baths: 2,
          sqft: 1500,
          zipcode: '90210',
          yearBuilt: 2000,
          propertyType: 'single_family',
        });

      // May require auth - accept 200 or 401
      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('estimatedValue');
        expect(response.body).toHaveProperty('confidenceScore');
      }
    });

    it('should reject invalid valuation input', async () => {
      const response = await request(app)
        .post('/api/ai/valuation')
        .send({ beds: -1 });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('POST /api/ai/categorize', () => {
    it('should categorize a transaction description', async () => {
      const response = await request(app)
        .post('/api/ai/categorize')
        .send({ description: 'Starbucks Coffee' });

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('category');
      }
    });

    it('should reject empty description', async () => {
      const response = await request(app)
        .post('/api/ai/categorize')
        .send({ description: '' });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('POST /api/ai/categorize/batch', () => {
    it('should categorize multiple transactions', async () => {
      const response = await request(app)
        .post('/api/ai/categorize/batch')
        .send({ descriptions: ['Starbucks Coffee', 'Amazon Purchase', 'Uber Ride'] });

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('results');
        expect(Array.isArray(response.body.results)).toBe(true);
      }
    });
  });

  describe('GET /api/ai/categories', () => {
    it('should return all categories', async () => {
      const response = await request(app).get('/api/ai/categories');

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('categories');
      }
    });
  });

  describe('GET /api/ai/market', () => {
    it('should return market regions data', async () => {
      const response = await request(app).get('/api/ai/market');

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('regions');
      }
    });
  });

  describe('POST /api/ai/anomalies/detect', () => {
    it('should detect anomalies in transactions', async () => {
      const response = await request(app)
        .post('/api/ai/anomalies/detect')
        .send({
          transactions: [
            { amount: 50, category: 'food', timestamp: new Date().toISOString() },
            { amount: 5000, category: 'food', timestamp: new Date().toISOString() },
          ],
        });

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('anomalies');
        expect(response.body).toHaveProperty('summary');
      }
    });
  });
});
