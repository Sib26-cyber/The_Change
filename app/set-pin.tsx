// app/set-pin.tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { savePin } from "./storage/securityStorage";

export default function SetPinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const handleContinue = async () => {
    // basic validation
    if (pin.length < 4) {
      setError("PIN should be at least 4 digits.");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }

    try {
      // 🔐 save PIN securely
      await savePin(pin);
      setError("");

      // ✅ after setting PIN, go straight to diary tab
      // use "/" to go back to the welcome screen from tabs
      router.replace("/tabs/diary" as any);
    } catch (e) {
      console.log("Error saving PIN", e);
      setError("Something went wrong saving your PIN.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set your PIN</Text>
      <Text style={styles.subtitle}>
        This PIN will be used to lock the app on this device in future versions.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter PIN"
        keyboardType="number-pad"
        secureTextEntry
        value={pin}
        onChangeText={(text) => {
          setPin(text);
          if (error) setError("");
        }}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm PIN"
        keyboardType="number-pad"
        secureTextEntry
        value={confirmPin}
        onChangeText={(text) => {
          setConfirmPin(text);
          if (error) setError("");
        }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue to app</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.replace("/" as any)}
      >
        <Text style={styles.linkText}>Back to Welcome</Text>
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
  linkButton: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    color: "#D6765A",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
