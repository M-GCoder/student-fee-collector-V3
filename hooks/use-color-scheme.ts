import { useColorScheme as useRNColorScheme } from "react-native";
/**
 * Returns the current color scheme.
 * Uses ThemeContext when available, falls back to system color scheme.
 * This prevents crashes when the hook is called before ThemeProvider mounts.
 */
export function useColorScheme() {
  const systemScheme = useRNColorScheme();
  try {
    // Dynamically require to avoid circular dependency issues
    const { useThemeContext } = require("@/lib/theme-provider");
    const ctx = useThemeContext();
    return ctx.colorScheme;
  } catch {
    // ThemeProvider not yet mounted — fall back to system scheme
    return systemScheme ?? "light";
  }
}
