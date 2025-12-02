// app/storage/diaryStorage.ts
import * as SecureStore from "expo-secure-store";

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
  mood: number | null;      // 1–5, or null if not set
  note: string;
  symptoms: SymptomFlags;
  cycle: CycleStatus;
  createdAt: string;        // ISO date string
};

const DIARY_KEY = "diary_entries";

async function loadRawEntries(): Promise<DiaryEntry[]> {
  const json = await SecureStore.getItemAsync(DIARY_KEY);
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

export async function addDiaryEntry(entry: Omit<DiaryEntry, "id">): Promise<void> {
  const entries = await loadRawEntries();

  const newEntry: DiaryEntry = {
    ...entry,
    id: Date.now().toString(),
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
