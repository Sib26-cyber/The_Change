// app/tabs/index.tsx
import { Redirect } from "expo-router";

export default function TabsIndexRedirect() {
  // When something goes to /tabs, send it to the Diary tab
  return <Redirect href="/tabs/diary" />;
}
