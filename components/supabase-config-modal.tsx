import React, { useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SupabaseSyncService } from "@/lib/supabase-sync-service";

interface SupabaseConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export function SupabaseConfigModal({
  visible,
  onClose,
  onSyncComplete,
}: SupabaseConfigModalProps) {
  const colors = useColors();
  const [projectUrl, setProjectUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

  const handleTestConnection = async () => {
    if (!projectUrl.trim() || !anonKey.trim()) {
      Alert.alert("Error", "Please enter both Project URL and Anon Key");
      return;
    }

    try {
      setLoading(true);
      const isConnected = await SupabaseSyncService.checkConnection();

      if (isConnected) {
        Alert.alert("Success", "Connected to Supabase successfully!");
        // Save credentials to AsyncStorage
        await AsyncStorage.setItem(
          "supabase_config",
          JSON.stringify({
            projectUrl,
            anonKey,
            configuredAt: new Date().toISOString(),
          })
        );
      } else {
        Alert.alert("Error", "Failed to connect to Supabase. Please check your credentials.");
      }
    } catch (error) {
      Alert.alert("Error", `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToCloud = async () => {
    try {
      setSyncInProgress(true);
      Alert.alert("Syncing", "Uploading your data to Supabase cloud...");

      // Get students and payments from local storage
      const studentsJson = await AsyncStorage.getItem("students");
      const paymentsJson = await AsyncStorage.getItem("payments");

      const students = studentsJson ? JSON.parse(studentsJson) : [];
      const payments = paymentsJson ? JSON.parse(paymentsJson) : [];

      // Sync to cloud
      await SupabaseSyncService.logSyncOperation("syncing");

      if (students.length > 0) {
        await SupabaseSyncService.syncStudentsToCloud(students);
      }

      if (payments.length > 0) {
        await SupabaseSyncService.syncPaymentsToCloud(payments);
      }

      await SupabaseSyncService.logSyncOperation("completed");

      Alert.alert(
        "Sync Complete",
        `Synced ${students.length} students and ${payments.length} payments to cloud`
      );

      onSyncComplete?.();
    } catch (error) {
      await SupabaseSyncService.logSyncOperation(
        "failed",
        error instanceof Error ? error.message : "Unknown error"
      );
      Alert.alert("Error", `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleImportFromCloud = async () => {
    try {
      setSyncInProgress(true);
      Alert.alert("Importing", "Downloading your data from Supabase cloud...");

      // Fetch from cloud
      const students = await SupabaseSyncService.fetchStudentsFromCloud();
      const payments = await SupabaseSyncService.fetchPaymentsFromCloud();

      // Save to local storage
      if (students.length > 0) {
        await AsyncStorage.setItem("students", JSON.stringify(students));
      }

      if (payments.length > 0) {
        await AsyncStorage.setItem("payments", JSON.stringify(payments));
      }

      Alert.alert(
        "Import Complete",
        `Imported ${students.length} students and ${payments.length} payments from cloud`
      );

      onSyncComplete?.();
    } catch (error) {
      Alert.alert("Error", `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSyncInProgress(false);
    }
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
            <TouchableOpacity onPress={onClose} disabled={syncInProgress}>
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
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
                  editable={!syncInProgress}
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
                  editable={!syncInProgress}
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
                disabled={loading || syncInProgress}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: loading || syncInProgress ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
                ) : (
                  <MaterialIcons name="check-circle" size={20} color="#ffffff" />
                )}
                <Text style={{ color: "#ffffff", fontWeight: "600", marginLeft: 8 }}>
                  {loading ? "Testing..." : "Test Connection"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sync Actions Section */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
                Sync Actions
              </Text>

              <TouchableOpacity
                onPress={handleSyncToCloud}
                disabled={syncInProgress}
                style={{
                  backgroundColor: colors.success,
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                  opacity: syncInProgress ? 0.6 : 1,
                }}
              >
                {syncInProgress ? (
                  <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
                ) : (
                  <MaterialIcons name="cloud-upload" size={20} color="#ffffff" />
                )}
                <Text style={{ color: "#ffffff", fontWeight: "600", marginLeft: 8 }}>
                  {syncInProgress ? "Syncing..." : "Sync to Cloud"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleImportFromCloud}
                disabled={syncInProgress}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: syncInProgress ? 0.6 : 1,
                }}
              >
                {syncInProgress ? (
                  <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
                ) : (
                  <MaterialIcons name="cloud-download" size={20} color="#ffffff" />
                )}
                <Text style={{ color: "#ffffff", fontWeight: "600", marginLeft: 8 }}>
                  {syncInProgress ? "Importing..." : "Import from Cloud"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info Section */}
            <View
              style={{
                backgroundColor: colors.primary + "20",
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.primary + "40",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary, marginBottom: 8 }}>
                ℹ️ How to use
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, lineHeight: 18 }}>
                1. Get your Supabase Project URL and Anon Key from your Supabase dashboard{"\n"}
                2. Paste them above and test the connection{"\n"}
                3. Click "Sync to Cloud" to upload your data{"\n"}
                4. Click "Import from Cloud" to download data from Supabase
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
