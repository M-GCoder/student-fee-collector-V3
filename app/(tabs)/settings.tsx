import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useStudents } from "@/lib/student-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { CURRENCY_SYMBOL } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import * as storage from "@/lib/storage";
import { sendBulkUnpaidNotifications } from "@/lib/notification-service";
import { exportAsXLS, exportAsPDF, exportAsCSV } from "@/lib/export-service";
import { exportCurrentMonthAsXLS, exportCurrentMonthAsPDF, exportCurrentMonthAsCSV } from "@/lib/current-month-export-service";
import { exportAsCSV as exportAsCSVFlex, exportAsXLS as exportAsXLSFlex, exportAsPDF as exportAsPDFFlex } from "@/lib/flexible-export-service";
import { SupabaseConfigModal } from "@/components/supabase-config-modal";
import { AdvancedExportModal, type ExportOptions } from "@/components/advanced-export-modal";
import { SyncStatusIndicator } from "@/components/sync-status-indicator";
import { updateSyncStatus } from "@/lib/sync-status-service";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { students, payments, refreshData } = useStudents();
  const [exporting, setExporting] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [supabaseModalVisible, setSupabaseModalVisible] = useState(false);
  const [advancedExportVisible, setAdvancedExportVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "xls" | "pdf" | null>(null);
  const [syncStatusKey, setSyncStatusKey] = useState(0);

  // Calculate current month payments
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const currentMonthPayments = payments.filter(
    (p) => p.month === currentMonth && p.year === currentYear
  );
  
  const currentMonthCount = currentMonthPayments.length;
  const currentMonthAmount = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const unpaidCount = students.length - currentMonthCount;

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const currentDate = new Date();
      await exportAsCSVFlex(students, payments, currentDate.getMonth(), currentDate.getFullYear());
      Alert.alert("Success", "Current month CSV exported successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to export CSV file");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportXLS = async () => {
    try {
      setExporting(true);
      const currentDate = new Date();
      await exportAsXLSFlex(students, payments, currentDate.getMonth(), currentDate.getFullYear());
      Alert.alert("Success", "Current month Excel file exported successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to export Excel file");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const currentDate = new Date();
      await exportAsPDFFlex(students, payments, currentDate.getMonth(), currentDate.getFullYear());
      Alert.alert("Success", "Current month PDF exported successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to export PDF file");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleAdvancedExport = async (options: ExportOptions) => {
    if (!options.month || !options.year) return;

    try {
      setExporting(true);
      if (options.format === "csv") {
        await exportAsCSVFlex(students, payments, options.month, options.year);
      } else if (options.format === "xls") {
        await exportAsXLSFlex(students, payments, options.month, options.year);
      } else if (options.format === "pdf") {
        await exportAsPDFFlex(students, payments, options.month, options.year);
      }
      Alert.alert("Success", `${options.format.toUpperCase()} exported successfully`);
      setAdvancedExportVisible(false);
      setExportFormat(null);
    } catch (error) {
      Alert.alert("Error", "Failed to export file");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleSendNotifications = async () => {
    if (unpaidCount === 0) {
      Alert.alert("No Unpaid Fees", "All students have paid their fees for this month!");
      return;
    }

    Alert.alert(
      "Send Notifications",
      `Send fee reminder notifications to ${unpaidCount} student(s) with unpaid fees?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            try {
              setSendingNotifications(true);
              const sent = await sendBulkUnpaidNotifications(students, payments);
              Alert.alert("Success", `Notifications sent to ${sent} student(s)`);
            } catch (error) {
              Alert.alert("Error", "Failed to send notifications");
              console.error(error);
            } finally {
              setSendingNotifications(false);
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to delete all students and payment records? This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Clear",
          onPress: async () => {
            try {
              await storage.clearAllData();
              await refreshData();
              Alert.alert("Success", "All data has been cleared");
            } catch (error) {
              Alert.alert("Error", "Failed to clear data");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header with 3-dot Menu and Sync Status */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <MaterialIcons name="dashboard" size={28} color={colors.primary} style={{ marginRight: 8 }} />
              <View className="flex-1">
                <Text className="text-3xl font-bold text-foreground">Summary</Text>
                <Text className="text-sm text-muted mt-1">App configuration and data management</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setSupabaseModalVisible(true)}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                padding: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <MaterialIcons name="more-vert" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          {/* Sync Status Indicator */}
          <SyncStatusIndicator
            key={syncStatusKey}
            onPress={() => setSyncStatusKey(syncStatusKey + 1)}
          />
        </View>

        {/* Data Summary */}
        <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-4">Data Summary</Text>
          <View className="flex-row justify-between mb-3">
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">Total Students</Text>
              <Text className="text-lg font-bold text-foreground">{students.length}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">Current Month Payments</Text>
              <Text className="text-lg font-bold text-foreground">{currentMonthCount}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">Unpaid This Month</Text>
              <Text className="text-lg font-bold text-error">{unpaidCount}</Text>
            </View>
          </View>
          <View className="flex-row justify-between pt-3 border-t border-border mb-3">
            <Text className="text-sm text-muted">Total Amount Collected</Text>
            <Text className="text-sm font-semibold text-success">
              RS{payments.reduce((sum, p) => sum + p.amount, 0)}
            </Text>
          </View>
          <View className="flex-row justify-between pt-3 border-t border-border">
            <Text className="text-sm text-muted">Current Month Amount</Text>
            <Text className="text-sm font-semibold text-success">
              RS{currentMonthAmount}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-3">Quick Actions</Text>
          <View className="gap-3">
            <TouchableOpacity
              onPress={() => router.push("../dashboard")}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="analytics" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-3">View Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("../bulk-import")}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="upload-file" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-3">Bulk Import Students</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("../class-analytics")}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="bar-chart" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-3">Class Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-3">Notifications</Text>
          <View className="gap-3">
            <TouchableOpacity
              onPress={() => router.push("/notification-settings")}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="notifications" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-3">Notification Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/notification-history")}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="history" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-3">Notification History</Text>
            </TouchableOpacity>

            {unpaidCount > 0 && (
              <TouchableOpacity
                onPress={handleSendNotifications}
                disabled={sendingNotifications}
                style={{
                  backgroundColor: colors.warning,
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  opacity: sendingNotifications ? 0.6 : 1,
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="send" size={20} color="#ffffff" />
                <Text className="text-white font-semibold ml-3">
                  {sendingNotifications ? "Sending..." : `Send Reminders (${unpaidCount})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Export Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-3">Export Data</Text>
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleExportCSV}
              disabled={exporting || students.length === 0}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                opacity: exporting || students.length === 0 ? 0.6 : 1,
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="table-chart" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-3 flex-1">
                {exporting ? "Exporting..." : "Export as CSV"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setExportFormat("csv");
                  setAdvancedExportVisible(true);
                }}
                disabled={exporting || students.length === 0}
              >
                <MaterialIcons name="expand-more" size={20} color="#ffffff" />
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleExportXLS}
              disabled={exporting || students.length === 0}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                opacity: exporting || students.length === 0 ? 0.6 : 1,
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="description" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-3 flex-1">
                {exporting ? "Exporting..." : "Export as Excel"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setExportFormat("xls");
                  setAdvancedExportVisible(true);
                }}
                disabled={exporting || students.length === 0}
              >
                <MaterialIcons name="expand-more" size={20} color="#ffffff" />
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleExportPDF}
              disabled={exporting || students.length === 0}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                opacity: exporting || students.length === 0 ? 0.6 : 1,
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="picture-as-pdf" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-3 flex-1">
                {exporting ? "Exporting..." : "Export as PDF"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setExportFormat("pdf");
                  setAdvancedExportVisible(true);
                }}
                disabled={exporting || students.length === 0}
              >
                <MaterialIcons name="expand-more" size={20} color="#ffffff" />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-error mb-3">Danger Zone</Text>
          <TouchableOpacity
            onPress={handleClearData}
            style={{
              backgroundColor: colors.error,
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="delete-forever" size={20} color="#ffffff" />
            <Text className="text-white font-semibold ml-3">Clear All Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        visible={supabaseModalVisible}
        onClose={() => setSupabaseModalVisible(false)}
        onSyncComplete={async () => {
          setSupabaseModalVisible(false);
          refreshData();
          await updateSyncStatus('full');
          setSyncStatusKey(syncStatusKey + 1);
        }}
      />

      {/* Advanced Export Modal */}
      {exportFormat && (
        <AdvancedExportModal
          visible={advancedExportVisible}
          formats={[exportFormat]}
          onExport={handleAdvancedExport}
          onCancel={() => {
            setAdvancedExportVisible(false);
            setExportFormat(null);
          }}
          loading={exporting}
        />
      )}
    </ScreenContainer>
  );
}
