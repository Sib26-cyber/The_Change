// app/tabs/settings.tsx
// This screen gives the user three data management options.
// Logging out locks the app without touching any stored data.
// Resetting the PIN routes the user through the PIN setup flow while
// leaving diary entries untouched.
// Clearing all data permanently removes everything from the device,
// which is useful if the user wants to hand the phone to someone else
// or start fresh. All three actions are separated deliberately so the
// user cannot accidentally wipe their diary when they only meant to reset their PIN.

import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { clearAllData } from "../../storage/securityStorage";

export default function SettingsScreen() {
  const router = useRouter();

  // Navigate to the unlock screen, which locks the app.
  // No data is deleted; the user simply needs to re-enter their PIN to get back in.
  const handleLogout = () => {
    router.replace("/unlock");
  };

  // Warn the user before redirecting to the PIN setup screen.
  // Their diary data is preserved.
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
      ],
    );
  };

  // Confirm before wiping all data. This calls clearAllData which removes
  // both the PIN from SecureStore and the diary entries from AsyncStorage.
  // The user is then redirected to set a new PIN as if opening the app for the first time.
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
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.header}>⚙️ Settings</Text>

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
          {"\n\n"}
          Reset PIN changes your PIN but keeps your diary.
          {"\n\n"}
          Clear local data permanently wipes your PIN and diary from this
          device.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF6F9",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: 24,
  },
  header: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 40,
    textAlign: "center",
    color: "#5C4B51",
  },
  logoutButton: {
    backgroundColor: "#E8D5D1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  logoutText: {
    color: "#5C4B51",
    fontSize: 18,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#D6765A",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  dangerButton: {
    backgroundColor: "#C0392B",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  note: {
    marginTop: 32,
    textAlign: "center",
    fontSize: 13,
    color: "#999",
    paddingHorizontal: 16,
    lineHeight: 20,
  },
});
