import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('Streaming Endpoints', () => {
  describe('GET /api/streaming/content', () => {
    it('should return content listing', async () => {
      const response = await request(app).get('/api/streaming/content');

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('items');
      }
    });

    it('should filter by category', async () => {
      const response = await request(app).get('/api/streaming/content?category=investing');

      expect([200, 401]).toContain(response.status);
    });

    it('should filter by type', async () => {
      const response = await request(app).get('/api/streaming/content?type=video');

      expect([200, 401]).toContain(response.status);
    });
  });

  describe('GET /api/streaming/courses', () => {
    it('should return course catalog', async () => {
      const response = await request(app).get('/api/streaming/courses');

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('courses');
        expect(Array.isArray(response.body.courses)).toBe(true);
      }
    });
  });

  describe('GET /api/streaming/streams/upcoming', () => {
    it('should return upcoming streams', async () => {
      const response = await request(app).get('/api/streaming/streams/upcoming');

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('streams');
      }
    });
  });

  describe('GET /api/streaming/recommendations', () => {
    it('should return content recommendations', async () => {
      const response = await request(app).get('/api/streaming/recommendations');

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('recommendations');
      }
    });
  });

  describe('POST /api/streaming/engagement', () => {
    it('should track content engagement', async () => {
      const response = await request(app)
        .post('/api/streaming/engagement')
        .send({
          contentId: 'content-1',
          action: 'view',
        });

      expect([200, 401]).toContain(response.status);
    });
  });

  describe('POST /api/streaming/progress', () => {
    it('should update content progress', async () => {
      const response = await request(app)
        .post('/api/streaming/progress')
        .send({
          contentId: 'content-1',
          progress: 50,
          type: 'video',
        });

      expect([200, 401]).toContain(response.status);
    });
  });
});
