// app/unlock.tsx
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { getPin } from "../storage/securityStorage";

export default function UnlockScreen() {
  const router = useRouter();
  const [enteredPin, setEnteredPin] = useState("");
  const [error, setError] = useState("");
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("");

  // Check if biometrics are available on device
  useEffect(() => {
    const checkBiometricSupport = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);

      if (compatible) {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (enrolled) {
          const types =
            await LocalAuthentication.supportedAuthenticationTypesAsync();
          // 1 = Fingerprint, 2 = FaceID, 3 = Iris
          if (types.includes(2)) {
            setBiometricType("Face ID");
          } else if (types.includes(1)) {
            setBiometricType("Touch ID");
          } else {
            setBiometricType("Biometrics");
          }
          // Automatically trigger biometric auth when screen loads
          handleBiometricAuth();
        }
      }
    };

    checkBiometricSupport();
  }, []);

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock The Change",
        cancelLabel: "Cancel",
        disableDeviceFallback: true,
        requireConfirmation: false,
      });

      if (result.success) {
        setError("");
        router.replace("/tabs/home" as any);
      } else {
        setError("Authentication cancelled. Please enter your PIN.");
      }
    } catch {
      setError("Biometric authentication failed. Please enter your PIN.");
    }
  };

  const handleUnlock = async () => {
    const storedPin = await getPin();

    // --- If no PIN exists, send user to Set PIN page ---
    if (!storedPin) {
      router.replace("/set-pin");
      return;
    }

    if (enteredPin === storedPin) {
      setError("");
      router.replace("/tabs/home" as any);
    } else {
      setError("That PIN does not match. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unlock The Change</Text>
      <Text style={styles.subtitle}>
        {isBiometricSupported && biometricType
          ? `Use ${biometricType} or enter your PIN to access your diary.`
          : "Enter your PIN to access your diary. Everything stays on this device."}
      </Text>

      {isBiometricSupported && biometricType && (
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometricAuth}
        >
          <Text style={styles.biometricButtonText}>🔐 Use {biometricType}</Text>
        </TouchableOpacity>
      )}

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
        <Text style={styles.buttonText}>Unlock with PIN</Text>
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
    lineHeight: 20,
  },
  biometricButton: {
    backgroundColor: "#E6F4FE",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#5BA5D6",
  },
  biometricButtonText: {
    color: "#2C5F7B",
    fontSize: 16,
    fontWeight: "600",
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
