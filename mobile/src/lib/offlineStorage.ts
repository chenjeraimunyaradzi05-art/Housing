import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { api } from './api';

// Storage keys
const STORAGE_KEYS = {
  OFFLINE_QUEUE: '@vor_offline_queue',
  CACHED_DATA: '@vor_cached_data',
  LAST_SYNC: '@vor_last_sync',
  USER_DATA: '@vor_user_data',
  PROPERTIES: '@vor_properties',
  INVESTMENTS: '@vor_investments',
  MESSAGES: '@vor_messages',
  NOTIFICATIONS: '@vor_notifications',
};

interface OfflineAction {
  id: string;
  type: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  data?: any;
  timestamp: number;
  retryCount: number;
}

interface CachedData<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Default cache duration: 1 hour
const DEFAULT_CACHE_DURATION = 60 * 60 * 1000;

// Maximum retry attempts for offline actions
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true && netInfo.isInternetReachable !== false;
  } catch (error) {
    console.error('Error checking network status:', error);
    return false;
  }
}

/**
 * Subscribe to network status changes
 */
export function subscribeToNetworkChanges(
  callback: (state: NetInfoState) => void
): () => void {
  return NetInfo.addEventListener(callback);
}

/**
 * Generate a unique ID for offline actions
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============ OFFLINE QUEUE MANAGEMENT ============

/**
 * Get all pending offline actions
 */
export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const queue = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
}

/**
 * Add an action to the offline queue
 */
export async function queueOfflineAction(
  type: OfflineAction['type'],
  endpoint: string,
  data?: any
): Promise<string> {
  try {
    const action: OfflineAction = {
      id: generateId(),
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const queue = await getOfflineQueue();
    queue.push(action);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));

    return action.id;
  } catch (error) {
    console.error('Error queuing offline action:', error);
    throw error;
  }
}

/**
 * Remove an action from the offline queue
 */
export async function removeFromOfflineQueue(actionId: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter(action => action.id !== actionId);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from offline queue:', error);
  }
}

/**
 * Process the offline queue when back online
 */
export async function processOfflineQueue(): Promise<{
  processed: number;
  failed: number;
}> {
  const online = await isOnline();
  if (!online) {
    return { processed: 0, failed: 0 };
  }

  const queue = await getOfflineQueue();
  let processed = 0;
  let failed = 0;

  for (const action of queue) {
    try {
      let result;

      switch (action.type) {
        case 'POST':
          result = await api.post(action.endpoint, action.data);
          break;
        case 'PUT':
          result = await api.put(action.endpoint, action.data);
          break;
        case 'PATCH':
          result = await api.patch(action.endpoint, action.data);
          break;
        case 'DELETE':
          result = await api.delete(action.endpoint);
          break;
      }

      if (result.success) {
        await removeFromOfflineQueue(action.id);
        processed++;
      } else {
        throw new Error(result.error || 'Request failed');
      }
    } catch (error) {
      console.error(`Error processing offline action ${action.id}:`, error);

      // Increment retry count
      action.retryCount++;

      if (action.retryCount >= MAX_RETRY_ATTEMPTS) {
        // Remove action after max retries
        await removeFromOfflineQueue(action.id);
        failed++;
      } else {
        // Update retry count in queue
        const currentQueue = await getOfflineQueue();
        const index = currentQueue.findIndex(a => a.id === action.id);
        if (index !== -1) {
          currentQueue[index] = action;
          await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(currentQueue));
        }
        failed++;
      }
    }
  }

  return { processed, failed };
}

// ============ DATA CACHING ============

/**
 * Cache data with expiration
 */
