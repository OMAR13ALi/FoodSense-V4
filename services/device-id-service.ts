import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEVICE_UUID_KEY = 'device_uuid';

/**
 * Generates a simple UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets the device-specific identifier from expo-application
 * Returns null if unable to retrieve
 */
async function getDeviceSpecificId(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      // On Android, use androidId
      const androidId = Application.getAndroidId();
      if (androidId) {
        return `android_${androidId}`;
      }
    } else if (Platform.OS === 'ios') {
      // On iOS, use iOS ID for vendor (async)
      const iosId = await Application.getIosIdForVendorAsync();
      if (iosId) {
        return `ios_${iosId}`;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to get device-specific ID:', error);
    return null;
  }
}

/**
 * Gets or creates a persistent UUID stored in AsyncStorage
 */
async function getOrCreateStoredUUID(): Promise<string> {
  try {
    // Try to retrieve existing UUID
    let uuid = await AsyncStorage.getItem(DEVICE_UUID_KEY);

    if (!uuid) {
      // Generate new UUID and store it
      uuid = generateUUID();
      await AsyncStorage.setItem(DEVICE_UUID_KEY, uuid);
    }

    return uuid;
  } catch (error) {
    console.error('Failed to get/create stored UUID:', error);
    // Fallback to generating a new UUID (won't persist)
    return generateUUID();
  }
}

/**
 * Gets a unique device identifier.
 *
 * Strategy:
 * 1. Try to get platform-specific device ID (Android ID or iOS Vendor ID)
 * 2. Fallback to UUID stored in AsyncStorage
 * 3. Combine both for maximum reliability
 *
 * Returns format: "{deviceId}_{uuid}" or just "{uuid}" if device ID unavailable
 */
export async function getDeviceId(): Promise<string> {
  const [deviceId, uuid] = await Promise.all([
    getDeviceSpecificId(),
    getOrCreateStoredUUID(),
  ]);

  if (deviceId && uuid) {
    // Best case: both available
    return `${deviceId}_${uuid}`;
  } else if (deviceId) {
    // Device ID only (shouldn't happen since UUID has fallback)
    return deviceId;
  } else {
    // UUID only (device ID unavailable)
    return `uuid_${uuid}`;
  }
}

/**
 * Clears the stored UUID (for testing purposes)
 * WARNING: This will create a new device identity
 */
export async function resetDeviceId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DEVICE_UUID_KEY);
  } catch (error) {
    console.error('Failed to reset device ID:', error);
  }
}
