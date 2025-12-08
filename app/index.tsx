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
import * as Animatable from "react-native-animatable";
import { getPin } from "../storage/securityStorage";

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
      <Animatable.View animation="fadeInDown" delay={200}>
        <Text style={styles.appName}>🌼 The Change</Text>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={400}>
        <Text style={styles.subtitle}>
          Your private space to track and support your journey.
        </Text>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={600}>
        <Text style={styles.emojiRow}>🌙 💧 🧘‍♀️ 🌿 📓</Text>
      </Animatable.View>

      <Animatable.View animation="fadeIn" delay={900}>
        <Text style={styles.privacy}>
          Nothing is sent to a server. Everything stays on your device.
        </Text>
      </Animatable.View>

      <Animatable.View animation="bounceInUp" delay={1000}>
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Set up your PIN</Text>
        </TouchableOpacity>
      </Animatable.View>
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
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
    color: "#5C4B51",
    lineHeight: 26,
  },
  emojiRow: {
    fontSize: 28,
    marginBottom: 24,
  },
  privacy: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.75,
    marginBottom: 32,
    maxWidth: 300,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    backgroundColor: "#D6765A",
    elevation: 2,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
