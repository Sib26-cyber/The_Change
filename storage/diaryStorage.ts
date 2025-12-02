// storage/diaryStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type SymptomFlags = {
  hotFlushes: boolean;
  sleepIssues: boolean;
  anxiety: boolean;
  brainFog: boolean;
  lowEnergy: boolean;
};

export type CycleStatus = "none" | "spotting" | "bleeding" | "unknown";

export type DiaryEntry = {
  id: string;
  mood: number | null;      // 1–5
  note: string;
  symptoms: SymptomFlags;
  cycle: CycleStatus;
  createdAt: string;        // ISO date
};

const DIARY_KEY = "diary_entries";

async function loadRawEntries(): Promise<DiaryEntry[]> {
  const json = await AsyncStorage.getItem(DIARY_KEY);
  if (!json) return [];

  try {
    const parsed = JSON.parse(json) as any[];

    return parsed.map((e, idx) => {
      const fallbackSymptoms: SymptomFlags = {
        hotFlushes: false,
        sleepIssues: false,
        anxiety: false,
        brainFog: false,
        lowEnergy: false,
      };

      const cycleRaw = e.cycle as CycleStatus | undefined;
      const cycle: CycleStatus =
        cycleRaw === "spotting" ||
        cycleRaw === "bleeding" ||
        cycleRaw === "unknown" ||
        cycleRaw === "none"
          ? cycleRaw
          : "none";

      return {
        id: e.id?.toString() ?? String(Date.now() + idx),
        mood: typeof e.mood === "number" ? e.mood : null,
        note:
          typeof e.text === "string"
            ? e.text
            : typeof e.note === "string"
            ? e.note
            : "",
        symptoms: {
          ...fallbackSymptoms,
          ...(e.symptoms || {}),
        },
        cycle,
        createdAt: e.createdAt || new Date().toISOString(),
      } as DiaryEntry;
    });
  } catch {
    return [];
  }
}

export async function getDiaryEntries(): Promise<DiaryEntry[]> {
  return loadRawEntries();
}

export async function addDiaryEntry(
  entry: Omit<DiaryEntry, "id">
): Promise<void> {
  const entries = await loadRawEntries();

  const newEntry: DiaryEntry = {
    ...entry,
    id: Date.now().toString(),
  };

  const updated = [newEntry, ...entries];
  await AsyncStorage.setItem(DIARY_KEY, JSON.stringify(updated));
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  const entries = await loadRawEntries();
  const filtered = entries.filter((e) => e.id !== id);
  await AsyncStorage.setItem(DIARY_KEY, JSON.stringify(filtered));
}

export async function clearDiaryEntries(): Promise<void> {
  await AsyncStorage.removeItem(DIARY_KEY);
}
// storage/diaryStorage.ts
// ...existing imports, types, DIARY_KEY, loadRawEntries, getDiaryEntries, addDiaryEntry, etc...

// NEW: ensure only one entry per calendar day
export async function upsertTodayDiaryEntry(
  partial: Omit<DiaryEntry, "id" | "createdAt">
): Promise<void> {
  const entries = await loadRawEntries();

  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  const existingIndex = entries.findIndex((e) => {
    if (!e.createdAt) return false;
    return e.createdAt.slice(0, 10) === todayStr;
  });

  if (existingIndex >= 0) {
    // update existing entry for today
    const existing = entries[existingIndex];
    const updated: DiaryEntry = {
      ...existing,
      ...partial,
      createdAt: existing.createdAt, // keep original date
    };
    entries[existingIndex] = updated;
    await AsyncStorage.setItem(DIARY_KEY, JSON.stringify(entries));
  } else {
    // create a brand new entry for today
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

