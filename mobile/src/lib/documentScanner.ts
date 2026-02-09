import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import { api } from './api';

export interface ScannedDocument {
  uri: string;
  base64?: string;
  width: number;
  height: number;
  type: string;
  name: string;
  size?: number;
}

export type DocumentType = 'id' | 'passport' | 'proof_of_address' | 'financial' | 'other';

/**
 * Request camera permissions
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission in Settings to scan documents.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
}

/**
 * Request media library permissions
 */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please grant photo library permission in Settings to select documents.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting media library permission:', error);
    return false;
  }
}

/**
 * Capture document using camera
 */
export async function captureDocument(): Promise<ScannedDocument | null> {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    return null;
  }

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
      aspect: [4, 3], // Standard document aspect ratio
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const filename = asset.uri.split('/').pop() || `document_${Date.now()}.jpg`;

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(asset.uri);

    return {
      uri: asset.uri,
      base64: asset.base64,
      width: asset.width || 0,
      height: asset.height || 0,
      type: asset.mimeType || 'image/jpeg',
      name: filename,
      size: fileInfo.exists ? fileInfo.size : undefined,
    };
  } catch (error) {
    console.error('Error capturing document:', error);
    Alert.alert('Error', 'Failed to capture document. Please try again.');
    return null;
  }
}

/**
 * Select document from library
 */
export async function selectDocument(): Promise<ScannedDocument | null> {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) {
    return null;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const filename = asset.uri.split('/').pop() || `document_${Date.now()}.jpg`;

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(asset.uri);

    return {
      uri: asset.uri,
      base64: asset.base64,
      width: asset.width || 0,
      height: asset.height || 0,
      type: asset.mimeType || 'image/jpeg',
      name: filename,
      size: fileInfo.exists ? fileInfo.size : undefined,
    };
  } catch (error) {
    console.error('Error selecting document:', error);
    Alert.alert('Error', 'Failed to select document. Please try again.');
    return null;
  }
}

/**
 * Show action sheet to choose capture method
 */
export async function scanDocument(): Promise<ScannedDocument | null> {
  return new Promise((resolve) => {
    Alert.alert(
      'Scan Document',
      'How would you like to add your document?',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const doc = await captureDocument();
            resolve(doc);
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const doc = await selectDocument();
            resolve(doc);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ]
    );
  });
}

/**
 * Upload scanned document to server
 */
export async function uploadDocument(
  document: ScannedDocument,
  documentType: DocumentType,
  description?: string
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    // Create form data
    const formData = new FormData();

    formData.append('file', {
      uri: document.uri,
      type: document.type,
      name: document.name,
    } as any);

    formData.append('documentType', documentType);

    if (description) {
      formData.append('description', description);
    }

    // Upload to server
    const response = await fetch(`${api.baseUrl}/api/documents/upload`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        documentId: result.documentId || result.id,
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to upload document',
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
}

/**
 * Validate document quality
 */
export function validateDocumentQuality(document: ScannedDocument): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check minimum resolution (e.g., 800x600)
  if (document.width < 800 || document.height < 600) {
    errors.push('Image resolution is too low. Please capture a clearer image.');
  }

  // Check maximum file size (e.g., 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (document.size && document.size > maxSize) {
    errors.push('File size is too large. Maximum allowed is 10MB.');
  }

  // Check supported formats
  const supportedTypes = ['image/jpeg', 'image/png', 'image/heic'];
  if (!supportedTypes.includes(document.type)) {
    errors.push('Unsupported file format. Please use JPEG, PNG, or HEIC.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get document type label
 */
export function getDocumentTypeLabel(type: DocumentType): string {
  switch (type) {
    case 'id':
      return 'Government ID';
    case 'passport':
      return 'Passport';
    case 'proof_of_address':
      return 'Proof of Address';
    case 'financial':
      return 'Financial Document';
    case 'other':
      return 'Other Document';
    default:
      return 'Document';
  }
}

/**
 * Delete a local document file
 */
export async function deleteLocalDocument(uri: string): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri);
    }
    return true;
  } catch (error) {
    console.error('Error deleting local document:', error);
    return false;
  }
}
