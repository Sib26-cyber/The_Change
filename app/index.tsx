import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to The Change</Text>
      <Text style={styles.subtitle}>
        You’ve just set up your app. There are no entries yet.
      </Text>
      <Text style={styles.body}>
        When you start logging how you feel in the Diary, this screen will show
        a gentle overview of your recent days.
      </Text>
      <Text style={styles.hint}>
        Tip: Tap the “Diary” tab below to add your first entry.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.8,
  },
});
