import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useStudents } from "@/lib/student-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { CURRENCY_SYMBOL } from "@/lib/types";
import { AutoSyncService } from "@/lib/auto-sync-service";
import { AutomaticImportService } from "@/lib/automatic-import-service";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import * as storage from "@/lib/storage";
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
  const [supabaseModalVisible, setSupabaseModalVisible] = useState(false);
  const [advancedExportVisible, setAdvancedExportVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "xls" | "pdf" | null>(null);
  const [syncStatusKey, setSyncStatusKey] = useState(0);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [autoImportEnabled, setAutoImportEnabled] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      const syncEnabled = await AutoSyncService.isAutoSyncEnabled();
      setAutoSyncEnabled(syncEnabled);
      const importEnabled = await AutomaticImportService.isAutoImportEnabled();
      setAutoImportEnabled(importEnabled);
    };
    loadPreferences();
  }, []);

  const handleToggleAutoSync = async () => {
    try {
      const newState = await AutoSyncService.toggleAutoSync();
      setAutoSyncEnabled(newState);
    } catch (error) {
      console.error("Error toggling auto-sync:", error);
    }
  };

  const handleToggleAutoImport = async () => {
    try {
      if (autoImportEnabled) {
        await AutomaticImportService.disableAutoImport();
        setAutoImportEnabled(false);
      } else {
        await AutomaticImportService.enableAutoImport();
        setAutoImportEnabled(true);
      }
    } catch (error) {
      console.error("Error toggling auto-import:", error);
    }
  };

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

        {/* Cloud Sync Settings */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-3">Cloud Sync Settings</Text>
          <TouchableOpacity
            onPress={handleToggleAutoSync}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="cloud-sync" size={20} color={colors.primary} />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-foreground">Auto-Sync on Launch</Text>
              <Text className="text-xs text-muted mt-1">Automatically sync data when app starts</Text>
            </View>
            <View
              style={{
                width: 50,
                height: 28,
                borderRadius: 14,
                backgroundColor: autoSyncEnabled ? colors.success : colors.border,
                justifyContent: "center",
                paddingHorizontal: 2,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "white",
                  marginLeft: autoSyncEnabled ? 24 : 0,
                }}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Automatic Import */}
        <TouchableOpacity
          onPress={handleToggleAutoImport}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons name="cloud-download" size={20} color={colors.primary} />
          <View className="flex-1 ml-3">
            <Text className="text-sm font-semibold text-foreground">Auto-Import from Cloud</Text>
            <Text className="text-xs text-muted mt-1">Automatically import data synced from other devices</Text>
          </View>
          <View
            style={{
              width: 50,
              height: 28,
              borderRadius: 14,
              backgroundColor: autoImportEnabled ? colors.success : colors.border,
              justifyContent: "center",
              paddingHorizontal: 2,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "white",
                marginLeft: autoImportEnabled ? 24 : 0,
              }}
            />
          </View>
        </TouchableOpacity>
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
