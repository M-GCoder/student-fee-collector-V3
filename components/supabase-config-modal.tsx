import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { DynamicSupabaseClient } from "@/lib/supabase-dynamic-client";
import { AutoSyncService, type SyncStatus } from "@/lib/auto-sync-service";

interface SupabaseConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onConfigured?: () => void;
  isFirstLaunch?: boolean;
}

export function SupabaseConfigModal({
  visible,
  onClose,
  onConfigured,
  isFirstLaunch = false,
}: SupabaseConfigModalProps) {
  const colors = useColors();
  const [projectUrl, setProjectUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    error: null,
  });

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = AutoSyncService.onStatusChange((status) => {
      setSyncStatus(status);
    });

    return () => unsubscribe();
  }, []);

  const handleTestConnection = async () => {
    if (!projectUrl.trim() || !anonKey.trim()) {
      Alert.alert("Error", "Please enter both Project URL and Anon Key");
      return;
    }

    try {
      setLoading(true);

      // Save configuration to DynamicSupabaseClient
      await DynamicSupabaseClient.setConfig(projectUrl.trim(), anonKey.trim());

      // Test connection
      const isConnected = await DynamicSupabaseClient.testConnection(
        projectUrl.trim(),
        anonKey.trim()
      );

      if (isConnected) {
        Alert.alert("Success", "Connected to Supabase successfully!", [
          {
            text: "OK",
            onPress: () => {
              if (isFirstLaunch) {
                setProjectUrl("");
                setAnonKey("");
                onConfigured?.();
              }
            },
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to connect to Supabase. Please check your credentials.");
      }
    } catch (error) {
      Alert.alert("Error", `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSyncTime) return "Never";
    const date = new Date(syncStatus.lastSyncTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            marginTop: 60,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="cloud-upload" size={28} color={colors.primary} />
              <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground, marginLeft: 8 }}>
                Supabase Sync
              </Text>
            </View>
            {!isFirstLaunch && (
              <TouchableOpacity onPress={onClose} disabled={syncStatus.isSyncing}>
                <MaterialIcons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              padding: 16,
            }}
          >
            {/* Configuration Section */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
                Supabase Configuration
              </Text>

              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>Project URL</Text>
                <TextInput
                  placeholder="https://your-project.supabase.co"
                  value={projectUrl}
                  onChangeText={setProjectUrl}
                  editable={!syncStatus.isSyncing}
                  style={{
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>Anon Key</Text>
                <TextInput
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                  value={anonKey}
                  onChangeText={setAnonKey}
                  editable={!syncStatus.isSyncing}
                  secureTextEntry
                  style={{
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  placeholderTextColor={colors.muted}
                />
              </View>

              <TouchableOpacity
                onPress={handleTestConnection}
                disabled={loading || syncStatus.isSyncing}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: loading || syncStatus.isSyncing ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
                ) : (
                  <MaterialIcons name="check-circle" size={20} color="#ffffff" />
                )}
                <Text style={{ color: "#ffffff", fontWeight: "600", marginLeft: 8 }}>
                  {loading ? "Testing..." : isFirstLaunch ? "Configure & Continue" : "Test Connection"}
                </Text>
              </TouchableOpacity>
            </View>

            {!isFirstLaunch && (
              <>
                {/* Automatic Sync Status */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
                    Automatic Sync Status
                  </Text>

                  <View
                    style={{
                      backgroundColor: syncStatus.isOnline ? colors.success + "20" : colors.warning + "20",
                      borderRadius: 8,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: syncStatus.isOnline ? colors.success + "40" : colors.warning + "40",
                      marginBottom: 12,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                      <MaterialIcons
                        name={syncStatus.isOnline ? "cloud-done" : "cloud-off"}
                        size={20}
                        color={syncStatus.isOnline ? colors.success : colors.warning}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: syncStatus.isOnline ? colors.success : colors.warning,
                          marginLeft: 8,
                        }}
                      >
                        {syncStatus.isOnline ? "Online" : "Offline"}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      {syncStatus.isOnline
                        ? "Your data is automatically syncing to the cloud."
                        : "Offline mode: Changes will sync when connection is restored."}
                    </Text>
                  </View>

                  {syncStatus.isSyncing && (
                    <View
                      style={{
                        backgroundColor: colors.primary + "20",
                        borderRadius: 8,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: colors.primary + "40",
                        marginBottom: 12,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <ActivityIndicator color={colors.primary} style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
                        Syncing changes...
                      </Text>
                    </View>
                  )}

                  {syncStatus.pendingChanges > 0 && (
                    <View
                      style={{
                        backgroundColor: colors.warning + "20",
                        borderRadius: 8,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: colors.warning + "40",
                        marginBottom: 12,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: colors.warning, fontWeight: "600" }}>
                        {syncStatus.pendingChanges} pending change{syncStatus.pendingChanges !== 1 ? "s" : ""}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                        Will sync when connection is restored
                      </Text>
                    </View>
                  )}

                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Last Sync</Text>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                      {formatLastSync()}
                    </Text>
                  </View>
                </View>

                {/* Info Section */}
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                    ℹ️ How Automatic Sync Works
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted, lineHeight: 16 }}>
                    • When online: Changes sync automatically every 30 seconds{"\n"}
                    • When offline: Changes are saved locally and queued{"\n"}
                    • Coming online: Pending changes sync immediately, then latest data is fetched{"\n"}
                    • No manual action needed - sync happens in the background
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
