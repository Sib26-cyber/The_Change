import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";

export default function Home() {
  const router = useRouter();

  const menuItems = [
    { icon: "📝", label: "Daily Diary", route: "/tabs/diary", color: "#D6765A" },
    { icon: "📊", label: "Analytics", route: "/tabs/analytics", color: "#9B59B6" },
    { icon: "📅", label: "Insights", route: "/tabs/insights", color: "#4A90E2" },
    { icon: "📈", label: "Charts", route: "/tabs/charts", color: "#E67E96" },
    { icon: "⚙️", label: "Settings", route: "/tabs/settings", color: "#6C7A89" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Welcome back 🌸</Text>
        <Text style={styles.sub}>
          Here is your wellbeing space. What would you like to do today?
        </Text>
      </View>

      <View style={styles.gridContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: item.color }]}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={styles.cardText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: "#FDF6F9",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  header: {
    fontSize: 32,
    fontWeight: "700",
    color: "#5C4B51",
    marginBottom: 10,
    textAlign: "center",
  },
  sub: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  card: {
    width: 160,
    height: 140,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  cardText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
