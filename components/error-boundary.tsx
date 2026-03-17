import React, { ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches and displays errors to prevent app crashes
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error);
    console.error("Error info:", errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay error={this.state.error} onReset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}

function ErrorDisplay({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}) {
  // Use a basic color scheme since hooks can't be used in error boundary
  const backgroundColor = "#151718";
  const textColor = "#ECEDEE";
  const errorColor = "#EF4444";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <View
        style={{
          alignItems: "center",
          maxWidth: 300,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: errorColor,
            marginBottom: 12,
          }}
        >
          Oops! Something went wrong
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: textColor,
            textAlign: "center",
            marginBottom: 20,
            lineHeight: 20,
          }}
        >
          The app encountered an unexpected error. Please try restarting the app.
        </Text>

        {error && (
          <View
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
              width: "100%",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: errorColor,
                fontFamily: "monospace",
              }}
              numberOfLines={5}
            >
              {error.message}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={onReset}
          style={{
            backgroundColor: "#0a7ea4",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 12,
            width: "100%",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            Try Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            // Force app restart by reloading
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }}
          style={{
            borderWidth: 1,
            borderColor: textColor,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            width: "100%",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: textColor,
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            Restart App
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
