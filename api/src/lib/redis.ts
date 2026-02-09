/**
 * Redis Client Configuration
 * Provides caching, session storage, and rate limiting support
 */

import Redis from 'ioredis';
import config from '../config';

let redisClient: Redis | null = null;

/**
 * Get Redis client instance (singleton pattern)
 */
export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 10) {
        console.error('Redis: Max reconnection attempts reached');
        return null;
      }
      return Math.min(times * 100, 3000);
    },
    lazyConnect: true,
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redisClient.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
  });

  return redisClient;
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed');
  }
}

/**
 * Check Redis connection health
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

// ==================== CACHING UTILITIES ====================

const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Get cached value
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set cached value with optional TTL
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL
): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

/**
 * Delete cached value
 */
export async function deleteCached(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}

/**
 * Delete all keys matching pattern
 */
export async function deleteByPattern(pattern: string): Promise<number> {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return keys.length;
  } catch (error) {
    console.error('Redis deleteByPattern error:', error);
    return 0;
  }
}

// ==================== SESSION UTILITIES ====================

const SESSION_PREFIX = 'session:';
const SESSION_TTL = 86400; // 24 hours

/**
 * Store user session
 */
export async function setSession(
  userId: string,
  sessionId: string,
  data: Record<string, unknown>
): Promise<boolean> {
  const key = `${SESSION_PREFIX}${userId}:${sessionId}`;
  return setCached(key, { ...data, createdAt: Date.now() }, SESSION_TTL);
}

/**
 * Get user session
 */
export async function getSession(
  userId: string,
  sessionId: string
): Promise<Record<string, unknown> | null> {
  const key = `${SESSION_PREFIX}${userId}:${sessionId}`;
  return getCached(key);
}

/**
 * Delete user session
 */
export async function deleteSession(userId: string, sessionId: string): Promise<boolean> {
  const key = `${SESSION_PREFIX}${userId}:${sessionId}`;
  return deleteCached(key);
}

/**
 * Delete all sessions for a user
 */
export async function deleteAllUserSessions(userId: string): Promise<number> {
  return deleteByPattern(`${SESSION_PREFIX}${userId}:*`);
}

// ==================== RATE LIMITING UTILITIES ====================

const RATE_LIMIT_PREFIX = 'ratelimit:';

/**
 * Check and increment rate limit counter
 * Returns { allowed: boolean, remaining: number, resetIn: number }
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  try {
    const client = getRedisClient();
    const key = `${RATE_LIMIT_PREFIX}${identifier}`;

    const count = await client.incr(key);
    let ttl = await client.ttl(key);

    // Set TTL on first request
    if (ttl === -1) {
      await client.expire(key, windowSeconds);
      ttl = windowSeconds;
    }

    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);

    return { allowed, remaining, resetIn: ttl };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if Redis is down
    return { allowed: true, remaining: limit, resetIn: 0 };
  }
}

/**
 * Reset rate limit for identifier
 */
export async function resetRateLimit(identifier: string): Promise<boolean> {
  return deleteCached(`${RATE_LIMIT_PREFIX}${identifier}`);
}

// ==================== CACHE KEY BUILDERS ====================

export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:${id}:profile`,
  property: (id: string) => `property:${id}`,
  propertyList: (filters: string) => `properties:list:${filters}`,
  pool: (id: string) => `pool:${id}`,
  poolList: (filters: string) => `pools:list:${filters}`,
  transactions: (userId: string, page: number) => `transactions:${userId}:${page}`,
  feed: (userId: string, page: number) => `feed:${userId}:${page}`,
} as const;

export default {
  getRedisClient,
  closeRedisConnection,
  isRedisHealthy,
  getCached,
  setCached,
  deleteCached,
  deleteByPattern,
  setSession,
  getSession,
  deleteSession,
  deleteAllUserSessions,
  checkRateLimit,
  resetRateLimit,
  CacheKeys,
};
