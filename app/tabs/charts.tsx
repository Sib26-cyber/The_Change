// app/tabs/charts.tsx
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";

const moodToValue: Record<string, number> = {
  sad: 1,
  neutral: 2,
  calm: 3,
  happy: 4,
  joyful: 5,
};

const valueToMood = ["", "Sad", "Neutral", "Calm", "Happy", "Joyful"];

export default function ChartsScreen() {
  const [chartData, setChartData] = useState<
    { label: string; value: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const db = await SQLite.openDatabaseAsync("thechange.db");
      const rows = await db.getAllAsync<{
        date: string;
        mood: string;
      }>("SELECT date, mood FROM diary_entries ORDER BY date ASC");

      const data = rows.map((entry) => ({
        label: entry.date.slice(5), // MM-DD
        value: moodToValue[entry.mood] ?? 0,
      }));

      setChartData(data);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (chartData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noDataText}>No mood data available yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📈 Mood Over Time</Text>

      <LineChart
        data={chartData}
        width={Dimensions.get("window").width - 32}
        height={240}
        spacing={24}
        thickness={2}
        curved
        xAxisLabelTexts={
          chartData.length >= 2 ? chartData.map((d) => d.label) : ["Today", ""] // fallback for single-entry display
        }
        xAxisLabelTextStyle={{ fontSize: 10 }}
        yAxisLabelTexts={["Sad", "Neutral", "Calm", "Happy", "Joyful"]}
        yAxisLabelWidth={60}
        yAxisColor="transparent" // hides default numbered ticks
        xAxisColor="#ccc"
        noOfSections={4}
        areaChart
        startFillColor="#D6765A"
        endFillColor="#ffffff"
        startOpacity={0.4}
        endOpacity={0}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fdf6f9",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
    color: "#5C4B51",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
  },
});
