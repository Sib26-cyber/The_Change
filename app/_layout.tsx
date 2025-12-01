// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Welcome (fresh app first screen) */}
      <Stack.Screen name="index" />

      {/* First-time PIN setup */}
      <Stack.Screen name="set-pin" />

      {/* Main tabbed app */}
      <Stack.Screen name="tabs" />
    </Stack>
  );
}
