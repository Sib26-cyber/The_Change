// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* First screen on a completely fresh app */}
      <Stack.Screen name="index" /> {/* Welcome */}
      {/* First-time PIN setup */}
      <Stack.Screen name="set-pin" /> {/* Set PIN */}
      {/* Main app (tabs group) */}
      <Stack.Screen name="(tabs)" /> {/* Home / Diary / Insights / Settings */}
    </Stack>
  );
}
