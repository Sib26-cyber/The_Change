// styles/typography.ts
import { StyleSheet } from "react-native";
import { colors, spacing, typography } from "./theme";

export const textStyles = StyleSheet.create({
  screenTitle: {
    fontSize: typography.title,
    fontWeight: "600",
    marginBottom: spacing.md,
    color: colors.textMain,
  },
  sectionTitle: {
    fontSize: typography.sectionTitle,
    fontWeight: "500",
    marginBottom: spacing.sm,
    color: colors.textMain,
  },
  body: {
    fontSize: typography.body,
    color: colors.textMain,
  },
  smallMuted: {
    fontSize: typography.small,
    color: colors.textMuted,
  },
});
