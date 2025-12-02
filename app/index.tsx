// app/index.tsx
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getPin } from "./storage/securityStorage";

export default function WelcomeScreen() {
  const router = useRouter();
  const [checkingPin, setCheckingPin] = useState(true);

  useEffect(() => {
    (async () => {
      const storedPin = await getPin();
      if (storedPin) {
        router.replace("/unlock");
      } else {
        setCheckingPin(false);
      }
    })();
  }, [router]);

  const handleGetStarted = () => {
    router.push("/set-pin");
  };

  if (checkingPin) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>The Change</Text>
      <Text style={styles.subtitle}>
        A private space to track how you feel day to day.
      </Text>

      <Text style={styles.privacy}>
        Nothing is sent to a server. Everything stays on this device.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>Set up your PIN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7F2",
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  privacy: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 32,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: "#D6765A",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
