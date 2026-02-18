// app/tabs/analytics.tsx
// -------------------------------------------------------------
// Advanced analytics showing symptom trends, patterns, and insights
// -------------------------------------------------------------

import { isWithinInterval, parseISO, subDays } from "date-fns";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type DiaryEntry = {
  date: string;
  mood: string;
  sleep: string;
  bleeding: number;
  symptomsJSON: string;
  foodTriggersJSON: string;
};

type TimeRange = "week" | "month" | "all";

// Simple Bar component
const SimpleBar = ({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) => {
  const percentage = (value / maxValue) * 100;
  return (
    <View style={styles.barContainer}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );
};

// Simple Pie Slice component
const PieSlice = ({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) => {
  const percentage = ((value / total) * 100).toFixed(0);
  return (
    <View style={styles.pieSliceContainer}>
      <View style={[styles.pieSliceDot, { backgroundColor: color }]} />
      <Text style={styles.pieSliceText}>
        {label}: {value}x ({percentage}%)
      </Text>
    </View>
  );
};

export default function AnalyticsScreen() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const db = await SQLite.openDatabaseAsync("thechange.db");
    const rows = await db.getAllAsync<DiaryEntry>(
      "SELECT * FROM diary_entries ORDER BY date DESC",
    );
    setEntries(rows);
    setLoading(false);
  };

  // Filter entries based on selected time range
  const getFilteredEntries = () => {
    const now = new Date();
    const ranges = {
      week: subDays(now, 7),
      month: subDays(now, 30),
      all: new Date(0),
    };

    return entries.filter((entry) => {
      const entryDate = parseISO(entry.date);
      return isWithinInterval(entryDate, {
        start: ranges[timeRange],
        end: now,
      });
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D6765A" />
      </View>
    );
  }

  const filteredEntries = getFilteredEntries();

  if (filteredEntries.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noDataText}>
          No data available for this time period 💗
        </Text>
      </View>
    );
  }

  // -------------------------------------------------------------
  // Calculate Analytics
  // -------------------------------------------------------------

  // Mood distribution
  const moodCounts: Record<string, number> = {};
  filteredEntries.forEach((entry) => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
  });

  const moodColors: Record<string, string> = {
    sad: "#4A90E2", // Blue for sad
    neutral: "#9B59B6", // Purple for neutral
    calm: "#E67E96", // Pink for calm
    happy: "#D6456C", // Deep pink for happy
    joyful: "#C91F47", // Red for joyful
  };

  const maxMoodCount = Math.max(...Object.values(moodCounts), 1);

  // Symptom frequency
  const symptomCounts: Record<string, number> = {};
  filteredEntries.forEach((entry) => {
    const symptoms = JSON.parse(entry.symptomsJSON);
    Object.entries(symptoms).forEach(([key, value]) => {
      if (value) {
        const readable = key.replace(/([A-Z])/g, " $1").trim();
        symptomCounts[readable] = (symptomCounts[readable] || 0) + 1;
      }
    });
  });

  const topSymptoms = Object.entries(symptomCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxSymptomCount = Math.max(...topSymptoms.map(([, count]) => count), 1);

  // Food trigger frequency
  const triggerCounts: Record<string, number> = {};
  filteredEntries.forEach((entry) => {
    const triggers = JSON.parse(entry.foodTriggersJSON);
    Object.entries(triggers).forEach(([key, value]) => {
      if (value) {
        triggerCounts[key] = (triggerCounts[key] || 0) + 1;
      }
    });
  });

  const triggerColors: Record<string, string> = {
    spicy: "#FF6B6B",
    alcohol: "#9B59B6",
    caffeine: "#8B4513",
    sugar: "#FFB6C1",
  };

  const totalTriggers = Object.values(triggerCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  // Sleep quality stats
  const sleepCounts: Record<string, number> = {};
  filteredEntries.forEach((entry) => {
    sleepCounts[entry.sleep] = (sleepCounts[entry.sleep] || 0) + 1;
  });

  // Period tracking
  const periodDays = filteredEntries.filter((e) => e.bleeding === 1).length;

  return (
    <ScrollView style={styles.container}>
      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <TouchableOpacity
          style={[
            styles.timeButton,
            timeRange === "week" && styles.timeButtonActive,
          ]}
          onPress={() => setTimeRange("week")}
        >
          <Text
            style={[
              styles.timeButtonText,
              timeRange === "week" && styles.timeButtonTextActive,
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeButton,
            timeRange === "month" && styles.timeButtonActive,
          ]}
          onPress={() => setTimeRange("month")}
        >
          <Text
            style={[
              styles.timeButtonText,
              timeRange === "month" && styles.timeButtonTextActive,
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeButton,
            timeRange === "all" && styles.timeButtonActive,
          ]}
          onPress={() => setTimeRange("all")}
        >
          <Text
            style={[
              styles.timeButtonText,
              timeRange === "all" && styles.timeButtonTextActive,
            ]}
          >
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{filteredEntries.length}</Text>
          <Text style={styles.statLabel}>Total Entries</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{periodDays}</Text>
          <Text style={styles.statLabel}>Period Days</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {Object.keys(symptomCounts).length}
          </Text>
          <Text style={styles.statLabel}>Symptoms</Text>
        </View>
      </View>

      {/* Mood Distribution */}
      {Object.keys(moodCounts).length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>😊 Mood Distribution</Text>
          <View style={styles.chartWrapper}>
            {Object.entries(moodCounts).map(([mood, count]) => (
              <SimpleBar
                key={mood}
                label={mood.charAt(0).toUpperCase() + mood.slice(1)}
                value={count}
                maxValue={maxMoodCount}
                color={moodColors[mood] || "#999"}
              />
            ))}
          </View>
        </View>
      )}

      {/* Top Symptoms */}
      {topSymptoms.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>🩺 Most Common Symptoms</Text>
          <View style={styles.chartWrapper}>
            {topSymptoms.map(([symptom, count]) => (
              <SimpleBar
                key={symptom}
                label={symptom}
                value={count}
                maxValue={maxSymptomCount}
                color="#D6765A"
              />
            ))}
          </View>
        </View>
      )}

      {/* Food Triggers */}
      {Object.keys(triggerCounts).length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>🍽️ Food Trigger Frequency</Text>
          <View style={styles.chartWrapper}>
            {Object.entries(triggerCounts).map(([trigger, count]) => (
              <PieSlice
                key={trigger}
                label={trigger.charAt(0).toUpperCase() + trigger.slice(1)}
                value={count}
                total={totalTriggers}
                color={
                  triggerColors[trigger as keyof typeof triggerColors] || "#999"
                }
              />
            ))}
          </View>
        </View>
      )}

      {/* Sleep Quality */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>😴 Sleep Quality</Text>
        <View style={styles.sleepGrid}>
          {Object.entries(sleepCounts).map(([quality, count]) => (
            <View key={quality} style={styles.sleepCard}>
              <Text style={styles.sleepCount}>{count}</Text>
              <Text style={styles.sleepLabel}>
                {quality.charAt(0).toUpperCase() + quality.slice(1)} nights
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF6F9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FDF6F9",
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  timeRangeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 12,
  },
  timeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E3C4B5",
  },
  timeButtonActive: {
    backgroundColor: "#D6765A",
    borderColor: "#D6765A",
  },
  timeButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  timeButtonTextActive: {
    color: "#FFF",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#D6765A",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  chartSection: {
    marginBottom: 32,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5C4B51",
    marginBottom: 16,
  },
  chartWrapper: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  barContainer: {
    marginBottom: 12,
  },
  barLabel: {
    fontSize: 13,
    color: "#5C4B51",
    marginBottom: 4,
    fontWeight: "500",
  },
  barTrack: {
    height: 24,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 4,
  },
  barFill: {
    height: "100%",
    borderRadius: 12,
    minWidth: 2,
  },
  barValue: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
  pieSliceContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  pieSliceDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  pieSliceText: {
    fontSize: 14,
    color: "#5C4B51",
  },
  pieWrapper: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pieCenterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5C4B51",
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  sleepGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sleepCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sleepCount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#88D8B0",
    marginBottom: 4,
  },
  sleepLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
});
