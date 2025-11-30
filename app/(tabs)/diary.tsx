import { StyleSheet, Text, View } from "react-native";

export default function DiaryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Symptom Diary</Text>
      <Text style={styles.subtitle}>You havent logged any entries yet.</Text>
      <Text style={styles.body}>
        In the next version, this screen will let you record how youre feeling
        each day, including mood, food eaten, symptoms, and notes.
      </Text>
      <Text style={styles.hint}>
        For the prototype, were focusing on the flow and structure for a
        completely new user.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#FFFDF7",
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
