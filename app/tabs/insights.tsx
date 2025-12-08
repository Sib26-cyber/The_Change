// app/tabs/insights.tsx
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
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
          `SELECT * FROM diary_entries ORDER BY date ASC;`
        )
        .catch((err) => {
          console.error("DB read error:", err);
          return [];
        });

      const map: Record<string, StoredEntry> = {};
      const marks: any = {};

      result.forEach((e) => {
        map[e.date] = e;
        marks[e.date] = { marked: true, dotColor: "#D6765A" };
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: { selected: true, selectedColor: "#D6765A" },
        }}
      />

      {selectedDate === "" && (
        <Text style={styles.infoText}>Tap a date to view your entry.</Text>
      )}

      {selectedDate !== "" && !entry && (
        <Text style={styles.infoText}>No entry for {selectedDate}</Text>
      )}

      {entry && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entry: {selectedDate}</Text>
          <Text style={styles.line}>Mood: {entry.mood}</Text>
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
            ) : null
          )}

          <Text style={styles.sectionTitle}>Food / Drink Triggers:</Text>
          {Object.entries(JSON.parse(entry.foodTriggersJSON)).map(([k, v]) =>
            v ? (
              <Text key={k} style={styles.line}>
                – {k}
              </Text>
            ) : null
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
    padding: 16,
    backgroundColor: "#fdf6f9",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    marginTop: 16,
    textAlign: "center",
    color: "#555",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
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
