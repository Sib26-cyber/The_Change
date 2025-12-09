import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome back</Text>
      <Text style={styles.sub}>
        Here is your wellbeing space. What would you like to do today?
      </Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/tabs/diary")}
      >
        <Text style={styles.cardText}>Open Diary</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/tabs/insights")}
      >
        <Text style={styles.cardText}>View Insights</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
    backgroundColor: "#FFF8F2",
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#5A3E85",
    marginBottom: 10,
  },
  sub: {
    fontSize: 16,
    color: "#555",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#7A4DBA",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  cardText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
