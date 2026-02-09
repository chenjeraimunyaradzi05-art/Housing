import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('WrongPassword123!', hash);

      expect(isMatch).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should return valid for strong password', () => {
      const result = validatePasswordStrength('StrongP@ssw0rd123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for short password', () => {
      const result = validatePasswordStrength('Short1!');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require uppercase letter', () => {
      const result = validatePasswordStrength('lowercase123!');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('uppercase'))).toBe(true);
    });

    it('should require lowercase letter', () => {
      const result = validatePasswordStrength('UPPERCASE123!');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('lowercase'))).toBe(true);
    });

    it('should require number', () => {
      const result = validatePasswordStrength('NoNumbers!!');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('number'))).toBe(true);
    });
  });
});
