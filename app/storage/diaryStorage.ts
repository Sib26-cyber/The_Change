// app/storage/diaryStorage.ts
import * as SecureStore from "expo-secure-store";

export type DiaryEntry = {
  id: string;
  text: string;
  createdAt: string; // ISO date string
};

const DIARY_KEY = "diary_entries";

async function loadRawEntries(): Promise<DiaryEntry[]> {
  const json = await SecureStore.getItemAsync(DIARY_KEY);
  if (!json) return [];
  try {
    return JSON.parse(json) as DiaryEntry[];
  } catch {
    return [];
  }
}

export async function getDiaryEntries(): Promise<DiaryEntry[]> {
  return loadRawEntries();
}

export async function addDiaryEntry(text: string): Promise<void> {
  const entries = await loadRawEntries();

  const newEntry: DiaryEntry = {
    id: Date.now().toString(),
    text,
    createdAt: new Date().toISOString(),
  };

  const updated = [newEntry, ...entries];
  await SecureStore.setItemAsync(DIARY_KEY, JSON.stringify(updated));
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  const entries = await loadRawEntries();
  const filtered = entries.filter((e) => e.id !== id);
  await SecureStore.setItemAsync(DIARY_KEY, JSON.stringify(filtered));
}

export async function clearDiaryEntries(): Promise<void> {
  await SecureStore.deleteItemAsync(DIARY_KEY);
}
