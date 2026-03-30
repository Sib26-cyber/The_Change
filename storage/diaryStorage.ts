// storage/diaryStorage.ts
// This file handles all reading and writing of diary entries to local device storage.
// It uses AsyncStorage, which stores data as JSON strings on the device.
// This approach was chosen because the diary data does not need to sync to a server
// and keeping it local means the app works fully offline.

import AsyncStorage from "@react-native-async-storage/async-storage";

// SymptomFlags represents which symptoms the user reported on a given day.
// Each symptom is a boolean so it is easy to count frequency across multiple entries.
export type SymptomFlags = {
  hotFlushes: boolean;
  sleepIssues: boolean;
  anxiety: boolean;
  brainFog: boolean;
  lowEnergy: boolean;
};

// CycleStatus captures the user's menstrual cycle for that day.
// Using a union type here keeps the possible values explicit and avoids
// storing arbitrary strings that would break the analytics logic.
export type CycleStatus = "none" | "spotting" | "bleeding" | "unknown";

// DiaryEntry is the main data structure for a single day's log.
// The id is a timestamp string so entries can be uniquely identified
// without needing a database to generate an auto-increment value.
export type DiaryEntry = {
  id: string;
  mood: number | null;    // stored as a number from 1 to 5
  note: string;
  symptoms: SymptomFlags;
  cycle: CycleStatus;
  createdAt: string;      // stored as an ISO 8601 date string
};

// The key used to store and retrieve all diary entries in AsyncStorage.
const DIARY_KEY = "diary_entries";

// loadRawEntries reads all stored entries and maps them into DiaryEntry objects.
// The mapping is written defensively because the schema evolved during development.
// Older entries stored the text field as "text" before it was renamed to "note",
// so both field names are checked to avoid losing earlier data.
async function loadRawEntries(): Promise<DiaryEntry[]> {
  const json = await AsyncStorage.getItem(DIARY_KEY);
  if (!json) return [];

  try {
    const parsed = JSON.parse(json) as any[];

    return parsed.map((e, idx) => {
      // Default all symptoms to false so that entries saved before a new
      // symptom was added still load without throwing an undefined error.
      const fallbackSymptoms: SymptomFlags = {
        hotFlushes: false,
        sleepIssues: false,
        anxiety: false,
        brainFog: false,
        lowEnergy: false,
      };

      // Validate the stored cycle value against the allowed union type.
      // If the value is unrecognised (for example from a corrupted entry),
      // it defaults to "none" so the rest of the entry can still be displayed.
      const cycleRaw = e.cycle as CycleStatus | undefined;
      const cycle: CycleStatus =
        cycleRaw === "spotting" ||
        cycleRaw === "bleeding" ||
        cycleRaw === "unknown" ||
        cycleRaw === "none"
          ? cycleRaw
          : "none";

      return {
        // Generate a fallback id if one was not stored, using the current
        // timestamp plus the array index to keep each id unique.
        id: e.id?.toString() ?? String(Date.now() + idx),
        mood: typeof e.mood === "number" ? e.mood : null,
        // Support both the old "text" field name and the current "note" field name.
        note:
          typeof e.text === "string"
            ? e.text
            : typeof e.note === "string"
            ? e.note
            : "",
        // Merge stored symptoms over the defaults so missing keys are always present.
        symptoms: {
          ...fallbackSymptoms,
          ...(e.symptoms || {}),
        },
        cycle,
        createdAt: e.createdAt || new Date().toISOString(),
      } as DiaryEntry;
    });
  } catch {
    // If parsing fails for any reason, return an empty array rather than
    // crashing the app. The user can still create new entries.
    return [];
  }
}

// Returns all diary entries stored on the device.
export async function getDiaryEntries(): Promise<DiaryEntry[]> {
  return loadRawEntries();
}

// Adds a new diary entry and saves the updated list back to storage.
// The id is set here using Date.now() so each entry gets a unique timestamp-based key.
export async function addDiaryEntry(
  entry: Omit<DiaryEntry, "id">
): Promise<void> {
  const entries = await loadRawEntries();

  const newEntry: DiaryEntry = {
    ...entry,
    id: Date.now().toString(),
  };

  // New entries are prepended so the most recent entry appears first in the list.
  const updated = [newEntry, ...entries];
  await AsyncStorage.setItem(DIARY_KEY, JSON.stringify(updated));
}

// Removes a single entry by its id, then saves the remaining entries.
export async function deleteDiaryEntry(id: string): Promise<void> {
  const entries = await loadRawEntries();
  const filtered = entries.filter((e) => e.id !== id);
  await AsyncStorage.setItem(DIARY_KEY, JSON.stringify(filtered));
}

// Wipes all diary entries from storage. This is called when the user
// chooses to reset the app from the settings screen.
export async function clearDiaryEntries(): Promise<void> {
  await AsyncStorage.removeItem(DIARY_KEY);
}

// Ensures only one diary entry exists per calendar day.
// If the user opens the diary a second time on the same day, this function
// updates the existing entry rather than creating a duplicate.
export async function upsertTodayDiaryEntry(
  partial: Omit<DiaryEntry, "id" | "createdAt">
): Promise<void> {
  const entries = await loadRawEntries();

  // Get today's date as a YYYY-MM-DD string to compare against stored entries.
  const todayStr = new Date().toISOString().slice(0, 10);

  const existingIndex = entries.findIndex((e) => {
    if (!e.createdAt) return false;
    return e.createdAt.slice(0, 10) === todayStr;
  });

  if (existingIndex >= 0) {
    // An entry already exists for today so update it in place,
    // preserving the original createdAt timestamp.
    const existing = entries[existingIndex];
    const updated: DiaryEntry = {
      ...existing,
      ...partial,
      createdAt: existing.createdAt,
    };
    entries[existingIndex] = updated;
    await AsyncStorage.setItem(DIARY_KEY, JSON.stringify(entries));
  } else {
    // No entry exists for today yet so create a new one.
    const createdAt = new Date().toISOString();
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      createdAt,
      ...partial,
    };
    const updatedEntries = [newEntry, ...entries];
    await AsyncStorage.setItem(DIARY_KEY, JSON.stringify(updatedEntries));
  }
}

