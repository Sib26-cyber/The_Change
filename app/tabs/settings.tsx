// app/tabs/settings.tsx
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { clearAllData } from "../../storage/securityStorage";

export default function SettingsScreen() {
  const router = useRouter();

  // Just log out: go back to Unlock, keep PIN + diary data
  const handleLogout = () => {
    router.replace("/unlock");
  };

  //  Reset PIN only (keep diary data)
  const handleResetPin = () => {
    Alert.alert(
      "Reset PIN",
      "You will need to choose a new PIN. Your diary data will stay on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            router.push("/set-pin");
          },
        },
      ]
    );
  };

  //  Wipe everything: PIN + diary entries
  const handleClearData = () => {
    Alert.alert(
      "Clear all data?",
      "This will erase your PIN and all diary entries from this device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            router.replace("/set-pin");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {/* Log out (no data deleted) */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      {/* Reset PIN */}
      <TouchableOpacity style={styles.button} onPress={handleResetPin}>
        <Text style={styles.buttonText}>Reset PIN</Text>
      </TouchableOpacity>

      {/* Clear all local data */}
      <TouchableOpacity
        style={[styles.button, styles.dangerButton]}
        onPress={handleClearData}
      >
        <Text style={styles.buttonText}>Clear local data</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Log out will lock the app without deleting anything.
        {"\n"}
        Reset PIN changes your PIN but keeps your diary.
        {"\n"}
        Clear local data permanently wipes your PIN and diary from this device.
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
  logoutButton: {
    backgroundColor: "#E3C4B5",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  logoutText: {
    color: "#5A3E36",
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#D6765A",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 16,
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
    lineHeight: 18,
  },
});
