// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="set-pin" />
      <Stack.Screen name="unlock" />
      <Stack.Screen name="tabs" />
    </Stack>
  );
}
