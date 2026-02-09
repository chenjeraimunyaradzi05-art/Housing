import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const PUSH_TOKEN_KEY = '@vor_push_token';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationData {
  type: string;
  id?: string;
  action?: string;
  [key: string]: any;
}

/**
 * Check if push notifications are supported
 */
export async function isPushNotificationSupported(): Promise<boolean> {
  return Device.isDevice;
}

/**
 * Request permission for push notifications
 */
export async function requestPushNotificationPermission(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications not available on simulator');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting push notification permission:', error);
    return false;
  }
}

/**
 * Get the Expo push token
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      return null;
    }

    const hasPermission = await requestPushNotificationPermission();
    if (!hasPermission) {
      return null;
    }

    // Get project ID from app config
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID || 'your-expo-project-id',
    });

    return token.data;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
}

/**
 * Register push token with backend
 */
export async function registerPushToken(): Promise<boolean> {
  try {
    const token = await getExpoPushToken();
    if (!token) {
      return false;
    }

    // Check if token has already been registered
    const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (storedToken === token) {
      // Token already registered
      return true;
    }

    // Register token with backend
    const result = await api.post('/api/notifications/push-token', {
      token,
      platform: Platform.OS,
      deviceId: Device.deviceName || 'Unknown',
    });

    if (result.success) {
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}

/**
 * Unregister push token from backend
 */
export async function unregisterPushToken(): Promise<boolean> {
  try {
    const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!storedToken) {
      return true;
    }

    const result = await api.delete('/api/notifications/push-token', {
      body: JSON.stringify({ token: storedToken }),
    });

    if (result.success) {
      await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    }

    return result.success || false;
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return false;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: PushNotificationData,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string | null> {
  try {
    const hasPermission = await requestPushNotificationPermission();
    if (!hasPermission) {
      return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: trigger || null, // null means immediate
    });

    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

/**
 * Get the current badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

/**
 * Set the app badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Clear the app badge
 */
export async function clearBadge(): Promise<void> {
  await setBadgeCount(0);
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Remove notification listener
 */
export function removeNotificationListener(subscription: Notifications.Subscription): void {
  Notifications.removeNotificationSubscription(subscription);
}

/**
 * Get the last notification response (for when app was launched from notification)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}

/**
 * Initialize push notifications for the app
 */
export async function initializePushNotifications(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): Promise<{
  receivedSubscription?: Notifications.Subscription;
  responseSubscription?: Notifications.Subscription;
}> {
  const subscriptions: {
    receivedSubscription?: Notifications.Subscription;
    responseSubscription?: Notifications.Subscription;
  } = {};

  // Register for push notifications
  await registerPushToken();

  // Set up listeners
  if (onNotificationReceived) {
    subscriptions.receivedSubscription = addNotificationReceivedListener(onNotificationReceived);
  }

  if (onNotificationTapped) {
    subscriptions.responseSubscription = addNotificationResponseListener(onNotificationTapped);

    // Check if app was launched from notification
    const lastResponse = await getLastNotificationResponse();
    if (lastResponse) {
      onNotificationTapped(lastResponse);
    }
  }

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF5E6C',
    });
  }

  return subscriptions;
}

/**
 * Clean up push notification listeners
 */
export function cleanupPushNotifications(subscriptions: {
  receivedSubscription?: Notifications.Subscription;
  responseSubscription?: Notifications.Subscription;
}): void {
  if (subscriptions.receivedSubscription) {
    removeNotificationListener(subscriptions.receivedSubscription);
  }
  if (subscriptions.responseSubscription) {
    removeNotificationListener(subscriptions.responseSubscription);
  }
}
