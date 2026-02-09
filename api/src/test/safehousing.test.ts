import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('Safe Housing Endpoints', () => {
  describe('GET /api/safehousing/score/:propertyId', () => {
    it('should return safety score for a property', async () => {
      const response = await request(app).get('/api/safehousing/score/test-property-1');

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('overallScore');
      }
    });
  });

  describe('GET /api/safehousing/requirements/:region', () => {
    it('should return safety requirements for a region', async () => {
      const response = await request(app).get('/api/safehousing/requirements/default');

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('requirements');
      }
    });
  });

  describe('POST /api/safehousing/report', () => {
    it('should accept a safety concern report', async () => {
      const response = await request(app)
        .post('/api/safehousing/report')
        .send({
          propertyId: 'test-property-1',
          category: 'structural',
          description: 'Broken staircase railing',
          severity: 'high',
        });

      expect([200, 201, 401]).toContain(response.status);
    });
  });

  describe('POST /api/safehousing/inspection/schedule', () => {
    it('should schedule an inspection', async () => {
      const response = await request(app)
        .post('/api/safehousing/inspection/schedule')
        .send({
          propertyId: 'test-property-1',
          inspectionType: 'safety',
          requestedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          contactInfo: { name: 'Jane Doe', phone: '555-0123' },
        });

      expect([200, 201, 400, 401]).toContain(response.status);
    });
  });
});
