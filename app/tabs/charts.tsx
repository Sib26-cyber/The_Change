// app/tabs/charts.tsx
// This screen plots the user's mood over time as a line chart.
// Mood values are stored in the database as text strings, so they are
// mapped to integers before being passed to the chart library.
// A higher number on the Y-axis represents a more positive mood.
// The chart uses an area fill style to make trends easier to read at a glance.

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

// Maps mood text values to numeric Y-axis positions.
// The scale runs from 1 (sad) to 5 (joyful) so the chart has a consistent
// range regardless of which moods the user has recorded.
const moodToValue: Record<string, number> = {
  sad: 1,
  neutral: 2,
  calm: 3,
  happy: 4,
  joyful: 5,
};

// Used as Y-axis labels so the chart shows mood names instead of numbers.
const valueToMood = ["", "Sad", "Neutral", "Calm", "Happy", "Joyful"];

export default function ChartsScreen() {
  const [chartData, setChartData] = useState<
    { label: string; value: number }[]
  >([]);

  const [loading, setLoading] = useState(true);

  // Load mood data from SQLite on mount, convert it to chart input format,
  // and store it in state. The component re-renders once loading is complete.
  useEffect(() => {
    const loadData = async () => {
      const db = await SQLite.openDatabaseAsync("thechange.db");

      const rows = await db.getAllAsync<{
        date: string;
        mood: string;
      }>("SELECT date, mood FROM diary_entries ORDER BY date ASC");

      const data = rows.map((entry) => ({
        // Format the date as a short readable label for the X-axis.
        label: format(parseISO(entry.date), "MMM d"),
        // Fall back to neutral if a mood value is not recognised.
        value: moodToValue[entry.mood] ?? moodToValue["neutral"],
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

  // Cap the chart width to the device screen width minus padding
  // so it scales correctly on different phone sizes.
  const chartWidth = Math.min(Dimensions.get("window").width - 32, 500);

  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false}>
      <Text style={styles.title}>Mood Over Time</Text>

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

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fdf6f9",
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
