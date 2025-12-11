// app/tabs/charts.tsx
// -------------------------------------------------------------
// This screen displays the user's mood over time using a line chart.
// It loads mood entries from SQLite and converts mood words into
// numeric values so they can be plotted. The chart updates automatically
// as new diary entries are added.
// -------------------------------------------------------------

import { format, parseISO } from "date-fns";
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

// -------------------------------------------------------------
// Mapping mood labels to numbers for the Y-axis.
// Higher numbers represent more positive moods.
// -------------------------------------------------------------
const moodToValue: Record<string, number> = {
  sad: 1,
  neutral: 2,
  calm: 3,
  happy: 4,
  joyful: 5,
};

// Reverse lookup used for tooltips or debugging (optional)
const valueToMood = ["", "Sad", "Neutral", "Calm", "Happy", "Joyful"];

export default function ChartsScreen() {
  // Stores the data in the form the chart needs
  const [chartData, setChartData] = useState<
    { label: string; value: number }[]
  >([]);

  // Simple loading state while fetching SQLite data
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------
  // Loads all mood entries from SQLite on component mount.
  // Converts each diary entry into a date label + numeric mood.
  // -------------------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      // Open or create the on-device SQLite database
      const db = await SQLite.openDatabaseAsync("thechange.db");

      // Retrieve all diary entries, sorted by date ascending
      const rows = await db.getAllAsync<{
        date: string;
        mood: string;
      }>("SELECT date, mood FROM diary_entries ORDER BY date ASC");

      // Convert raw DB data into chart input format
      const data = rows.map((entry) => ({
        // Format: "Feb 6", "Feb 7", etc.
        label: format(parseISO(entry.date), "MMM d"),

        // Convert mood word → numeric value
        value: moodToValue[entry.mood] ?? moodToValue["neutral"],
      }));

      setChartData(data);
      setLoading(false);
    };

    loadData();
  }, []);

  // -------------------------------------------------------------
  // Display a spinner while data loads
  // -------------------------------------------------------------
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // -------------------------------------------------------------
  // Handle case where no data exists yet
  // -------------------------------------------------------------
  if (chartData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noDataText}>No mood data available yet 💗</Text>
      </View>
    );
  }

  // Cap chart width so tablets do not stretch it too far
  const chartWidth = Math.min(Dimensions.get("window").width - 32, 500);

  // -------------------------------------------------------------
  // MAIN RENDER: Mood chart wrapped in a ScrollView
  // -------------------------------------------------------------
  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false}>
      <Text style={styles.title}>📈 Mood Over Time</Text>

      <View style={{ marginTop: 24 }}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={240}
          spacing={40}
          thickness={2}
          maxValue={6}
          curved
          hideDataPoints={false}
          dataPointsColor="#D6765A"
          dataPointsRadius={4}
          xAxisLabelTextStyle={{ fontSize: 10, color: "#666" }}
          yAxisTextStyle={{ fontSize: 10, color: "#666" }}
          yAxisLabelTexts={["", "Sad", "Neutral", "Calm", "Happy", "Joyful"]}
          yAxisLabelWidth={60}
          yAxisColor="transparent"
          xAxisColor="#ccc"
          noOfSections={5}
          areaChart
          startFillColor="#D6765A"
          endFillColor="#ffffff"
          startOpacity={0.4}
          endOpacity={0}
          showValuesAsDataPointsText={false}
        />
      </View>
    </ScrollView>
  );
}

// -------------------------------------------------------------
// Stylesheet
// -------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fdf6f9", // soft feminine background
  },
  title: {
    marginTop: 30,
    fontSize: 22,
    fontWeight: "600",
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
