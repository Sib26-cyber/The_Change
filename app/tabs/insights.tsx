// app/tabs/insights.tsx
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  CycleStatus,
  DiaryEntry,
  getDiaryEntries,
  SymptomFlags,
} from "../../storage/diaryStorage";

const cycleLabel = (c: CycleStatus): string => {
  switch (c) {
    case "none":
      return "No bleeding";
    case "spotting":
      return "Spotting / light";
    case "bleeding":
      return "Period / bleeding";
    case "unknown":
    default:
      return "Not sure";
  }
};
type PeriodEpisode = {
  start: Date;
  end?: Date; // may be ongoing
};

function derivePeriods(sortedEntries: DiaryEntry[]): PeriodEpisode[] {
  // entries should be oldest → newest
  const periods: PeriodEpisode[] = [];
  let current: PeriodEpisode | null = null;

  for (const e of sortedEntries) {
    const isBleeding = e.cycle === "bleeding";

    if (isBleeding) {
      if (!current) {
        // starting a new period
        current = { start: new Date(e.createdAt) };
      }
      // if already in a period, just continue
    } else {
      if (current) {
        // we were in a period and it just ended
        current.end = new Date(e.createdAt);
        periods.push(current);
        current = null;
      }
    }
  }

  // if bleeding never turned off, we have an ongoing period
  if (current) {
    periods.push(current);
  }

  return periods;
}

export default function InsightsScreen() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await getDiaryEntries();
      setEntries(stored);
      setLoading(false);
    };
    load();
  }, []);

  const total = entries.length;

  const avgMood =
    total === 0
      ? null
      : entries.reduce((sum, e) => sum + (e.mood ?? 0), 0) /
        entries.filter((e) => e.mood != null).length;

  const symptomCounts: Record<keyof SymptomFlags, number> = {
    hotFlushes: 0,
    sleepIssues: 0,
    anxiety: 0,
    brainFog: 0,
    lowEnergy: 0,
  };

  const cycleCounts: Record<CycleStatus, number> = {
    none: 0,
    spotting: 0,
    bleeding: 0,
    unknown: 0,
  };

  entries.forEach((e) => {
    if (e.symptoms.hotFlushes) symptomCounts.hotFlushes++;
    if (e.symptoms.sleepIssues) symptomCounts.sleepIssues++;
    if (e.symptoms.anxiety) symptomCounts.anxiety++;
    if (e.symptoms.brainFog) symptomCounts.brainFog++;
    if (e.symptoms.lowEnergy) symptomCounts.lowEnergy++;

    cycleCounts[e.cycle] = (cycleCounts[e.cycle] ?? 0) + 1;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Insights & history</Text>

      {loading ? (
        <Text style={styles.text}>Loading your check-ins…</Text>
      ) : total === 0 ? (
        <Text style={styles.text}>
          Once you have a few check-ins saved, you’ll see simple patterns in
          mood, symptoms and cycle here.
        </Text>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overview</Text>
            <Text style={styles.text}>Total check-ins: {total}</Text>
            {avgMood != null && !Number.isNaN(avgMood) && (
              <Text style={styles.text}>
                Average mood: {avgMood.toFixed(1)} / 5
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Symptoms frequency</Text>
            <Text style={styles.text}>
              Hot flushes: {symptomCounts.hotFlushes} day
              {symptomCounts.hotFlushes === 1 ? "" : "s"}
            </Text>
            <Text style={styles.text}>
              Sleep issues: {symptomCounts.sleepIssues} day
              {symptomCounts.sleepIssues === 1 ? "" : "s"}
            </Text>
            <Text style={styles.text}>
              Anxiety: {symptomCounts.anxiety} day
              {symptomCounts.anxiety === 1 ? "" : "s"}
            </Text>
            <Text style={styles.text}>
              Brain fog: {symptomCounts.brainFog} day
              {symptomCounts.brainFog === 1 ? "" : "s"}
            </Text>
            <Text style={styles.text}>
              Low energy: {symptomCounts.lowEnergy} day
              {symptomCounts.lowEnergy === 1 ? "" : "s"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cycle patterns</Text>
            <Text style={styles.text}>
              No bleeding: {cycleCounts.none} day
              {cycleCounts.none === 1 ? "" : "s"}
            </Text>
            <Text style={styles.text}>
              Spotting / light: {cycleCounts.spotting} day
              {cycleCounts.spotting === 1 ? "" : "s"}
            </Text>
            <Text style={styles.text}>
              Period / bleeding: {cycleCounts.bleeding} day
              {cycleCounts.bleeding === 1 ? "" : "s"}
            </Text>
            <Text style={styles.text}>
              Not sure: {cycleCounts.unknown} day
              {cycleCounts.unknown === 1 ? "" : "s"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent history</Text>
            {entries.slice(0, 5).map((e) => (
              <View key={e.id} style={styles.historyItem}>
                <Text style={styles.historyDate}>
                  {new Date(e.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.historyLine} numberOfLines={2}>
                  Mood: {e.mood ?? "-"} | Cycle: {cycleLabel(e.cycle)}
                </Text>
                {e.note ? (
                  <Text style={styles.historyNote} numberOfLines={2}>
                    {e.note}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFDF7",
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0D8CE",
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    color: "#5A3E36",
    marginBottom: 2,
  },
  historyItem: {
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 11,
    color: "#A17A70",
  },
  historyLine: {
    fontSize: 13,
    color: "#5A3E36",
  },
  historyNote: {
    fontSize: 12,
    color: "#5A3E36",
  },
});
