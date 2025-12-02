// styles/layout.ts
import { StyleSheet } from "react-native";
import { colors, spacing } from "./theme";

export const layout = StyleSheet.create({
  screenSafeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 32,
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  section: {
    marginBottom: 24,
  },
});
