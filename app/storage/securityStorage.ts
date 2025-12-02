// app/storage/securityStorage.ts
import * as SecureStore from 'expo-secure-store';

const KEY_PIN = 'pin';

export async function savePin(pin: string) {
  try {
    await SecureStore.setItemAsync(KEY_PIN, pin);
  } catch (error) {
    console.warn('Failed to save PIN', error);
  }
}

export async function getPin(): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(KEY_PIN);
    return value;
  } catch (error) {
    console.warn('Failed to read PIN', error);
    return null;
  }
}

export async function clearPin() {
  try {
    await SecureStore.deleteItemAsync(KEY_PIN);
  } catch (error) {
    console.warn('Failed to clear PIN', error);
  }
}
