import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";

/**
 * Splash Loader Component
 * Shows during app initialization to prevent blank screens
 */
export function SplashLoader() {
  const colors = useColors();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <View style={{ alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: colors.foreground,
            fontWeight: "600",
          }}
        >
          Loading Student Fee Collector...
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            color: colors.muted,
            textAlign: "center",
          }}
        >
          Initializing your data
        </Text>
      </View>
    </View>
  );
}
