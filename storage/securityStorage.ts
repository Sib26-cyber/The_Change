// storage/securityStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const PIN_KEY = "user_pin";
const DIARY_KEY = "diary_entries";

// Save PIN securely
export async function savePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

// Retrieve PIN
export async function getPin(): Promise<string | null> {
  return await SecureStore.getItemAsync(PIN_KEY);
}

// Delete PIN only
export async function deletePin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}

// Clear ALL local data — diary + PIN
export async function clearAllData(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);     // remove PIN
  await AsyncStorage.removeItem(DIARY_KEY);       // remove diary entries
}
