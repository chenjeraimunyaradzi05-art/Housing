import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = '@vor_biometric_enabled';

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

/**
 * Check if the device supports biometric authentication
 */
export async function isBiometricSupported(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.error('Error checking biometric support:', error);
    return false;
  }
}

/**
 * Check if biometrics are enrolled on the device
 */
export async function isBiometricEnrolled(): Promise<boolean> {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Error checking biometric enrollment:', error);
    return false;
  }
}

/**
 * Get the type of biometric authentication available
 */
export async function getBiometricType(): Promise<BiometricType> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'face';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }

    return 'none';
  } catch (error) {
    console.error('Error getting biometric type:', error);
    return 'none';
  }
}

/**
 * Get a friendly name for the biometric type
 */
export function getBiometricTypeName(type: BiometricType): string {
  switch (type) {
    case 'face':
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    case 'fingerprint':
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    case 'iris':
      return 'Iris Scan';
    default:
      return 'Biometric';
  }
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometrics(
  promptMessage: string = 'Authenticate to continue'
): Promise<BiometricAuthResult> {
  try {
    // Check if biometric is supported and enrolled
    const supported = await isBiometricSupported();
    if (!supported) {
      return {
        success: false,
        error: 'Biometric authentication is not supported on this device',
      };
    }

    const enrolled = await isBiometricEnrolled();
    if (!enrolled) {
      return {
        success: false,
        error: 'No biometric credentials enrolled. Please set up biometrics in device settings.',
      };
    }

    // Attempt authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false, // Allow PIN/passcode as fallback
    });

    if (result.success) {
      return { success: true };
    }

    // Handle different error scenarios
    if (result.error === 'user_cancel') {
      return {
        success: false,
        error: 'Authentication cancelled',
      };
    }

    if (result.error === 'user_fallback') {
      return {
        success: false,
        error: 'User chose to use passcode',
      };
    }

    return {
      success: false,
      error: result.error || 'Authentication failed',
    };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during authentication',
    };
  }
}

/**
 * Check if biometric authentication is enabled in app settings
 */
export async function isBiometricAuthEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking biometric setting:', error);
    return false;
  }
}

/**
 * Enable or disable biometric authentication in app settings
 */
export async function setBiometricAuthEnabled(enabled: boolean): Promise<boolean> {
  try {
    if (enabled) {
      // Verify biometric is available before enabling
      const supported = await isBiometricSupported();
      const enrolled = await isBiometricEnrolled();

      if (!supported) {
        Alert.alert(
          'Not Supported',
          'Biometric authentication is not supported on this device.'
        );
        return false;
      }

      if (!enrolled) {
        Alert.alert(
          'Not Set Up',
          'Please set up biometric authentication in your device settings first.'
        );
        return false;
      }

      // Verify user can authenticate before enabling
      const result = await authenticateWithBiometrics(
        'Confirm your identity to enable biometric login'
      );

      if (!result.success) {
        return false;
      }
    }

    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled.toString());
    return true;
  } catch (error) {
    console.error('Error setting biometric auth:', error);
    return false;
  }
}

/**
 * Perform biometric authentication for app unlock
 */
export async function biometricAppUnlock(): Promise<boolean> {
  const enabled = await isBiometricAuthEnabled();

  if (!enabled) {
    // Biometric not enabled, skip
    return true;
  }

  const biometricType = await getBiometricType();
  const typeName = getBiometricTypeName(biometricType);

  const result = await authenticateWithBiometrics(
    `Use ${typeName} to unlock VÖR`
  );

  return result.success;
}

/**
 * Hook for biometric authentication state
 */
export async function getBiometricCapabilities() {
  const [supported, enrolled, type, enabled] = await Promise.all([
    isBiometricSupported(),
    isBiometricEnrolled(),
    getBiometricType(),
    isBiometricAuthEnabled(),
  ]);

  return {
    isSupported: supported,
    isEnrolled: enrolled,
    biometricType: type,
    biometricTypeName: getBiometricTypeName(type),
    isEnabled: enabled,
    canEnable: supported && enrolled,
  };
}
