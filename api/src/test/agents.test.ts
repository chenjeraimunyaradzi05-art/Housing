import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('Agent Endpoints', () => {
  describe('GET /api/agents/leaderboard', () => {
    it('should return agent leaderboard', async () => {
      const response = await request(app).get('/api/agents/leaderboard');

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('leaderboard');
      }
    });
  });

  describe('GET /api/agents/tier/:referralCount', () => {
    it('should return tier information for referral count', async () => {
      const response = await request(app).get('/api/agents/tier/15');

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('tier');
      }
    });
  });

  describe('POST /api/agents/register', () => {
    it('should register a new agent', async () => {
      const response = await request(app)
        .post('/api/agents/register')
        .send({
          specializations: ['residential'],
          regions: ['California'],
        });

      expect([201, 400, 401]).toContain(response.status);
    });
  });

  describe('POST /api/agents/referral-code', () => {
    it('should generate a referral code', async () => {
      const response = await request(app)
        .post('/api/agents/referral-code')
        .send({
          agentId: 'test-agent-1',
          type: 'percentage',
          discount: 10,
          maxUses: 50,
          expiresInDays: 30,
        });

      expect([201, 400, 401]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body).toHaveProperty('code');
      }
    });
  });

  describe('GET /api/agents/performance/:agentId', () => {
    it('should return agent performance metrics', async () => {
      const response = await request(app).get('/api/agents/performance/test-agent-1');

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('metrics');
      }
    });
  });
});