export async function cacheData<T>(
  key: string,
  data: T,
  duration: number = DEFAULT_CACHE_DURATION
): Promise<void> {
  try {
    const cached: CachedData<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
    };

    const cacheKey = `${STORAGE_KEYS.CACHED_DATA}_${key}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (error) {
    console.error('Error caching data:', error);
  }
}

/**
 * Get cached data
 */
export async function getCachedData<T>(
  key: string,
  allowExpired: boolean = false
): Promise<T | null> {
  try {
    const cacheKey = `${STORAGE_KEYS.CACHED_DATA}_${key}`;
    const stored = await AsyncStorage.getItem(cacheKey);

    if (!stored) {
      return null;
    }

    const cached: CachedData<T> = JSON.parse(stored);

    // Check if expired
    if (!allowExpired && cached.expiresAt < Date.now()) {
      // Remove expired data
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return cached.data;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
}

/**
 * Clear specific cached data
 */
export async function clearCachedData(key: string): Promise<void> {
  try {
    const cacheKey = `${STORAGE_KEYS.CACHED_DATA}_${key}`;
    await AsyncStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error clearing cached data:', error);
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCachedData(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.CACHED_DATA));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Error clearing all cached data:', error);
  }
}

// ============ ENTITY-SPECIFIC CACHING ============

/**
 * Cache user data
 */
export async function cacheUserData(userData: any): Promise<void> {
  await cacheData(STORAGE_KEYS.USER_DATA, userData, 24 * 60 * 60 * 1000); // 24 hours
}

/**
 * Get cached user data
 */
export async function getCachedUserData(): Promise<any | null> {
  return getCachedData(STORAGE_KEYS.USER_DATA, true); // Allow expired for offline
}

/**
 * Cache properties
 */
export async function cacheProperties(properties: any[]): Promise<void> {
  await cacheData(STORAGE_KEYS.PROPERTIES, properties);
}

/**
 * Get cached properties
 */
export async function getCachedProperties(): Promise<any[] | null> {
  return getCachedData(STORAGE_KEYS.PROPERTIES, true);
}

/**
 * Cache investments
 */
export async function cacheInvestments(investments: any[]): Promise<void> {
  await cacheData(STORAGE_KEYS.INVESTMENTS, investments);
}

/**
 * Get cached investments
 */
export async function getCachedInvestments(): Promise<any[] | null> {
  return getCachedData(STORAGE_KEYS.INVESTMENTS, true);
}

/**
 * Cache messages
 */
export async function cacheMessages(conversationId: string, messages: any[]): Promise<void> {
  await cacheData(`${STORAGE_KEYS.MESSAGES}_${conversationId}`, messages);
}

/**
 * Get cached messages
 */
export async function getCachedMessages(conversationId: string): Promise<any[] | null> {
  return getCachedData(`${STORAGE_KEYS.MESSAGES}_${conversationId}`, true);
}

// ============ SYNC MANAGEMENT ============

/**
 * Record last sync time
 */
export async function recordSync(entity: string): Promise<void> {
  try {
    const syncData = await getLastSyncTimes();
    syncData[entity] = Date.now();
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, JSON.stringify(syncData));
  } catch (error) {
    console.error('Error recording sync:', error);
  }
}

/**
 * Get last sync times
 */
export async function getLastSyncTimes(): Promise<Record<string, number>> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error getting last sync times:', error);
    return {};
  }
}

/**
 * Check if entity needs sync
 */
export async function needsSync(entity: string, maxAge: number = DEFAULT_CACHE_DURATION): Promise<boolean> {
  const syncTimes = await getLastSyncTimes();
  const lastSync = syncTimes[entity];

  if (!lastSync) {
    return true;
  }

  return Date.now() - lastSync > maxAge;
}

// ============ FETCH WITH OFFLINE SUPPORT ============

interface FetchOptions<T> {
  cacheKey?: string;
  cacheDuration?: number;
  offlineDefault?: T;
}

/**
 * Fetch data with offline support
 */
export async function fetchWithOfflineSupport<T>(
  endpoint: string,
  options: FetchOptions<T> = {}
): Promise<{ data: T | null; isOffline: boolean; fromCache: boolean }> {
  const { cacheKey, cacheDuration, offlineDefault } = options;
  const online = await isOnline();

  // If offline, return cached data
  if (!online) {
    if (cacheKey) {
      const cached = await getCachedData<T>(cacheKey, true);
      if (cached) {
        return { data: cached, isOffline: true, fromCache: true };
      }
    }
    return { data: offlineDefault || null, isOffline: true, fromCache: false };
  }

  // Fetch fresh data
  try {
    const result = await api.get<T>(endpoint);

    if (result.success && result.data) {
      // Cache the data
      if (cacheKey) {
        await cacheData(cacheKey, result.data, cacheDuration);
      }
      return { data: result.data, isOffline: false, fromCache: false };
    }

    // Fetch failed, try cache
    if (cacheKey) {
      const cached = await getCachedData<T>(cacheKey, true);
      if (cached) {
        return { data: cached, isOffline: false, fromCache: true };
      }
    }

    return { data: offlineDefault || null, isOffline: false, fromCache: false };
  } catch (error) {
    console.error('Error fetching data:', error);

    // Error occurred, try cache
    if (cacheKey) {
      const cached = await getCachedData<T>(cacheKey, true);
      if (cached) {
        return { data: cached, isOffline: false, fromCache: true };
      }
    }

    return { data: offlineDefault || null, isOffline: false, fromCache: false };
  }
}

/**
 * Mutate data with offline support
 */
export async function mutateWithOfflineSupport(
  type: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any
): Promise<{ success: boolean; queued: boolean }> {
  const online = await isOnline();

  if (!online) {
    // Queue for later
    await queueOfflineAction(type, endpoint, data);
    return { success: false, queued: true };
  }

  // Try to execute immediately
  try {
    let result;

    switch (type) {
      case 'POST':
        result = await api.post(endpoint, data);
        break;
      case 'PUT':
        result = await api.put(endpoint, data);
        break;
      case 'PATCH':
        result = await api.patch(endpoint, data);
        break;
      case 'DELETE':
        result = await api.delete(endpoint);
        break;
    }

    return { success: result.success || false, queued: false };
  } catch (error) {
    // Network error, queue for later
    await queueOfflineAction(type, endpoint, data);
    return { success: false, queued: true };
  }
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const vorKeys = keys.filter(key => key.startsWith('@vor_'));
    await AsyncStorage.multiRemove(vorKeys);
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
}
