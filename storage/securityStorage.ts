// storage/securityStorage.ts
// This file manages the PIN used to lock and unlock the app.
// The PIN is stored using expo-secure-store rather than AsyncStorage because
// SecureStore writes to the device keychain on iOS and the Android Keystore,
// which means the value is encrypted at rest and not accessible to other apps.
// Diary entries use AsyncStorage because they are less sensitive, but the PIN
// must be held to a higher security standard as it controls access to the app.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const PIN_KEY = "user_pin";
const DIARY_KEY = "diary_entries";

// Saves the user's chosen PIN to the device keychain.
export async function savePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

// Retrieves the stored PIN, or returns null if no PIN has been set yet.
// The unlock screen uses this to check whether the entered PIN matches.
export async function getPin(): Promise<string | null> {
  return await SecureStore.getItemAsync(PIN_KEY);
}

// Removes only the PIN, leaving diary data intact.
// This is used when the user changes their PIN.
export async function deletePin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}

// Removes all locally stored data including the PIN and all diary entries.
// This is called when the user selects the full reset option in settings.
export async function clearAllData(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
  await AsyncStorage.removeItem(DIARY_KEY);
}
