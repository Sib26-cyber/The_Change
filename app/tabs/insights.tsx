// app/tabs/insights.tsx
import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Calendar, DateObject } from "react-native-calendars";

type StoredEntry = {
  date: string;
  mood: string;
  sleep: string;
  bleeding: number;
  symptomsJSON: string;
  foodTriggersJSON: string;
  notes: string;
};

export default function InsightsScreen() {
  const [entries, setEntries] = useState<Record<string, StoredEntry>>({});
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const db = await SQLite.openDatabaseAsync("thechange.db");
      const result = await db
        .getAllAsync<StoredEntry>(
          `SELECT * FROM diary_entries ORDER BY date ASC;`,
        )
        .catch((err) => {
          console.error("DB read error:", err);
          return [];
        });

      const map: Record<string, StoredEntry> = {};
      const marks: any = {};

      result.forEach((e) => {
        map[e.date] = e;
        // If bleeding day, show red circle, otherwise pink dot
        if (e.bleeding === 1) {
          marks[e.date] = {
            selected: true,
            selectedColor: "#FFE5E5",
            selectedTextColor: "#E74C3C",
            marked: true,
            dotColor: "#E74C3C",
          };
        } else {
          marks[e.date] = {
            marked: true,
            dotColor: "#D6765A",
          };
        }
      });

      setEntries(map);
      setMarkedDates(marks);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
      </View>
    );
  }

  const onDayPress = (day: DateObject) => {
    setSelectedDate(day.dateString);
  };

  const entry = entries[selectedDate] ?? null;
  const today = new Date().toISOString().split("T")[0];

  // Calculate days since last period
  const getDaysSinceLastPeriod = () => {
    const periodDates = Object.entries(entries)
      .filter(([_, entry]) => entry.bleeding === 1)
      .map(([date, _]) => date)
      .sort()
      .reverse();

    if (periodDates.length === 0) return null;

    const lastPeriodDate = new Date(periodDates[0]);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastPeriodDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const daysSinceLastPeriod = getDaysSinceLastPeriod();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates,
          [today]: {
            ...markedDates[today],
            today: true,
            todayTextColor: "#D6765A",
          },
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: "#D6765A",
          },
        }}
        theme={{
          selectedDayBackgroundColor: "#D6765A",
          todayTextColor: "#D6765A",
          dotColor: "#D6765A",
        }}
      />

      {daysSinceLastPeriod !== null && (
        <View style={styles.periodTrackerCard}>
          <Text style={styles.periodTrackerLabel}>Days since last period</Text>
          <Text style={styles.periodTrackerCount}>{daysSinceLastPeriod}</Text>
          <Text style={styles.periodTrackerSubtext}>
            {daysSinceLastPeriod === 0
              ? "Today"
              : daysSinceLastPeriod === 1
                ? "Yesterday"
                : `${daysSinceLastPeriod} days ago`}
          </Text>
        </View>
      )}

      {selectedDate === "" && (
        <Text style={styles.infoText}>Tap a date to view your entry.</Text>
      )}

      {selectedDate !== "" && !entry && (
        <Text style={styles.infoText}>No entry for {selectedDate}</Text>
      )}

      {entry && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Entry: {selectedDate.split("-").reverse().join("-")}
          </Text>
          <Text style={styles.line}>Mood: {entry.mood || "Not selected"}</Text>
          <Text style={styles.line}>Sleep: {entry.sleep}</Text>
          {entry.bleeding === 1 && (
            <Text style={styles.line}>🩸 Period day</Text>
          )}

          <Text style={styles.sectionTitle}>Symptoms:</Text>
          {Object.entries(JSON.parse(entry.symptomsJSON)).map(([k, v]) =>
            v ? (
              <Text key={k} style={styles.line}>
                – {k}
              </Text>
            ) : null,
          )}

          <Text style={styles.sectionTitle}>Food / Drink Triggers:</Text>
          {Object.entries(JSON.parse(entry.foodTriggersJSON)).map(([k, v]) =>
            v ? (
              <Text key={k} style={styles.line}>
                – {k}
              </Text>
            ) : null,
          )}

          <Text style={styles.sectionTitle}>Notes:</Text>
          <Text style={styles.line}>{entry.notes || "None"}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingHorizontal: 8,
    paddingBottom: 16,
    backgroundColor: "#fdf6f9",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  periodTrackerCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#E74C3C",
  },
  periodTrackerLabel: {
    fontSize: 11,
    color: "#777",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  periodTrackerCount: {
    fontSize: 38,
    fontWeight: "700",
    color: "#E74C3C",
    marginBottom: 3,
  },
  periodTrackerSubtext: {
    fontSize: 13,
    color: "#999",
  },
  infoText: {
    marginTop: 12,
    textAlign: "center",
    color: "#555",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 12,
    fontWeight: "500",
  },
  line: {
    fontSize: 14,
    marginVertical: 2,
  },
});
