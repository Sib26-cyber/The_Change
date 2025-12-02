import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { clearAllData } from "../storage/securityStorage";

export default function SettingsScreen() {
  const router = useRouter();

  // Reset PIN (just redirect to the Set PIN screen)
  const handleResetPin = () => {
    Alert.alert("Reset PIN", "Are you sure you want to reset your PIN?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: () => {
          router.push("/set-pin" as any);
        },
      },
    ]);
  };

  // Clear ALL SecureStore data
  const handleClearData = async () => {
    Alert.alert(
      "Clear All Data",
      "This will erase your PIN and diary data permanently. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            router.replace("/set-pin" as any);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <TouchableOpacity style={styles.button} onPress={handleResetPin}>
        <Text style={styles.buttonText}>Reset PIN</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.dangerButton]}
        onPress={handleClearData}
      >
        <Text style={styles.buttonText}>Clear Local Data</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Your data never leaves this device. Clearing local data is permanent.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#FFFDF7",
  },
  header: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#D6765A",
    paddingVertical: 14,
    borderRadius: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  dangerButton: {
    backgroundColor: "#C0392B",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  note: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 12,
    color: "#A17A70",
    paddingHorizontal: 16,
  },
});
