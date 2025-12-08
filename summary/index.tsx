// app/summary/index.tsx
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SummaryScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Today&apos;s Summary</Text>

        {/* 🔹 Symptoms overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Key Symptoms</Text>
          <Text style={styles.cardText}>
            This is where we&apos;ll show your main symptoms for today (e.g. hot
            flushes, brain fog, mood, sleep).
          </Text>
        </View>

        {/* 🔹 Water intake */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Water Intake</Text>
          <Text style={styles.cardText}>
            We&apos;ll add today&apos;s total water (ml) and a simple progress
            bar here.
          </Text>
        </View>

        {/* 🔹 Food triggers */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Food & Triggers</Text>
          <Text style={styles.cardText}>
            This section will show whether you had spicy, sugary, caffeinated,
            or other trigger foods today.
          </Text>
        </View>

        {/* 🔹 Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.cardText}>
            Any notes you wrote in your diary for today can appear here in a
            clean, readable way.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fdf6f9", // soft background; tweak later if you like
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
    elevation: 2, // Android shadow
    shadowColor: "#000", // iOS shadow
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
