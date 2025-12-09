import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/logo.png")} // place your logo here
        style={styles.logo}
      />

      <Text style={styles.title}>The Change</Text>

      <Text style={styles.subtitle}>
        A private, supportive space to track your wellbeing through
        perimenopause.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/set-pin")}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: "#FFF8F2", // soft warm tone
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: "contain",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#5A3E85",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#444",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#7A4DBA",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "600",
  },
});
