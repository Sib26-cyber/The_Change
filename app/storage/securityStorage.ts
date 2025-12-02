// app/storage/securityStorage.ts
import * as SecureStore from "expo-secure-store";

const PIN_KEY = "user_pin";
const DIARY_KEY = "diary_entries"; // used when clearing all data

export async function savePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function getPin(): Promise<string | null> {
  return await SecureStore.getItemAsync(PIN_KEY);
}

export async function clearAllData(): Promise<void> {
  // delete PIN
  await SecureStore.deleteItemAsync(PIN_KEY);
  // delete diary entries
  await SecureStore.deleteItemAsync(DIARY_KEY);
}
