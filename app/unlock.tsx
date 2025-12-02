// app/unlock.tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getPin } from "./storage/securityStorage";

export default function UnlockScreen() {
  const router = useRouter();
  const [enteredPin, setEnteredPin] = useState("");
  const [error, setError] = useState("");

  const handleUnlock = async () => {
    const storedPin = await getPin();

    // --- If no PIN exists, send user to Set PIN page ---
    if (!storedPin) {
      router.replace("/set-pin");
      return;
    }

    if (enteredPin === storedPin) {
      setError("");
      router.replace("/tabs/diary" as any);
    } else {
      setError("That PIN does not match. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unlock The Change</Text>
      <Text style={styles.subtitle}>
        Enter your PIN to access your diary. Everything stays on this device.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter PIN"
        keyboardType="number-pad"
        secureTextEntry
        value={enteredPin}
        onChangeText={setEnteredPin}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleUnlock}>
        <Text style={styles.buttonText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#FFFDF7",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E3C4B5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  error: {
    color: "#C0392B",
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#D6765A",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
