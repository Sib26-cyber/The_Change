// app/summary/index.tsx
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Entry = {
  date: string;
  mood: string;
  sleep: string;
  bleeding: number;
  symptomsJSON: string;
  foodTriggersJSON: string;
  notes: string;
};

const symptomLabels: Record<string, string> = {
  hotFlushes: "Hot Flushes",
  brainFog: "Brain Fog",
  moodSwings: "Mood Swings",
  fatigue: "Fatigue",
  jointPain: "Joint Pain",
  headache: "Headache",
  anxiety: "Anxiety",
  heartburn: "Heartburn",
};

const foodLabels: Record<string, string> = {
  spicy: "Spicy Food",
  alcohol: "Alcohol",
  caffeine: "Caffeine",
  sugar: "Sugar",
};

export default function SummaryScreen() {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const db = await SQLite.openDatabaseAsync("thechange.db");
      const today = new Date().toISOString().split("T")[0];

      const result = await db.getFirstAsync<Entry>(
        `SELECT * FROM diary_entries WHERE date = ?;`,
        [today]
      );

      setEntry(result ?? null);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Today's Summary</Text>
          <Text>No entry saved for today yet.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const symptoms = JSON.parse(entry.symptomsJSON || "{}");
  const food = JSON.parse(entry.foodTriggersJSON || "{}");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Today's Summary</Text>

        {/* Mood & Sleep */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mood & Sleep</Text>
          <Text style={styles.cardText}>Mood: {entry.mood || "N/A"}</Text>
          <Text style={styles.cardText}>Sleep: {entry.sleep || "N/A"}</Text>
          {entry.bleeding === 1 && (
            <Text style={[styles.cardText, { marginTop: 4 }]}>
              🩸 Period Day
            </Text>
          )}
        </View>

        {/*  Symptoms overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Symptoms</Text>
          {Object.entries(symptoms)
            .filter(([_, value]) => value)
            .map(([key]) => (
              <Text key={key} style={styles.cardText}>
                - {symptomLabels[key] || key}
              </Text>
            ))}
          {Object.values(symptoms).every((v) => !v) && (
            <Text style={styles.cardText}>No symptoms reported.</Text>
          )}
        </View>

        {/*  Food triggers */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Food & Drink Triggers</Text>
          {Object.entries(food)
            .filter(([_, value]) => value)
            .map(([key]) => (
              <Text key={key} style={styles.cardText}>
                - {foodLabels[key] || key}
              </Text>
            ))}
          {Object.values(food).every((v) => !v) && (
            <Text style={styles.cardText}>No triggers reported.</Text>
          )}
        </View>

        {/*  Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.cardText}>
            {entry.notes || "No notes added."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fdf6f9",
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    marginBottom: 16,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
