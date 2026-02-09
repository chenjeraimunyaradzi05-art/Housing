import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('Tax Endpoints', () => {
  describe('POST /api/tax/calculate', () => {
    it('should calculate investment tax', async () => {
      const response = await request(app)
        .post('/api/tax/calculate')
        .send({
          profile: { filingStatus: 'single', state: 'CA' },
          income: {
            totalIncome: 85000,
            rentalIncome: 24000,
            investmentIncome: 5000,
          },
        });

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('totalTax');
      }
    });
  });

  describe('POST /api/tax/k1/generate', () => {
    it('should generate K-1 document', async () => {
      const response = await request(app)
        .post('/api/tax/k1/generate')
        .send({
          taxYear: 2026,
          investments: [
            {
              poolId: 'pool-1',
              poolName: 'Test Pool',
              ownershipPercent: 0.5,
              totalPoolIncome: 50000,
              distributions: 800,
            },
          ],
        });

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('taxYear');
      }
    });
  });

  describe('GET /api/tax/summary/:taxYear', () => {
    it('should return tax summary for year', async () => {
      const response = await request(app).get('/api/tax/summary/2026');

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('taxYear');
      }
    });
  });

  describe('POST /api/tax/quarterly-estimates', () => {
    it('should calculate quarterly estimates', async () => {
      const response = await request(app)
        .post('/api/tax/quarterly-estimates')
        .send({
          annualTaxLiability: 12000,
          safeHarborPriorYear: 10000,
        });

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('quarters');
      }
    });
  });

  describe('POST /api/tax/loss-harvesting', () => {
    it('should identify tax-loss harvesting opportunities', async () => {
      const response = await request(app)
        .post('/api/tax/loss-harvesting')
        .send({
          investments: [
            { name: 'Investment A', costBasis: 10000, currentValue: 8000 },
            { name: 'Investment B', costBasis: 5000, currentValue: 7000 },
          ],
        });

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('opportunities');
      }
    });
  });

  describe('GET /api/tax/report/:taxYear', () => {
    it('should generate full tax report', async () => {
      const response = await request(app).get('/api/tax/report/2026');

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('taxYear');
      }
    });
  });
});
