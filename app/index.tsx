import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPin = async () => {
      const pin = await SecureStore.getItemAsync("pin");

      if (!pin) {
        router.replace("/welcome" as any); // FIRST TIME USER
      } else {
        router.replace("/unlock"); // RETURNING USER
      }

      setLoading(false);
    };

    checkPin();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}
