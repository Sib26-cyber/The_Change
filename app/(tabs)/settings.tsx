// app/(tabs)/settings.tsx
import { StyleSheet, Text, View } from "react-native";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings & Privacy</Text>
      <Text style={styles.subtitle}>
        Here you’ll manage your PIN, biometric unlock, and clear your local
        data.
      </Text>
      <Text style={styles.body}>
        For Version 1, we’re just showing the structure for a new user with no
        data yet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#FFF7F2",
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
    paddingHorizontal: 16,
  },
  body: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
