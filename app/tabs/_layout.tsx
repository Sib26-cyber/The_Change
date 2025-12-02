// app/tabs/_layout.tsx
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="diary"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Hidden index route – exists to handle /tabs and redirect */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // don't deep-link to it
          tabBarButton: () => null, // don't show as a tab
        }}
      />

      <Tabs.Screen
        name="diary"
        options={{
          title: "Diary",
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
}
